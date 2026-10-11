using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSSMCS.API.DTOs;
using KSSMCS.API.Services;

namespace KSSMCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VisitorsController : ControllerBase
{
    private readonly IVisitorService _service;
    private readonly ILogger<VisitorsController> _logger;

    public VisitorsController(IVisitorService service, ILogger<VisitorsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Get all visitors (optionally filter by date range)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        try
        {
            if (from.HasValue && to.HasValue)
                return Ok(await _service.GetByDateRangeAsync(from.Value, to.Value));

            return Ok(await _service.GetAllAsync());
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching visitors");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get a single visitor record</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var visitor = await _service.GetByIdAsync(id);
            if (visitor == null)
                return NotFound(new { message = $"Visitor {id} not found." });
            return Ok(visitor);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching visitor {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get currently checked-in visitors (on-site)</summary>
    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        try
        {
            return Ok(await _service.GetActiveAsync());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching active visitors");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get today's visitors</summary>
    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        try
        {
            return Ok(await _service.GetTodayAsync());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching today's visitors");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Register a visitor's arrival (all authenticated users)</summary>
    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInVisitorDto dto)
    {
        try
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var visitor = await _service.CheckInAsync(dto, CurrentUserId);
            _logger.LogInformation(
                "Visitor checked in: {Name} for {Purpose}",
                dto.FullName, dto.Purpose);

            return Ok(visitor);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during visitor check-in");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Register a visitor's departure (all authenticated users)</summary>
    [HttpPut("{id:guid}/checkout")]
    public async Task<IActionResult> CheckOut(Guid id)
    {
        try
        {
            var visitor = await _service.CheckOutAsync(id);
            if (visitor == null)
                return NotFound(new { message = $"Visitor {id} not found." });
            return Ok(visitor);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during visitor check-out");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Delete a visitor record (Principal only)</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "principal")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Visitor {id} not found." });
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting visitor {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get total visitor count</summary>
    [HttpGet("count")]
    public async Task<IActionResult> Count()
    {
        try
        {
            return Ok(new { count = await _service.CountAsync() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error counting visitors");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }
}