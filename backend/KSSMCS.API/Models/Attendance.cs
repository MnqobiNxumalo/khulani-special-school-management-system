using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KSSMCS.API.Models;

public class Attendance
{
    [Key]
    public Guid AttendanceId { get; set; } = Guid.NewGuid();

    [Required]
    public Guid LearnerId { get; set; }

    [ForeignKey(nameof(LearnerId))]
    public Learner? Learner { get; set; }

    [Required]
    public Guid RecordedByUserId { get; set; }

    [ForeignKey(nameof(RecordedByUserId))]
    public User? RecordedBy { get; set; }

    [Required]
    public DateTime Date { get; set; } = DateTime.UtcNow.Date;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "present"; // present, absent, late

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}