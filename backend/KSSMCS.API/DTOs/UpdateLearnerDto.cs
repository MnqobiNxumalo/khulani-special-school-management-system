using System.ComponentModel.DataAnnotations;

namespace KSSMCS.API.DTOs;

public class UpdateLearnerDto
{
    [Required(ErrorMessage = "First name is required")]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Date of birth is required")]
    public DateTime DateOfBirth { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    public string? SupportNeeds { get; set; }

    public string? Address { get; set; }

    public string? MedicalConditions { get; set; }

    public string? Allergies { get; set; }

    [MaxLength(200)]
    public string? GuardianName { get; set; }

    [MaxLength(20)]
    public string? GuardianPhone { get; set; }

    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(255)]
    public string? GuardianEmail { get; set; }
}