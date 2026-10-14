using System.ComponentModel.DataAnnotations;

namespace KSSMCS.API.DTOs;

public class PublicCheckInDto
{
    [Required(ErrorMessage = "Full name is required")]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required")]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Purpose of visit is required")]
    [MaxLength(500)]
    public string Purpose { get; set; } = string.Empty;
}

public class PublicCheckOutDto
{
    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;
}