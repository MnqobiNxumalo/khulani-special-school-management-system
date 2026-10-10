using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSSMCS.API.DTOs;
using KSSMCS.API.Services;

namespace KSSMCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _service;
    private readonly ILogger<AttendanceController> _logger;

    public AttendanceController(IAttendanceService service, ILogger<AttendanceController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Get all attendance records</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateTime? date,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        try
        {
            if (date.HasValue)
                return Ok(await _service.GetByDateAsync(date.Value));

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
            _logger.LogError(ex, "Error fetching attendance");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get a single attendance record by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var record = await _service.GetByIdAsync(id);
            if (record == null)
                return NotFound(new { message = $"Attendance record {id} not found." });
            return Ok(record);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching attendance {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get all attendance records for a specific learner</summary>
    [HttpGet("learner/{learnerId:guid}")]
    public async Task<IActionResult> GetByLearner(Guid learnerId)
    {
        try
        {
            var records = await _service.GetByLearnerIdAsync(learnerId);
            return Ok(records);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching attendance for learner {LearnerId}", learnerId);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get daily attendance summary (present/absent/late counts)</summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? date)
    {
        try
        {
            var target = date ?? DateTime.UtcNow;
            var summary = await _service.GetSummaryForDateAsync(target);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting attendance summary");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Mark attendance for a learner (Principal, Admin, Teacher)</summary>
    [HttpPost]
    [Authorize(Roles = "principal,admin,teacher")]
    public async Task<IActionResult> Mark([FromBody] MarkAttendanceDto dto)
    {
        try
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var created = await _service.MarkAsync(dto, CurrentUserId);
            _logger.LogInformation(
                "Attendance marked for learner {LearnerId} as {Status}",
                dto.LearnerId, dto.Status);

            return CreatedAtAction(nameof(GetById), new { id = created.AttendanceId }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking attendance");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Update an attendance record (Principal, Admin, Teacher)</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "principal,admin,teacher")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAttendanceDto dto)
    {
        try
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var updated = await _service.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = $"Attendance {id} not found." });
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating attendance {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Delete an attendance record (Principal only)</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "principal")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Attendance {id} not found." });
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting attendance {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get total attendance count</summary>
    [HttpGet("count")]
    public async Task<IActionResult> Count()
    {
        try
        {
            return Ok(new { count = await _service.CountAsync() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error counting attendance");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }
}