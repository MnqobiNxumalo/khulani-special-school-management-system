using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KSSMCS.API.Models;

public class HealthIncident
{
    [Key]
    public Guid IncidentId { get; set; } = Guid.NewGuid();

    [Required]
    public Guid LearnerId { get; set; }

    [ForeignKey(nameof(LearnerId))]
    public Learner? Learner { get; set; }

    [Required]
    public Guid ReportedByUserId { get; set; }

    [ForeignKey(nameof(ReportedByUserId))]
    public User? ReportedBy { get; set; }

    public DateTime IncidentDate { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)]
    public string IncidentType { get; set; } = string.Empty; // Seizure, Fall, Illness, Injury, etc.

    [Required]
    public string Description { get; set; } = string.Empty;

    public string? ActionTaken { get; set; }

    public string? Outcome { get; set; }

    public bool NotifyGuardian { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}