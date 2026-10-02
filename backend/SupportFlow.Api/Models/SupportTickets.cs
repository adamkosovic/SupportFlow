namespace SupportFlow.Api.Models;

public class SupportTicket
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Status { get; set; } = "Nytt";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}