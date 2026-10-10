namespace KSSMCS.API.DTOs;

public class AttendanceResponseDto
{
    public Guid AttendanceId { get; set; }
    public Guid LearnerId { get; set; }
    public string LearnerFullName { get; set; } = string.Empty;
    public Guid RecordedByUserId { get; set; }
    public string RecordedByName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AttendanceSummaryDto
{
    public int Total { get; set; }
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Late { get; set; }
    public double AttendanceRate { get; set; }
}