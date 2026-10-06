using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.Models;

public class TicketHistory
{
    public int Id { get; set; }

    public int SupportTicketId { get; set; }

    public SupportTicket SupportTicket { get; set; } = null!;

    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(256)]
    public string? OldValue { get; set; }

    [MaxLength(256)]
    public string? NewValue { get; set; }

    public string? ChangedByUserId { get; set; }

    [MaxLength(256)]
    public string? ChangedByEmail { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}