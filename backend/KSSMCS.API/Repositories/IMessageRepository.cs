using KSSMCS.API.Models;

namespace KSSMCS.API.Repositories;

public interface IMessageRepository
{
    Task<IEnumerable<Message>> GetInboxAsync(Guid userId);
    Task<IEnumerable<Message>> GetSentAsync(Guid userId);
    Task<Message?> GetByIdAsync(Guid id);
    Task<Message> AddAsync(Message message);
    Task<Message> UpdateAsync(Message message);
    Task<bool> DeleteAsync(Guid id);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<bool> MarkAsReadAsync(Guid messageId, Guid userId);
    Task<int> CountAsync();
}