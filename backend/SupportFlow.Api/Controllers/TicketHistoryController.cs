using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;

namespace SupportFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets/{ticketId:int}/history")]
public class TicketHistoryController : ControllerBase
{
    private readonly AppDbContext _context;

    public TicketHistoryController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<TicketHistoryResponse>>> GetAll(
        int ticketId,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var isSupport = User.IsInRole("Support");

        var canAccess = await _context.Tickets
            .AnyAsync(
                ticket =>
                    ticket.Id == ticketId &&
                    (isSupport || ticket.CreatedByUserId == userId),
                cancellationToken);

        if (!canAccess)
        {
            return NotFound();
        }

        var history = await _context.TicketHistories
            .AsNoTracking()
            .Where(item => item.SupportTicketId == ticketId)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .Select(item => new TicketHistoryResponse
            {
                Id = item.Id,
                Action = item.Action,
                OldValue = item.OldValue,
                NewValue = item.NewValue,
                ChangedByEmail = item.ChangedByEmail,
                CreatedAt = item.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(history);
    }
}

public class TicketHistoryResponse
{
    public int Id { get; set; }

    public string Action { get; set; } = string.Empty;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public string? ChangedByEmail { get; set; }

    public DateTime CreatedAt { get; set; }
}