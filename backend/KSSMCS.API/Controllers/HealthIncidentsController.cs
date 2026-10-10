using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSSMCS.API.DTOs;
using KSSMCS.API.Services;

namespace KSSMCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HealthIncidentsController : ControllerBase
{
    private readonly IHealthIncidentService _service;
    private readonly ILogger<HealthIncidentsController> _logger;

    public HealthIncidentsController(
        IHealthIncidentService service,
        ILogger<HealthIncidentsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Get all health incidents (all authenticated users)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? recentDays)
    {
        try
        {
            if (recentDays.HasValue)
            {
                var recent = await _service.GetRecentAsync(recentDays.Value);
                return Ok(recent);
            }

            var incidents = await _service.GetAllAsync();
            return Ok(incidents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching health incidents");
            return StatusCode(500, new { message = "An error occurred while fetching incidents." });
        }
    }

    /// <summary>Get a single health incident by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var incident = await _service.GetByIdAsync(id);
            if (incident == null)
                return NotFound(new { message = $"Health incident with ID {id} not found." });
            return Ok(incident);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching incident {Id}", id);
            return StatusCode(500, new { message = "An error occurred while fetching the incident." });
        }
    }

    /// <summary>Get all health incidents for a specific learner</summary>
    [HttpGet("learner/{learnerId:guid}")]
    public async Task<IActionResult> GetByLearner(Guid learnerId)
    {
        try
        {
            var incidents = await _service.GetByLearnerIdAsync(learnerId);
            return Ok(incidents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching incidents for learner {LearnerId}", learnerId);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get incidents reported by the current user</summary>
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        try
        {
            var incidents = await _service.GetByReporterIdAsync(CurrentUserId);
            return Ok(incidents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching my incidents");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Log a new health incident (Principal, Admin, Teacher)</summary>
    [HttpPost]
    [Authorize(Roles = "principal,admin,teacher")]
    public async Task<IActionResult> Create([FromBody] CreateHealthIncidentDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _service.CreateAsync(dto, CurrentUserId);
            _logger.LogInformation(
                "Health incident logged for learner {LearnerId} by user {UserId}",
                dto.LearnerId, CurrentUserId);

            return CreatedAtAction(nameof(GetById), new { id = created.IncidentId }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating health incident");
            return StatusCode(500, new { message = "An error occurred while logging the incident." });
        }
    }

    /// <summary>Update an existing incident (Principal, Admin, Teacher)</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "principal,admin,teacher")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHealthIncidentDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _service.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = $"Health incident with ID {id} not found." });
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating incident {Id}", id);
            return StatusCode(500, new { message = "An error occurred while updating the incident." });
        }
    }

    /// <summary>Delete an incident (Principal only)</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "principal")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Health incident with ID {id} not found." });
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting incident {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get total incident count</summary>
    [HttpGet("count")]
    public async Task<IActionResult> Count()
    {
        try
        {
            var count = await _service.CountAsync();
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error counting incidents");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }
}