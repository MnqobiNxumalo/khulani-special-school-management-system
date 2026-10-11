using Microsoft.EntityFrameworkCore;
using KSSMCS.API.Data;
using KSSMCS.API.Models;

namespace KSSMCS.API.Repositories;

public class VisitorRepository : IVisitorRepository
{
    private readonly AppDbContext _db;

    public VisitorRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Visitor>> GetAllAsync()
    {
        return await _db.Visitors
            .AsNoTracking()
            .Include(v => v.RecordedBy)
            .OrderByDescending(v => v.CheckInTime)
            .ToListAsync();
    }

    public async Task<Visitor?> GetByIdAsync(Guid id)
    {
        return await _db.Visitors
            .AsNoTracking()
            .Include(v => v.RecordedBy)
            .FirstOrDefaultAsync(v => v.VisitorId == id);
    }

    public async Task<IEnumerable<Visitor>> GetActiveAsync()
    {
        return await _db.Visitors
            .AsNoTracking()
            .Include(v => v.RecordedBy)
            .Where(v => v.CheckOutTime == null)
            .OrderByDescending(v => v.CheckInTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Visitor>> GetTodayAsync()
    {
        var start = DateTime.UtcNow.Date;
        var end = start.AddDays(1);

        return await _db.Visitors
            .AsNoTracking()
            .Include(v => v.RecordedBy)
            .Where(v => v.CheckInTime >= start && v.CheckInTime < end)
            .OrderByDescending(v => v.CheckInTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Visitor>> GetByDateRangeAsync(DateTime from, DateTime to)
    {
        var start = from.Date;
        var end = to.Date.AddDays(1);

        return await _db.Visitors
            .AsNoTracking()
            .Include(v => v.RecordedBy)
            .Where(v => v.CheckInTime >= start && v.CheckInTime < end)
            .OrderByDescending(v => v.CheckInTime)
            .ToListAsync();
    }

    public async Task<Visitor> AddAsync(Visitor visitor)
    {
        _db.Visitors.Add(visitor);
        await _db.SaveChangesAsync();
        return visitor;
    }

    public async Task<Visitor> UpdateAsync(Visitor visitor)
    {
        _db.Visitors.Update(visitor);
        await _db.SaveChangesAsync();
        return visitor;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var visitor = await _db.Visitors.FindAsync(id);
        if (visitor == null) return false;

        _db.Visitors.Remove(visitor);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> CountAsync()
    {
        return await _db.Visitors.CountAsync();
    }
}