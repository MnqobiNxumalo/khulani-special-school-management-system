using System.ComponentModel.DataAnnotations;

namespace KSSMCS.API.DTOs;

public class UpdateHealthIncidentDto
{
    [Required(ErrorMessage = "Incident type is required")]
    [MaxLength(50)]
    public string IncidentType { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    [MinLength(10, ErrorMessage = "Description must be at least 10 characters")]
    public string Description { get; set; } = string.Empty;

    public string? ActionTaken { get; set; }

    public string? Outcome { get; set; }

    public bool NotifyGuardian { get; set; }
}