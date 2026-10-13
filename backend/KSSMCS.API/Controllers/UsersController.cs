using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSSMCS.API.DTOs;
using KSSMCS.API.Services;

namespace KSSMCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService service, ILogger<UsersController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string CurrentUserRole =>
        User.FindFirstValue(ClaimTypes.Role) ?? "";

    /// <summary>Get all users (principal and admin only)</summary>
    [HttpGet]
    [Authorize(Roles = "principal,admin")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var users = await _service.GetAllAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching users");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Get a single user by ID</summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "principal,admin")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var user = await _service.GetByIdAsync(id);
            if (user == null)
                return NotFound(new { message = $"User {id} not found." });
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Create a new staff user (principal and admin only)</summary>
    [HttpPost]
    [Authorize(Roles = "principal,admin")]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        try
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var created = await _service.CreateAsync(dto, CurrentUserRole);
            _logger.LogInformation(
                "User created: {Email} (role: {Role}) by {CreatorRole}",
                created.Email, created.Role, CurrentUserRole);

            return CreatedAtAction(nameof(GetById), new { id = created.UserId }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Activate or deactivate a user</summary>
    [HttpPut("{id:guid}/toggle-active")]
    [Authorize(Roles = "principal,admin")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        try
        {
            var updated = await _service.ToggleActiveAsync(id, CurrentUserId);
            if (updated == null)
                return NotFound(new { message = $"User {id} not found." });
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling user {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }

    /// <summary>Delete a user (principal only)</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "principal")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id, CurrentUserId);
            if (!deleted)
                return NotFound(new { message = $"User {id} not found." });
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {Id}", id);
            return StatusCode(500, new { message = "An error occurred." });
        }
    }
}