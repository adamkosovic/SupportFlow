using System.ComponentModel.DataAnnotations;

namespace SupportFlow.Api.Models;

public class TicketComment
{
    public int Id { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int SupportTicketId { get; set; }

    public SupportTicket SupportTicket { get; set; } = null!;
}