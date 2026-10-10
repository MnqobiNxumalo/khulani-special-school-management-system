namespace KSSMCS.API.DTOs;

public class LearnerResponseDto
{
    public Guid LearnerId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public DateTime DateOfBirth { get; set; }
    public int Age => CalculateAge(DateOfBirth);
    public string? Gender { get; set; }
    public string? SupportNeeds { get; set; }
    public string? Address { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public string? MedicalConditions { get; set; }
    public string? Allergies { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? GuardianEmail { get; set; }
    public int HealthIncidentCount { get; set; }
    public DateTime CreatedAt { get; set; }

    private static int CalculateAge(DateTime dob)
    {
        var age = DateTime.UtcNow.Year - dob.Year;
        if (dob.Date > DateTime.UtcNow.AddYears(-age)) age--;
        return age;
    }
}