using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.Models;
using Microsoft.AspNetCore.Authorization;

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

    [HttpGet]
    public async Task<ActionResult<List<SupportTicket>>> GetAll()
    {
        var tickets = await _context.Tickets
            .AsNoTracking()
            .OrderByDescending(ticket => ticket.CreatedAt)
            .ToListAsync();

        return Ok(tickets);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SupportTicket>> GetById(int id)
    {
        var ticket = await _context.Tickets
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
            Priority = request.Priority
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = ticket.Id },
            ticket
        );
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<SupportTicket>> UpdateStatus(
        int id,
        UpdateTicketStatusRequest request)
    {
        var allowedStatuses = new[] { "Nytt", "Pågår", "Löst" };

        if (!allowedStatuses.Contains(request.Status))
        {
            return BadRequest("Status måste vara Nytt, Pågår eller Löst.");
        }

        var ticket = await _context.Tickets.FindAsync(id);

        if (ticket is null)
        {
            return NotFound();
        }

        ticket.Status = request.Status;
        await _context.SaveChangesAsync();

        return Ok(ticket);
    }

    [HttpPatch("{id:int}/priority")]
    public async Task<ActionResult<SupportTicket>> UpdatePriority(
        int id,
        UpdateTicketPriorityRequest request,
        CancellationToken cancellationToken)
    {
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