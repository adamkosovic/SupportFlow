namespace SupportFlow.Api.Models;

public class SupportTicket
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Status { get; set; } = "Nytt";

    public string Priority { get; set; } = "Normal";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? CreatedByUserId { get; set; }

    public string? AssignedToUserId { get; set; }

    public ApplicationUser? AssignedToUser { get; set; }
}