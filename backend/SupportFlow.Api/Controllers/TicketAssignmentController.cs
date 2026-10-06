using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.Models;

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

        var user = await _context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => new { user.Email })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            return Unauthorized();
        }

        await using var transaction = await _context.Database
            .BeginTransactionAsync(cancellationToken);

        // Endast ett ledigt ärende kan få en ny handläggare.
        var updated = await _context.Tickets
            .Where(ticket =>
                ticket.Id == ticketId &&
                ticket.AssignedToUserId == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    ticket => ticket.AssignedToUserId,
                    userId),
                cancellationToken);

        if (updated > 0)
        {
            _context.TicketHistories.Add(new TicketHistory
            {
                SupportTicketId = ticketId,
                Action = "Assigned",
                OldValue = null,
                NewValue = user.Email,
                ChangedByUserId = userId,
                ChangedByEmail = user.Email
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return NoContent();
        }

        var ticket = await _context.Tickets
            .AsNoTracking()
            .Where(ticket => ticket.Id == ticketId)
            .Select(ticket => new { ticket.AssignedToUserId })
            .FirstOrDefaultAsync(cancellationToken);

        if (ticket is null)
        {
            return NotFound();
        }

        // Ärendet tillhör redan mig: ingen ändring eller ny historik.
        if (ticket.AssignedToUserId == userId)
        {
            return NoContent();
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

        var user = await _context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => new { user.Email })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            return Unauthorized();
        }

        await using var transaction = await _context.Database
            .BeginTransactionAsync(cancellationToken);

        // Jag kan endast släppa ärenden som är tilldelade mig.
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
            _context.TicketHistories.Add(new TicketHistory
            {
                SupportTicketId = ticketId,
                Action = "AssignmentReleased",
                OldValue = user.Email,
                NewValue = null,
                ChangedByUserId = userId,
                ChangedByEmail = user.Email
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return NoContent();
        }

        var ticketExists = await _context.Tickets
            .AnyAsync(
                ticket => ticket.Id == ticketId,
                cancellationToken);

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