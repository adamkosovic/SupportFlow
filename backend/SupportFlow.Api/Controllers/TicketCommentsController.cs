using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace SupportFlow.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/tickets/{ticketId:int}/comments")]
public class TicketCommentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TicketCommentsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<TicketCommentResponse>>> GetComments(
        int ticketId,
        CancellationToken cancellationToken)
    {
        var ticketExists = await _context.Tickets
            .AnyAsync(ticket => ticket.Id == ticketId, cancellationToken);

        if (!ticketExists)
        {
            return NotFound();
        }

        var comments = await _context.Comments
            .AsNoTracking()
            .Where(comment => comment.SupportTicketId == ticketId)
            .OrderBy(comment => comment.CreatedAt)
            .ThenBy(comment => comment.Id)
            .Select(comment => new TicketCommentResponse
            {
                Id = comment.Id,
                Text = comment.Text,
                CreatedAt = comment.CreatedAt,
                SupportTicketId = comment.SupportTicketId
            })
            .ToListAsync(cancellationToken);

        return Ok(comments);
    }

    [HttpPost]
    public async Task<ActionResult<TicketCommentResponse>> CreateComment(
        int ticketId,
        CreateTicketCommentRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new
            {
                message = "Kommentaren får inte vara tom."
            });
        }

        var ticketExists = await _context.Tickets
            .AnyAsync(ticket => ticket.Id == ticketId, cancellationToken);

        if (!ticketExists)
        {
            return NotFound();
        }

        var comment = new TicketComment
        {
            Text = request.Text.Trim(),
            SupportTicketId = ticketId
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync(cancellationToken);

        var response = new TicketCommentResponse
        {
            Id = comment.Id,
            Text = comment.Text,
            CreatedAt = comment.CreatedAt,
            SupportTicketId = comment.SupportTicketId
        };

        return StatusCode(StatusCodes.Status201Created, response);
    }
}

public class CreateTicketCommentRequest
{
    [Required]
    [MaxLength(2000)]
    public string Text { get; set; } = string.Empty;
}

public class TicketCommentResponse
{
    public int Id { get; set; }

    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public int SupportTicketId { get; set; }
}