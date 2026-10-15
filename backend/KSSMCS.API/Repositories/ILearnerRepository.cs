using KSSMCS.API.Models;

namespace KSSMCS.API.Repositories;

public interface ILearnerRepository
{
    Task<IEnumerable<Learner>> GetAllAsync();
    Task<Learner?> GetByIdAsync(Guid id);
    Task<IEnumerable<Learner>> SearchAsync(string query);
    Task<Learner> AddAsync(Learner learner);
    Task<Learner> UpdateAsync(Learner learner);
    Task<IEnumerable<Learner>> GetByTeacherIdAsync(Guid teacherId);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task<int> CountAsync();
}