using KSSMCS.API.Models;

namespace KSSMCS.API.Repositories;

public interface IHealthIncidentRepository
{
    Task<IEnumerable<HealthIncident>> GetAllAsync();
    Task<HealthIncident?> GetByIdAsync(Guid id);
    Task<IEnumerable<HealthIncident>> GetByLearnerIdAsync(Guid learnerId);
    Task<IEnumerable<HealthIncident>> GetByReporterIdAsync(Guid userId);
    Task<IEnumerable<HealthIncident>> GetRecentAsync(int days);
    Task<HealthIncident> AddAsync(HealthIncident incident);
    Task<HealthIncident> UpdateAsync(HealthIncident incident);
    Task<bool> DeleteAsync(Guid id);
    Task<int> CountAsync();
}