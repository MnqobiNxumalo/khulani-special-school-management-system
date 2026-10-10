using System.ComponentModel.DataAnnotations;

namespace KSSMCS.API.DTOs;

public class UpdateAttendanceDto
{
    [Required(ErrorMessage = "Status is required")]
    [RegularExpression("^(present|absent|late)$",
        ErrorMessage = "Status must be: present, absent, or late")]
    public string Status { get; set; } = "present";

    public string? Notes { get; set; }
}