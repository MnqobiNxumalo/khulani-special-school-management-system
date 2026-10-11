using Microsoft.EntityFrameworkCore;
using KSSMCS.API.Data;
using KSSMCS.API.Models;

namespace KSSMCS.API.Repositories;

public class MessageRepository : IMessageRepository
{
    private readonly AppDbContext _db;

    public MessageRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Message>> GetInboxAsync(Guid userId)
    {
        return await _db.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Include(m => m.Learner)
            .Where(m => m.ReceiverId == userId)
            .OrderByDescending(m => m.SentAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Message>> GetSentAsync(Guid userId)
    {
        return await _db.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Include(m => m.Learner)
            .Where(m => m.SenderId == userId)
            .OrderByDescending(m => m.SentAt)
            .ToListAsync();
    }

    public async Task<Message?> GetByIdAsync(Guid id)
    {
        return await _db.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Include(m => m.Learner)
            .FirstOrDefaultAsync(m => m.MessageId == id);
    }

    public async Task<Message> AddAsync(Message message)
    {
        _db.Messages.Add(message);
        await _db.SaveChangesAsync();
        return message;
    }

    public async Task<Message> UpdateAsync(Message message)
    {
        _db.Messages.Update(message);
        await _db.SaveChangesAsync();
        return message;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var message = await _db.Messages.FindAsync(id);
        if (message == null) return false;

        _db.Messages.Remove(message);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _db.Messages
            .CountAsync(m => m.ReceiverId == userId && !m.IsRead);
    }

    public async Task<bool> MarkAsReadAsync(Guid messageId, Guid userId)
    {
        var message = await _db.Messages
            .FirstOrDefaultAsync(m => m.MessageId == messageId && m.ReceiverId == userId);

        if (message == null) return false;

        message.IsRead = true;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> CountAsync()
    {
        return await _db.Messages.CountAsync();
    }
}