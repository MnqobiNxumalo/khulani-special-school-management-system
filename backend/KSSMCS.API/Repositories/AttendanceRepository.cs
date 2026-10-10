using Microsoft.EntityFrameworkCore;
using KSSMCS.API.Data;
using KSSMCS.API.Models;

namespace KSSMCS.API.Repositories;

public class AttendanceRepository : IAttendanceRepository
{
    private readonly AppDbContext _db;

    public AttendanceRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Attendance>> GetAllAsync()
    {
        return await _db.Attendances
            .Include(a => a.Learner)
            .Include(a => a.RecordedBy)
            .OrderByDescending(a => a.Date)
            .ToListAsync();
    }

    public async Task<Attendance?> GetByIdAsync(Guid id)
    {
        return await _db.Attendances
            .Include(a => a.Learner)
            .Include(a => a.RecordedBy)
            .FirstOrDefaultAsync(a => a.AttendanceId == id);
    }

    public async Task<IEnumerable<Attendance>> GetByLearnerIdAsync(Guid learnerId)
    {
        return await _db.Attendances
            .Include(a => a.RecordedBy)
            .Where(a => a.LearnerId == learnerId)
            .OrderByDescending(a => a.Date)
            .ToListAsync();
    }

    public async Task<IEnumerable<Attendance>> GetByDateAsync(DateTime date)
    {
        var start = date.Date;
        var end = start.AddDays(1);

        return await _db.Attendances
            .Include(a => a.Learner)
            .Include(a => a.RecordedBy)
            .Where(a => a.Date >= start && a.Date < end)
            .OrderBy(a => a.Learner!.LastName)
            .ToListAsync();
    }

    public async Task<IEnumerable<Attendance>> GetByDateRangeAsync(DateTime from, DateTime to)
    {
        var start = from.Date;
        var end = to.Date.AddDays(1);

        return await _db.Attendances
            .Include(a => a.Learner)
            .Include(a => a.RecordedBy)
            .Where(a => a.Date >= start && a.Date < end)
            .OrderByDescending(a => a.Date)
            .ToListAsync();
    }

    public async Task<Attendance?> GetByLearnerAndDateAsync(Guid learnerId, DateTime date)
    {
        var start = date.Date;
        var end = start.AddDays(1);

        return await _db.Attendances
            .FirstOrDefaultAsync(a =>
                a.LearnerId == learnerId &&
                a.Date >= start && a.Date < end);
    }

    public async Task<Attendance> AddAsync(Attendance attendance)
    {
        _db.Attendances.Add(attendance);
        await _db.SaveChangesAsync();
        return attendance;
    }

    public async Task<Attendance> UpdateAsync(Attendance attendance)
    {
        _db.Attendances.Update(attendance);
        await _db.SaveChangesAsync();
        return attendance;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var attendance = await _db.Attendances.FindAsync(id);
        if (attendance == null) return false;

        _db.Attendances.Remove(attendance);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> CountAsync()
    {
        return await _db.Attendances.CountAsync();
    }
}