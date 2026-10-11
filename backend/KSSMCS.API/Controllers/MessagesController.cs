using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSSMCS.API.DTOs;
using KSSMCS.API.Services;

namespace KSSMCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _service;
    private readonly ILogger<MessagesController> _logger;

    public MessagesController(IMessageService service, ILogger<MessagesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool IsPrincipal =>
        User.IsInRole("principal");

    /// <summary>Get my inbox</summary>
    [HttpGet("inbox")]
    public async Task<IActionResult> Inbox()
    {
        try
        {
            var messages = await _service.GetInboxAsync(CurrentUserId);
            return Ok(messages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching inbox");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get my sent messages</summary>
    [HttpGet("sent")]
    public async Task<IActionResult> Sent()
    {
        try
        {
            var messages = await _service.GetSentAsync(CurrentUserId);
            return Ok(messages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching sent messages");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get unread message count (for dashboard badge)</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        try
        {
            var count = await _service.GetUnreadCountAsync(CurrentUserId);
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get a single message by ID (sender or receiver only)</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var message = await _service.GetByIdAsync(id, CurrentUserId);
            if (message == null)
                return NotFound(new { message = "Message not found." });
            return Ok(message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching message {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Send a message to another user</summary>
    [HttpPost]
    public async Task<IActionResult> Send([FromBody] SendMessageDto dto)
    {
        try
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var created = await _service.SendAsync(dto, CurrentUserId);
            _logger.LogInformation(
                "Message sent from {SenderId} to {ReceiverId}",
                CurrentUserId, dto.ReceiverId);

            return Ok(created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Mark a message as read (receiver only)</summary>
    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        try
        {
            var success = await _service.MarkAsReadAsync(id, CurrentUserId);
            if (!success)
                return NotFound(new { message = "Message not found or you are not the receiver." });
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking message {Id} as read", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Delete a message (sender or principal only)</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var success = await _service.DeleteAsync(id, CurrentUserId, IsPrincipal);
            if (!success)
                return NotFound(new { message = "Message not found or you cannot delete it." });
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting message {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get total message count</summary>
    [HttpGet("count")]
    public async Task<IActionResult> Count()
    {
        try
        {
            return Ok(new { count = await _service.CountAsync() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error counting messages");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }
}