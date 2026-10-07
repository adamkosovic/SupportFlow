using System.Net.Security;
using System.Net.Sockets;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SupportFlow.Api.Data;
using SupportFlow.Api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;

        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Tillfällig felsökning av databasens TLS-certifikat i Azure.
if (app.Environment.IsProduction())
{
    await CheckDatabaseTlsAsync(app.Configuration, app.Logger);
}

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();

    var roleManager = scope.ServiceProvider
        .GetRequiredService<RoleManager<IdentityRole>>();

    var userManager = scope.ServiceProvider
        .GetRequiredService<UserManager<ApplicationUser>>();

    const string supportRole = "Support";

    if (!await roleManager.RoleExistsAsync(supportRole))
    {
        var result = await roleManager.CreateAsync(
            new IdentityRole(supportRole)
        );

        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                string.Join(
                    "; ",
                    result.Errors.Select(error => error.Description)
                )
            );
        }
    }

    var supportEmail = builder.Configuration["Seed:SupportEmail"];

    if (!string.IsNullOrWhiteSpace(supportEmail))
    {
        var user = await userManager.FindByEmailAsync(supportEmail);

        if (user is null)
        {
            app.Logger.LogWarning(
                "Supportkontot finns inte. Registrera kontot och starta om API:et."
            );
        }
        else if (!await userManager.IsInRoleAsync(user, supportRole))
        {
            var result = await userManager.AddToRoleAsync(
                user,
                supportRole
            );

            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    string.Join(
                        "; ",
                        result.Errors.Select(error => error.Description)
                    )
                );
            }
        }
    }

    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/openapi/v1.json",
            "SupportFlow API"
        );
    });
}

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGroup("/api/auth")
    .MapIdentityApi<ApplicationUser>();

app.MapGet("/api/auth/me", async (
    ClaimsPrincipal principal,
    UserManager<ApplicationUser> userManager) =>
{
    var user = await userManager.GetUserAsync(principal);

    if (user is null)
    {
        return Results.Unauthorized();
    }

    var roles = await userManager.GetRolesAsync(user);

    return Results.Ok(new
    {
        id = user.Id,
        email = user.Email,
        roles
    });
})
.RequireAuthorization();

app.MapPost("/api/auth/logout", async (
    SignInManager<ApplicationUser> signInManager) =>
{
    await signInManager.SignOutAsync();

    return Results.NoContent();
})
.RequireAuthorization();

app.MapFallback("/api/{**path}", () => Results.NotFound());

app.MapFallbackToFile("index.html");

app.Run();

static async Task CheckDatabaseTlsAsync(
    IConfiguration configuration,
    ILogger logger)
{
    try
    {
        var connectionString =
            configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            logger.LogError(
                "TLS-DIAG: DefaultConnection saknas."
            );
            return;
        }

        var settings = new NpgsqlConnectionStringBuilder(
            connectionString
        );

        if (string.IsNullOrWhiteSpace(settings.Host))
        {
            logger.LogError("TLS-DIAG: Databasens servernamn saknas.");
            return;
        }

        var rootPath = settings.RootCertificate
            ?? Environment.GetEnvironmentVariable("PGSSLROOTCERT");

        logger.LogWarning(
            "TLS-DIAG: Host={Host}, Port={Port}, SSL={SslMode}, Root={Root}",
            settings.Host,
            settings.Port,
            settings.SslMode,
            rootPath
        );

        if (string.IsNullOrWhiteSpace(rootPath) ||
            !File.Exists(rootPath))
        {
            logger.LogError(
                "TLS-DIAG: Certifikatfilen saknas."
            );
            return;
        }

        var roots = new X509Certificate2Collection();
        roots.ImportFromPemFile(rootPath);

        try
        {
            foreach (var root in roots)
            {
                logger.LogWarning(
                    "TLS-DIAG: Betrott rotcertifikat={Subject}",
                    root.Subject
                );
            }

            using var timeout =
                new CancellationTokenSource(TimeSpan.FromSeconds(15));

            using var client = new TcpClient();

            await client.ConnectAsync(
                settings.Host,
                settings.Port,
                timeout.Token
            );

            using var network = client.GetStream();

            // PostgreSQL SSLRequest: längd 8, kod 80877103.
            byte[] sslRequest = [0, 0, 0, 8, 4, 210, 22, 47];

            await network.WriteAsync(sslRequest, timeout.Token);

            var response = new byte[1];

            await network.ReadExactlyAsync(response, timeout.Token);

            if (response[0] != (byte)'S')
            {
                logger.LogError(
                    "TLS-DIAG: Servern accepterade inte TLS."
                );
                return;
            }

            using var ssl = new SslStream(
                network,
                leaveInnerStreamOpen: false,
                (_, certificate, chain, errors) =>
                {
                    logger.LogWarning(
                        "TLS-DIAG: Ursprungliga certifikatfel={Errors}",
                        errors
                    );

                    if (certificate is null || chain is null)
                    {
                        logger.LogError(
                            "TLS-DIAG: Servercertifikat eller kedja saknas."
                        );
                        return false;
                    }

                    using var serverCertificate =
                        new X509Certificate2(certificate);

                    logger.LogWarning(
                        "TLS-DIAG: Servercertifikat={Subject}, Utfärdare={Issuer}",
                        serverCertificate.Subject,
                        serverCertificate.Issuer
                    );

                    chain.ChainPolicy.CustomTrustStore.AddRange(roots);
                    chain.ChainPolicy.ExtraStore.AddRange(roots);
                    chain.ChainPolicy.TrustMode =
                        X509ChainTrustMode.CustomRootTrust;

                    var chainValid = chain.Build(serverCertificate);

                    foreach (var status in chain.ChainStatus)
                    {
                        logger.LogWarning(
                            "TLS-DIAG: Kedjefel={Status}, Information={Information}",
                            status.Status,
                            status.StatusInformation.Trim()
                        );
                    }

                    var nameValid = !errors.HasFlag(
                        SslPolicyErrors.RemoteCertificateNameMismatch
                    );

                    logger.LogWarning(
                        "TLS-DIAG: Kedja godkänd={ChainValid}, Servernamn godkänt={NameValid}",
                        chainValid,
                        nameValid
                    );

                    return chainValid && nameValid;
                }
            );

            await ssl.AuthenticateAsClientAsync(
                new SslClientAuthenticationOptions
                {
                    TargetHost = settings.Host,
                    CertificateRevocationCheckMode =
                        settings.CheckCertificateRevocation
                            ? X509RevocationMode.Online
                            : X509RevocationMode.Offline
                },
                timeout.Token
            );

            logger.LogWarning(
                "TLS-DIAG: TLS-kontrollen lyckades."
            );
        }
        finally
        {
            foreach (var root in roots)
            {
                root.Dispose();
            }
        }
    }
    catch (Exception exception)
    {
        // Logga inte anslutningssträngen eller databaslösenordet.
        logger.LogError(
            "TLS-DIAG: Kontrollen misslyckades. Typ={Type}, Orsak={Message}",
            exception.GetType().Name,
            exception.Message
        );
    }
}