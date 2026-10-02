using Microsoft.AspNetCore.Mvc;
using SupportFlow.Api.Models;

namespace SupportFlow.Api.Controllers;

[ApiController]
[Route("api/tickets")]
public class SupportTicketsController : ControllerBase
{
    private static readonly List<SupportTicket> Tickets = new();

    [HttpGet]
    public ActionResult<List<SupportTicket>> GetAll()
    {
        return Ok(Tickets);
    }

    [HttpGet("{id:int}")]
    public ActionResult<SupportTicket> GetById(int id)
    {
        var ticket = Tickets.FirstOrDefault(ticket => ticket.Id == id);

        if (ticket is null)
        {
            return NotFound();
        }

        return Ok(ticket);
    }

    [HttpPost]
    public ActionResult<SupportTicket> Create(CreateTicketRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest("Rubrik och beskrivning måste fyllas i.");
        }

        var ticket = new SupportTicket
        {
            Id = Tickets.Count == 0
                ? 1
                : Tickets.Max(ticket => ticket.Id) + 1,
            Title = request.Title.Trim(),
            Description = request.Description.Trim()
        };

        Tickets.Add(ticket);

        return CreatedAtAction(
            nameof(GetById),
            new { id = ticket.Id },
            ticket
        );
    }
}

public class CreateTicketRequest
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}