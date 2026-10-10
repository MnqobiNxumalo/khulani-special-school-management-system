using KSSMCS.API.Models;

namespace KSSMCS.API.Repositories;

public interface IAttendanceRepository
{
    Task<IEnumerable<Attendance>> GetAllAsync();
    Task<Attendance?> GetByIdAsync(Guid id);
    Task<IEnumerable<Attendance>> GetByLearnerIdAsync(Guid learnerId);
    Task<IEnumerable<Attendance>> GetByDateAsync(DateTime date);
    Task<IEnumerable<Attendance>> GetByDateRangeAsync(DateTime from, DateTime to);
    Task<Attendance?> GetByLearnerAndDateAsync(Guid learnerId, DateTime date);
    Task<Attendance> AddAsync(Attendance attendance);
    Task<Attendance> UpdateAsync(Attendance attendance);
    Task<bool> DeleteAsync(Guid id);
    Task<int> CountAsync();
}