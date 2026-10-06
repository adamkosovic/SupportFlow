using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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
                string.Join("; ", result.Errors.Select(error => error.Description))
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
            var result = await userManager.AddToRoleAsync(user, supportRole);

            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    string.Join("; ", result.Errors.Select(error => error.Description))
                );
            }
        }
    }
}

if (app.Environment.IsDevelopment())
{
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