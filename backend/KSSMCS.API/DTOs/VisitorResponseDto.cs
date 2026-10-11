namespace KSSMCS.API.DTOs;

public class VisitorResponseDto
{
    public Guid VisitorId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Purpose { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public bool IsCurrentlyOnSite => CheckOutTime == null;
    public int MinutesOnSite => CheckOutTime.HasValue
        ? (int)(CheckOutTime.Value - CheckInTime).TotalMinutes
        : (int)(DateTime.UtcNow - CheckInTime).TotalMinutes;

    public Guid? RecordedByUserId { get; set; }
    public string? RecordedByName { get; set; }
}