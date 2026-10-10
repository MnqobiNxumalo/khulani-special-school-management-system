using Microsoft.EntityFrameworkCore;
using KSSMCS.API.Data;
using KSSMCS.API.Models;

namespace KSSMCS.API.Repositories;

public class LearnerRepository : ILearnerRepository
{
    private readonly AppDbContext _db;

    public LearnerRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Learner>> GetAllAsync()
    {
        return await _db.Learners
            .OrderBy(l => l.LastName)
            .ThenBy(l => l.FirstName)
            .ToListAsync();
    }

    public async Task<Learner?> GetByIdAsync(Guid id)
    {
        return await _db.Learners
            .Include(l => l.HealthIncidents)
            .Include(l => l.Attendances)
            .FirstOrDefaultAsync(l => l.LearnerId == id);
    }

    public async Task<IEnumerable<Learner>> SearchAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return await GetAllAsync();

        var lowerQuery = query.ToLower();

        return await _db.Learners
            .Where(l => l.FirstName.ToLower().Contains(lowerQuery)
                     || l.LastName.ToLower().Contains(lowerQuery)
                     || (l.GuardianName != null && l.GuardianName.ToLower().Contains(lowerQuery)))
            .OrderBy(l => l.LastName)
            .ToListAsync();
    }

    public async Task<Learner> AddAsync(Learner learner)
    {
        _db.Learners.Add(learner);
        await _db.SaveChangesAsync();
        return learner;
    }

    public async Task<Learner> UpdateAsync(Learner learner)
    {
        learner.UpdatedAt = DateTime.UtcNow;
        _db.Learners.Update(learner);
        await _db.SaveChangesAsync();
        return learner;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var learner = await _db.Learners.FindAsync(id);
        if (learner == null) return false;

        _db.Learners.Remove(learner);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _db.Learners.AnyAsync(l => l.LearnerId == id);
    }

    public async Task<int> CountAsync()
    {
        return await _db.Learners.CountAsync();
    }
}