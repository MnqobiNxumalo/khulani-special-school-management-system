using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KSSMCS.API.Models;

public class Message
{
    [Key]
    public Guid MessageId { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SenderId { get; set; }

    [ForeignKey(nameof(SenderId))]
    public User? Sender { get; set; }

    [Required]
    public Guid ReceiverId { get; set; }

    [ForeignKey(nameof(ReceiverId))]
    public User? Receiver { get; set; }

    public Guid? LearnerId { get; set; }

    [ForeignKey(nameof(LearnerId))]
    public Learner? Learner { get; set; }

    [Required]
    public string MessageText { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}