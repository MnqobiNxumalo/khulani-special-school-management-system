using KSSMCS.API.Models;

namespace KSSMCS.API.Repositories;

public interface IVisitorRepository
{
    Task<IEnumerable<Visitor>> GetAllAsync();
    Task<Visitor?> GetByIdAsync(Guid id);
    Task<IEnumerable<Visitor>> GetActiveAsync();
    Task<IEnumerable<Visitor>> GetTodayAsync();
    Task<IEnumerable<Visitor>> GetByDateRangeAsync(DateTime from, DateTime to);
    Task<Visitor> AddAsync(Visitor visitor);
    Task<Visitor> UpdateAsync(Visitor visitor);
    Task<bool> DeleteAsync(Guid id);
    Task<int> CountAsync();
}