using Microsoft.EntityFrameworkCore;
using KSSMCS.API.Data;
using KSSMCS.API.Models;

namespace KSSMCS.API.Repositories;

public class HealthIncidentRepository : IHealthIncidentRepository
{
    private readonly AppDbContext _db;

    public HealthIncidentRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<HealthIncident>> GetAllAsync()
    {
        return await _db.HealthIncidents
            .Include(h => h.Learner)
            .Include(h => h.ReportedBy)
            .OrderByDescending(h => h.IncidentDate)
            .ToListAsync();
    }

    public async Task<HealthIncident?> GetByIdAsync(Guid id)
    {
        return await _db.HealthIncidents
            .Include(h => h.Learner)
            .Include(h => h.ReportedBy)
            .FirstOrDefaultAsync(h => h.IncidentId == id);
    }

    public async Task<IEnumerable<HealthIncident>> GetByLearnerIdAsync(Guid learnerId)
    {
        return await _db.HealthIncidents
            .Include(h => h.ReportedBy)
            .Where(h => h.LearnerId == learnerId)
            .OrderByDescending(h => h.IncidentDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<HealthIncident>> GetByReporterIdAsync(Guid userId)
    {
        return await _db.HealthIncidents
            .Include(h => h.Learner)
            .Where(h => h.ReportedByUserId == userId)
            .OrderByDescending(h => h.IncidentDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<HealthIncident>> GetRecentAsync(int days)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);
        return await _db.HealthIncidents
            .Include(h => h.Learner)
            .Include(h => h.ReportedBy)
            .Where(h => h.IncidentDate >= cutoff)
            .OrderByDescending(h => h.IncidentDate)
            .ToListAsync();
    }

    public async Task<HealthIncident> AddAsync(HealthIncident incident)
    {
        _db.HealthIncidents.Add(incident);
        await _db.SaveChangesAsync();
        return incident;
    }

    public async Task<HealthIncident> UpdateAsync(HealthIncident incident)
    {
        _db.HealthIncidents.Update(incident);
        await _db.SaveChangesAsync();
        return incident;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var incident = await _db.HealthIncidents.FindAsync(id);
        if (incident == null) return false;

        _db.HealthIncidents.Remove(incident);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> CountAsync()
    {
        return await _db.HealthIncidents.CountAsync();
    }
}