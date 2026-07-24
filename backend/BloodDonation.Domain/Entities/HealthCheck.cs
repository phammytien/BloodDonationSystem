using System;

namespace BloodDonation.Domain.Entities;

public class HealthCheck
{
    public int HealthCheckId { get; set; }
    public int AppointmentId { get; set; }
    public string BloodPressure { get; set; } = null!;
    public int Pulse { get; set; }
    public decimal Temperature { get; set; }
    public decimal Weight { get; set; }
    public decimal Hemoglobin { get; set; }
    public bool HasDisease { get; set; }
    public string? DiseaseDescription { get; set; }
    public bool Eligible { get; set; }
    public string DoctorName { get; set; } = null!;
    public DateTime CheckDate { get; set; } = DateTime.UtcNow;
    public string? AttachmentFile { get; set; }

    // Navigation properties
    public virtual Appointment Appointment { get; set; } = null!;
}
