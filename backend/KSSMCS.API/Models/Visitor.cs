using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KSSMCS.API.Models;

public class Visitor
{
    [Key]
    public Guid VisitorId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    public string? Purpose { get; set; }

    public DateTime CheckInTime { get; set; } = DateTime.UtcNow;

    public DateTime? CheckOutTime { get; set; }

    public Guid? RecordedByUserId { get; set; }

    [ForeignKey(nameof(RecordedByUserId))]
    public User? RecordedBy { get; set; }
}