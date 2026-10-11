using System.ComponentModel.DataAnnotations;

namespace KSSMCS.API.DTOs;

public class CheckInVisitorDto
{
    [Required(ErrorMessage = "Full name is required")]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Purpose is required")]
    [MaxLength(500)]
    public string Purpose { get; set; } = string.Empty;
}