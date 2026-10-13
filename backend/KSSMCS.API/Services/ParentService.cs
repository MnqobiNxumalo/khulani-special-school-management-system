using KSSMCS.API.Data;
using KSSMCS.API.DTOs;
using KSSMCS.API.Models;
using KSSMCS.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace KSSMCS.API.Services;

public interface IParentService
{
    Task<ParentDashboardDto> GetDashboardAsync(Guid parentUserId);
}

public class ParentService : IParentService
{
    private readonly AppDbContext _db;
    private readonly ILearnerService _learnerService;
    private readonly IHealthIncidentService _incidentService;
    private readonly IAttendanceService _attendanceService;
    private readonly IMessageService _messageService;

    public ParentService(
        AppDbContext db,
        ILearnerService learnerService,
        IHealthIncidentService incidentService,
        IAttendanceService attendanceService,
        IMessageService messageService)
    {
        _db = db;
        _learnerService = learnerService;
        _incidentService = incidentService;
        _attendanceService = attendanceService;
        _messageService = messageService;
    }

    public async Task<ParentDashboardDto> GetDashboardAsync(Guid parentUserId)
    {
        // 1. Find the parent user in the DB
        var parent = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == parentUserId);

        if (parent == null)
            throw new ArgumentException("Parent user not found.");

        if (parent.LinkedLearnerId == null)
            throw new ArgumentException("No child is linked to this parent account. Please contact the school.");

        var learnerId = parent.LinkedLearnerId.Value;

        // 2. Load child profile
        var child = await _learnerService.GetByIdAsync(learnerId);
        if (child == null)
            throw new ArgumentException("The linked learner could not be found.");

        // 3. Load recent incidents (last 30 days)
        var allIncidents = await _incidentService.GetByLearnerIdAsync(learnerId);
        var recentIncidents = allIncidents
            .OrderByDescending(i => i.IncidentDate)
            .Take(10)
            .ToList();

        // 4. Load recent attendance (last 14 days)
        var allAttendance = await _attendanceService.GetByLearnerIdAsync(learnerId);
        var recentAttendance = allAttendance
            .OrderByDescending(a => a.Date)
            .Take(14)
            .ToList();

        // 5. Load messages involving this parent (last 10)
        var inbox = await _messageService.GetInboxAsync(parentUserId);
        var sent = await _messageService.GetSentAsync(parentUserId);
        var recentMessages = inbox.Concat(sent)
            .OrderByDescending(m => m.SentAt)
            .Take(10)
            .ToList();

        // 6. Compute counts
        var totalIncidents = allIncidents.Count();
        var unreadMessages = await _messageService.GetUnreadCountAsync(parentUserId);

        // 7. Attendance summary for the current month
        var thisMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var thisMonthAttendance = allAttendance
            .Where(a => a.Date >= thisMonthStart)
            .ToList();

        var totalThisMonth = thisMonthAttendance.Count;
        var presentThisMonth = thisMonthAttendance.Count(a => a.Status == "present");
        var absentThisMonth = thisMonthAttendance.Count(a => a.Status == "absent");
        var lateThisMonth = thisMonthAttendance.Count(a => a.Status == "late");

        var summary = new AttendanceSummaryDto
        {
            Total = totalThisMonth,
            Present = presentThisMonth,
            Absent = absentThisMonth,
            Late = lateThisMonth,
            AttendanceRate = totalThisMonth == 0
                ? 0
                : Math.Round((double)(presentThisMonth + lateThisMonth) / totalThisMonth * 100, 2)
        };

        return new ParentDashboardDto
        {
            Child = child,
            RecentIncidents = recentIncidents,
            RecentAttendance = recentAttendance,
            RecentMessages = recentMessages,
            AttendanceSummary = summary,
            TotalIncidents = totalIncidents,
            UnreadMessages = unreadMessages
        };
    }
}