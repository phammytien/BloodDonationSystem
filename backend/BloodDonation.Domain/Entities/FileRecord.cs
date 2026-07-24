using System;

namespace BloodDonation.Domain.Entities;

public class FileRecord
{
    public int FileId { get; set; }
    public int? DonorId { get; set; }
    public int? AppointmentId { get; set; }
    public string FileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Donor? Donor { get; set; }
    public virtual Appointment? Appointment { get; set; }
}
