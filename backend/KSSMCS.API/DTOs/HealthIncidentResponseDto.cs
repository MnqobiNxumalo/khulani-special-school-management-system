namespace KSSMCS.API.DTOs;

public class HealthIncidentResponseDto
{
    public Guid IncidentId { get; set; }

    // Learner
    public Guid LearnerId { get; set; }
    public string LearnerFullName { get; set; } = string.Empty;

    // Reporter
    public Guid ReportedByUserId { get; set; }
    public string ReportedByName { get; set; } = string.Empty;

    // Incident
    public DateTime IncidentDate { get; set; }
    public string IncidentType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ActionTaken { get; set; }
    public string? Outcome { get; set; }
    public bool NotifyGuardian { get; set; }
    public DateTime CreatedAt { get; set; }
}