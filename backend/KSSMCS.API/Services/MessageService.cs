using KSSMCS.API.DTOs;
using KSSMCS.API.Models;
using KSSMCS.API.Repositories;

namespace KSSMCS.API.Services;

public interface IMessageService
{
    Task<IEnumerable<MessageResponseDto>> GetInboxAsync(Guid userId);
    Task<IEnumerable<MessageResponseDto>> GetSentAsync(Guid userId);
    Task<MessageResponseDto?> GetByIdAsync(Guid id, Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<MessageResponseDto> SendAsync(SendMessageDto dto, Guid senderId);
    Task<bool> MarkAsReadAsync(Guid messageId, Guid userId);
    Task<bool> DeleteAsync(Guid messageId, Guid userId, bool isPrincipal);
    Task<int> CountAsync();
}

public class MessageService : IMessageService
{
    private readonly IMessageRepository _repo;
    private readonly ILearnerRepository _learnerRepo;

    public MessageService(IMessageRepository repo, ILearnerRepository learnerRepo)
    {
        _repo = repo;
        _learnerRepo = learnerRepo;
    }

    public async Task<IEnumerable<MessageResponseDto>> GetInboxAsync(Guid userId)
    {
        var messages = await _repo.GetInboxAsync(userId);
        return messages.Select(MapToDto);
    }

    public async Task<IEnumerable<MessageResponseDto>> GetSentAsync(Guid userId)
    {
        var messages = await _repo.GetSentAsync(userId);
        return messages.Select(MapToDto);
    }

    public async Task<MessageResponseDto?> GetByIdAsync(Guid id, Guid userId)
    {
        var message = await _repo.GetByIdAsync(id);
        if (message == null) return null;

        // Security: only the sender or receiver can view the message
        if (message.SenderId != userId && message.ReceiverId != userId)
            return null;

        return MapToDto(message);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _repo.GetUnreadCountAsync(userId);
    }

    public async Task<MessageResponseDto> SendAsync(SendMessageDto dto, Guid senderId)
{
    // Business rule 1: cannot send to yourself
    if (dto.ReceiverId == senderId)
        throw new ArgumentException("You cannot send a message to yourself.");

    // Business rule 2: if LearnerId provided, learner must exist
    if (dto.LearnerId.HasValue)
    {
        var exists = await _learnerRepo.ExistsAsync(dto.LearnerId.Value);
        if (!exists)
            throw new ArgumentException($"Learner with ID {dto.LearnerId} does not exist.");
    }

    // Business rule 3: message text must have content
    if (string.IsNullOrWhiteSpace(dto.MessageText))
        throw new ArgumentException("Message text cannot be empty.");

    var message = new Message
    {
        SenderId = senderId,
        ReceiverId = dto.ReceiverId,
        LearnerId = dto.LearnerId,
        MessageText = dto.MessageText.Trim(),
        IsRead = false,
        SentAt = DateTime.UtcNow
    };

    await _repo.AddAsync(message);

    // Reload from a fresh query to get navigation properties populated
    var full = await _repo.GetByIdAsync(message.MessageId);
    return MapToDto(full!);
}

    public async Task<bool> MarkAsReadAsync(Guid messageId, Guid userId)
    {
        return await _repo.MarkAsReadAsync(messageId, userId);
    }

    public async Task<bool> DeleteAsync(Guid messageId, Guid userId, bool isPrincipal)
    {
        var message = await _repo.GetByIdAsync(messageId);
        if (message == null) return false;

        // Only sender or principal can delete
        if (message.SenderId != userId && !isPrincipal)
            return false;

        return await _repo.DeleteAsync(messageId);
    }

    public async Task<int> CountAsync()
    {
        return await _repo.CountAsync();
    }

    private static MessageResponseDto MapToDto(Message m)
    {
        return new MessageResponseDto
        {
            MessageId = m.MessageId,
            SenderId = m.SenderId,
            SenderName = m.Sender != null
                ? $"{m.Sender.FirstName} {m.Sender.LastName}"
                : "(Unknown)",
            ReceiverId = m.ReceiverId,
            ReceiverName = m.Receiver != null
                ? $"{m.Receiver.FirstName} {m.Receiver.LastName}"
                : "(Unknown)",
            LearnerId = m.LearnerId,
            LearnerFullName = m.Learner != null
                ? $"{m.Learner.FirstName} {m.Learner.LastName}"
                : null,
            MessageText = m.MessageText,
            IsRead = m.IsRead,
            SentAt = m.SentAt
        };
    }
}