using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets")]
public class SupportTicketsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SupportTicketsController(AppDbContext context)
    {
        _context = context;
    }

    private IQueryable<SupportTicket> AccessibleTickets(string userId)
    {
        var query = _context.Tickets.AsQueryable();

        if (!User.IsInRole("Support"))
        {
            query = query.Where(ticket => ticket.CreatedByUserId == userId);
        }

        return query;
    }

    [HttpGet]
    public async Task<ActionResult<List<SupportTicket>>> GetAll(
        [FromQuery] string assignment = "all",
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var allowedFilters = new[] { "all", "mine", "unassigned" };

        if (!allowedFilters.Contains(assignment))
        {
            return BadRequest(new
            {
                message = "Tilldelningsfiltret måste vara all, mine eller unassigned."
            });
        }

        if (assignment != "all" && !User.IsInRole("Support"))
        {
            return Forbid();
        }

        var query = AccessibleTickets(userId).AsNoTracking();

        if (assignment == "mine")
        {
            query = query.Where(ticket =>
                ticket.AssignedToUserId == userId);
        }
        else if (assignment == "unassigned")
        {
            query = query.Where(ticket =>
                ticket.AssignedToUserId == null);
        }

        var tickets = await query
            .OrderByDescending(ticket => ticket.CreatedAt)
            .ThenByDescending(ticket => ticket.Id)
            .ToListAsync(cancellationToken);

        return Ok(tickets);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SupportTicket>> GetById(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var ticket = await AccessibleTickets(userId)
            .AsNoTracking()
            .FirstOrDefaultAsync(ticket => ticket.Id == id);

        if (ticket is null)
        {
            return NotFound();
        }

        return Ok(ticket);
    }

    [HttpPost]
    public async Task<ActionResult<SupportTicket>> Create(
        CreateTicketRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest("Rubrik och beskrivning måste fyllas i.");
        }

        var allowedPriorities = new[] { "Låg", "Normal", "Hög" };

        if (!allowedPriorities.Contains(request.Priority))
        {
            return BadRequest(new
            {
                message = "Prioriteten måste vara Låg, Normal eller Hög."
            });
        }

        var ticket = new SupportTicket
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Priority = request.Priority,
            CreatedByUserId = userId
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = ticket.Id },
            ticket
        );
    }

    [Authorize(Roles = "Support")]
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<SupportTicket>> UpdateStatus(
        int id,
        UpdateTicketStatusRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var allowedStatuses = new[] { "Nytt", "Pågår", "Löst" };

        if (!allowedStatuses.Contains(request.Status))
        {
            return BadRequest(new
            {
                message = "Status måste vara Nytt, Pågår eller Löst."
            });
        }

        var ticket = await _context.Tickets
            .FirstOrDefaultAsync(
                ticket => ticket.Id == id,
                cancellationToken);

        if (ticket is null)
        {
            return NotFound();
        }

        if (ticket.Status == request.Status)
        {
            return Ok(ticket);
        }

        var email = await _context.Users
            .Where(user => user.Id == userId)
            .Select(user => user.Email)
            .FirstOrDefaultAsync(cancellationToken);

        _context.TicketHistories.Add(new TicketHistory
        {
            SupportTicketId = ticket.Id,
            Action = "StatusChanged",
            OldValue = ticket.Status,
            NewValue = request.Status,
            ChangedByUserId = userId,
            ChangedByEmail = email
        });

        ticket.Status = request.Status;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ticket);
    }

    [Authorize(Roles = "Support")]
    [HttpPatch("{id:int}/priority")]
    public async Task<ActionResult<SupportTicket>> UpdatePriority(
        int id,
        UpdateTicketPriorityRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var allowedPriorities = new[] { "Låg", "Normal", "Hög" };

        if (!allowedPriorities.Contains(request.Priority))
        {
            return BadRequest(new
            {
                message = "Prioriteten måste vara Låg, Normal eller Hög."
            });
        }

        var ticket = await _context.Tickets
            .FirstOrDefaultAsync(
                ticket => ticket.Id == id,
                cancellationToken);

        if (ticket is null)
        {
            return NotFound();
        }

        if (ticket.Priority == request.Priority)
        {
            return Ok(ticket);
        }

        var email = await _context.Users
            .Where(user => user.Id == userId)
            .Select(user => user.Email)
            .FirstOrDefaultAsync(cancellationToken);

        _context.TicketHistories.Add(new TicketHistory
        {
            SupportTicketId = ticket.Id,
            Action = "PriorityChanged",
            OldValue = ticket.Priority,
            NewValue = request.Priority,
            ChangedByUserId = userId,
            ChangedByEmail = email
        });

        ticket.Priority = request.Priority;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ticket);
    }
}

public class CreateTicketRequest
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Priority { get; set; } = "Normal";
}

public class UpdateTicketStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class UpdateTicketPriorityRequest
{
    public string Priority { get; set; } = string.Empty;
}