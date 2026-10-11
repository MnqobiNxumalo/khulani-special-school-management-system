using System.ComponentModel.DataAnnotations;

namespace KSSMCS.API.DTOs;

public class SendMessageDto
{
    [Required(ErrorMessage = "Receiver ID is required")]
    public Guid ReceiverId { get; set; }

    [Required(ErrorMessage = "Message text is required")]
    [MinLength(1, ErrorMessage = "Message cannot be empty")]
    [MaxLength(2000, ErrorMessage = "Message cannot exceed 2000 characters")]
    public string MessageText { get; set; } = string.Empty;

    /// <summary>Optional: link this message to a specific learner</summary>
    public Guid? LearnerId { get; set; }
}