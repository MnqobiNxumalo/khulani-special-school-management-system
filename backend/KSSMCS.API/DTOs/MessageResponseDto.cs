namespace KSSMCS.API.DTOs;

public class MessageResponseDto
{
    public Guid MessageId { get; set; }

    // Sender
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;

    // Receiver
    public Guid ReceiverId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;

    // Optional learner context
    public Guid? LearnerId { get; set; }
    public string? LearnerFullName { get; set; }

    public string MessageText { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime SentAt { get; set; }
}