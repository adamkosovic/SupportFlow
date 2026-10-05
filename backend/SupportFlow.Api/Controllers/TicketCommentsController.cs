using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Api.Data;
using SupportFlow.Api.Models;

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

    private async Task<bool> CanAccessTicket(
        int ticketId,
        string userId,
        CancellationToken cancellationToken)
    {
        var isSupport = User.IsInRole("Support");

        return await _context.Tickets.AnyAsync(
            ticket => ticket.Id == ticketId &&
                (isSupport || ticket.CreatedByUserId == userId),
            cancellationToken);
    }

    [HttpGet]
    public async Task<ActionResult<List<TicketCommentResponse>>> GetComments(
        int ticketId,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (!await CanAccessTicket(ticketId, userId, cancellationToken))
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
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        if (!await CanAccessTicket(ticketId, userId, cancellationToken))
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new
            {
                message = "Kommentaren får inte vara tom."
            });
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