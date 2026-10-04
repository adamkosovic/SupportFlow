using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<SupportTicket> Tickets => Set<SupportTicket>();
    public DbSet<TicketComment> Comments => Set<TicketComment>();
}