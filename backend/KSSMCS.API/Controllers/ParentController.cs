using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSSMCS.API.Services;

namespace KSSMCS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "parent")]
public class ParentController : ControllerBase
{
    private readonly IParentService _parentService;
    private readonly ILogger<ParentController> _logger;

    public ParentController(IParentService parentService, ILogger<ParentController> logger)
    {
        _parentService = parentService;
        _logger = logger;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Get the parent's full dashboard (child, incidents, attendance, messages)</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        try
        {
            var dashboard = await _parentService.GetDashboardAsync(CurrentUserId);
            return Ok(dashboard);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching parent dashboard");
            return StatusCode(500, new { message = "An error occurred while loading the dashboard." });
        }
    }
}