namespace KSSMCS.API.DTOs;

public class ParentDashboardDto
{
    public LearnerResponseDto? Child { get; set; }
    public IEnumerable<HealthIncidentResponseDto> RecentIncidents { get; set; } = new List<HealthIncidentResponseDto>();
    public IEnumerable<AttendanceResponseDto> RecentAttendance { get; set; } = new List<AttendanceResponseDto>();
    public IEnumerable<MessageResponseDto> RecentMessages { get; set; } = new List<MessageResponseDto>();
    public AttendanceSummaryDto? AttendanceSummary { get; set; }
    public int TotalIncidents { get; set; }
    public int UnreadMessages { get; set; }
}