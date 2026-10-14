using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSSMCS.API.DTOs;
using KSSMCS.API.Services;

namespace KSSMCS.API.Controllers;

[ApiController]
[Route("api/publicvisitor")]
[AllowAnonymous]
public class PublicVisitorController : ControllerBase
{
    private readonly IVisitorService _service;
    private readonly ILogger<PublicVisitorController> _logger;

    public PublicVisitorController(IVisitorService service, ILogger<PublicVisitorController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Public self-service visitor check-in (kiosk mode).
    /// No authentication required.
    /// </summary>
    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn([FromBody] PublicCheckInDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var visitor = await _service.PublicCheckInAsync(dto);

            _logger.LogInformation("Kiosk check-in: {Name} - {Purpose}", dto.FullName, dto.Purpose);

            return Ok(new
            {
                visitorId = visitor.VisitorId,
                fullName = visitor.FullName,
                checkInTime = visitor.CheckInTime,
                message = "You are now checked in. Welcome to Khulani Special School."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during kiosk check-in");
            return StatusCode(500, new { message = "An error occurred. Please see reception." });
        }
    }

    /// <summary>
    /// Public self-service visitor check-out (kiosk mode).
    /// No authentication required.
    /// </summary>
    [HttpPost("checkout")]
    public async Task<IActionResult> CheckOut([FromBody] PublicCheckOutDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var visitor = await _service.PublicCheckOutAsync(dto);
            if (visitor == null)
            {
                return NotFound(new { message = "No active check-in found for this phone number." });
            }

            _logger.LogInformation("Kiosk check-out: {Name}", visitor.FullName);

            return Ok(new
            {
                fullName = visitor.FullName,
                checkOutTime = visitor.CheckOutTime,
                minutesOnSite = visitor.MinutesOnSite,
                message = "You have been checked out. Thank you for visiting."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during kiosk check-out");
            return StatusCode(500, new { message = "An error occurred. Please see reception." });
        }
    }
}