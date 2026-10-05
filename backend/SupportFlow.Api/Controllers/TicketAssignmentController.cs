using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;

namespace SupportFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets/{ticketId:int}/assignment")]
public class TicketAssignmentController : ControllerBase
{
    private readonly AppDbContext _context;

    public TicketAssignmentController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAssignment(
        int ticketId,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var isSupport = User.IsInRole("Support");

        var assignment = await _context.Tickets
            .AsNoTracking()
            .Where(ticket =>
                ticket.Id == ticketId &&
                (isSupport || ticket.CreatedByUserId == userId))
            .Select(ticket => new
            {
                userId = ticket.AssignedToUserId,
                email = ticket.AssignedToUser != null
                    ? ticket.AssignedToUser.Email
                    : null
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (assignment is null)
        {
            return NotFound();
        }

        return Ok(assignment);
    }

    [Authorize(Roles = "Support")]
    [HttpPut("me")]
    public async Task<IActionResult> AssignToMe(
        int ticketId,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var userExists = await _context.Users
            .AnyAsync(user => user.Id == userId, cancellationToken);

        if (!userExists)
        {
            return Unauthorized();
        }

        // Tilldela bara om ärendet är ledigt eller redan tillhör mig.
        var updated = await _context.Tickets
            .Where(ticket =>
                ticket.Id == ticketId &&
                (ticket.AssignedToUserId == null ||
                 ticket.AssignedToUserId == userId))
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    ticket => ticket.AssignedToUserId,
                    userId),
                cancellationToken);

        if (updated > 0)
        {
            return NoContent();
        }

        var ticketExists = await _context.Tickets
            .AnyAsync(ticket => ticket.Id == ticketId, cancellationToken);

        if (!ticketExists)
        {
            return NotFound();
        }

        return Conflict(new
        {
            message = "Ärendet har redan en annan handläggare."
        });
    }

    [Authorize(Roles = "Support")]
    [HttpDelete("me")]
    public async Task<IActionResult> ReleaseAssignment(
        int ticketId,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var updated = await _context.Tickets
            .Where(ticket =>
                ticket.Id == ticketId &&
                ticket.AssignedToUserId == userId)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    ticket => ticket.AssignedToUserId,
                    (string?)null),
                cancellationToken);

        if (updated > 0)
        {
            return NoContent();
        }

        var ticketExists = await _context.Tickets
            .AnyAsync(ticket => ticket.Id == ticketId, cancellationToken);

        if (!ticketExists)
        {
            return NotFound();
        }

        return Conflict(new
        {
            message = "Du är inte tilldelad detta ärende."
        });
    }
}