using System.ComponentModel.DataAnnotations;

namespace KSSMCS.API.Models;

public class Learner
{
    [Key]
    public Guid LearnerId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public DateTime DateOfBirth { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    public string? SupportNeeds { get; set; }

    public string? Address { get; set; }

    public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;

    public string? MedicalConditions { get; set; }

    public string? Allergies { get; set; }

    // Guardian info
    [MaxLength(200)]
    public string? GuardianName { get; set; }

    [MaxLength(20)]
    public string? GuardianPhone { get; set; }

    [MaxLength(255)]
    public string? GuardianEmail { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<HealthIncident> HealthIncidents { get; set; } = new List<HealthIncident>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}