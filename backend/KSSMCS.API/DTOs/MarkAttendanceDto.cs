using System.ComponentModel.DataAnnotations;

namespace KSSMCS.API.DTOs;

public class MarkAttendanceDto
{
    [Required(ErrorMessage = "Learner ID is required")]
    public Guid LearnerId { get; set; }

    [Required(ErrorMessage = "Status is required")]
    [RegularExpression("^(present|absent|late)$",
        ErrorMessage = "Status must be: present, absent, or late")]
    public string Status { get; set; } = "present";

    public string? Notes { get; set; }

    public DateTime? Date { get; set; }
}