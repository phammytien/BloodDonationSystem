using System;

namespace BloodDonation.Domain.Entities;

public class AuditLog
{
    public long LogId { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; } = null!;
    public string TableName { get; set; } = null!;
    public int? RecordId { get; set; }
    public string? OldData { get; set; }
    public string? NewData { get; set; }
    public string? IPAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User? User { get; set; }
}
