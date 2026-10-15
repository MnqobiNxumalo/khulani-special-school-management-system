using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSSMCS.API.DTOs;
using KSSMCS.API.Services;

namespace KSSMCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LearnersController : ControllerBase
{
    private readonly ILearnerService _learnerService;
    private readonly ILogger<LearnersController> _logger;

    public LearnersController(ILearnerService learnerService, ILogger<LearnersController> logger)
    {
        _learnerService = learnerService;
        _logger = logger;
    }

    /// <summary>
    /// Get learners — teachers see only their assigned learners, principal/admin see all
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        try
        {
            // Determine current user role and id
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            IEnumerable<LearnerResponseDto> learners;

            if (role == "teacher" && Guid.TryParse(userIdStr, out var teacherId))
            {
                // Teachers see ONLY learners assigned to them
                learners = await _learnerService.GetForTeacherAsync(teacherId);
            }
            else
            {
                // Principal/Admin see all (with optional search)
                learners = string.IsNullOrWhiteSpace(search)
                    ? await _learnerService.GetAllAsync()
                    : await _learnerService.SearchAsync(search);
            }

            return Ok(learners);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching learners");
            return StatusCode(500, new { message = "An error occurred while fetching learners." });
        }
    }

    /// <summary>
    /// Get a single learner by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var learner = await _learnerService.GetByIdAsync(id);
            if (learner == null)
            {
                return NotFound(new { message = $"Learner with ID {id} not found." });
            }
            return Ok(learner);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching learner {Id}", id);
            return StatusCode(500, new { message = "An error occurred while fetching the learner." });
        }
    }

    /// <summary>
    /// Create a new learner (Principal, Admin, Teacher).
    /// Teachers are automatically assigned as the learner's teacher.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "principal,admin,teacher")]
    public async Task<IActionResult> Create([FromBody] CreateLearnerDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // If a teacher creates a learner, auto-assign it to themselves
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";
            if (role == "teacher" && !dto.AssignedTeacherId.HasValue)
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(userIdStr, out var teacherId))
                {
                    dto.AssignedTeacherId = teacherId;
                }
            }

            var created = await _learnerService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.LearnerId }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating learner");
            return StatusCode(500, new { message = "An error occurred while creating the learner." });
        }
    }

    /// <summary>
    /// Update an existing learner (Principal, Admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "principal,admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLearnerDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updated = await _learnerService.UpdateAsync(id, dto);
            if (updated == null)
            {
                return NotFound(new { message = $"Learner with ID {id} not found." });
            }
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating learner {Id}", id);
            return StatusCode(500, new { message = "An error occurred while updating the learner." });
        }
    }

    /// <summary>
    /// Delete a learner (Principal only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "principal")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _learnerService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { message = $"Learner with ID {id} not found." });
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting learner {Id}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the learner." });
        }
    }

    /// <summary>
    /// Get learner count (dashboard summary)
    /// </summary>
    [HttpGet("count")]
    public async Task<IActionResult> Count()
    {
        try
        {
            var count = await _learnerService.CountAsync();
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error counting learners");
            return StatusCode(500, new { message = "An error occurred while counting learners." });
        }
    }
}