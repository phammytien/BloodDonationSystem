using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using BloodDonation.Domain.Entities;

namespace BloodDonation.Infrastructure.Data.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");
        builder.HasKey(r => r.RoleId);

        builder.Property(r => r.RoleName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(r => r.Description)
            .HasMaxLength(255);

        builder.Property(r => r.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");
    }
}

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.UserId);

        builder.HasIndex(u => u.Username)
            .IsUnique();

        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.PasswordHash)
            .IsRequired();

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Phone)
            .HasMaxLength(20);

        builder.Property(u => u.IsActive)
            .HasDefaultValue(true);

        builder.Property(u => u.LastLogin)
            .HasColumnType("datetime");

        builder.Property(u => u.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(u => u.UpdatedAt)
            .HasColumnType("datetime");

        builder.HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class BloodTypeConfiguration : IEntityTypeConfiguration<BloodType>
{
    public void Configure(EntityTypeBuilder<BloodType> builder)
    {
        builder.ToTable("BloodTypes");
        builder.HasKey(bt => bt.BloodTypeId);

        builder.Property(bt => bt.BloodGroup)
            .IsRequired()
            .HasMaxLength(5);
    }
}

public class DonorConfiguration : IEntityTypeConfiguration<Donor>
{
    public void Configure(EntityTypeBuilder<Donor> builder)
    {
        builder.ToTable("Donors");
        builder.HasKey(d => d.DonorId);

        // One-to-One User <-> Donor
        builder.HasIndex(d => d.UserId)
            .IsUnique();

        builder.Property(d => d.FullName)
            .IsRequired(false)
            .HasMaxLength(150);

        builder.Property(d => d.DateOfBirth)
            .IsRequired(false)
            .HasColumnType("date");

        builder.Property(d => d.CitizenId)
            .IsRequired(false)
            .HasMaxLength(20);

        builder.Property(d => d.Phone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(d => d.Email)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(d => d.Address)
            .IsRequired(false)
            .HasMaxLength(255);

        builder.Property(d => d.Province)
            .IsRequired(false)
            .HasMaxLength(100);

        builder.Property(d => d.Ward)
            .IsRequired(false)
            .HasMaxLength(100);

        builder.Property(d => d.Occupation)
            .HasMaxLength(100);

        builder.Property(d => d.Weight)
            .HasColumnType("decimal(5,2)");

        builder.Property(d => d.Height)
            .HasColumnType("decimal(5,2)");

        builder.Property(d => d.LastDonationDate)
            .HasColumnType("date");

        builder.Property(d => d.TotalDonationTimes)
            .HasDefaultValue(0);

        builder.Property(d => d.IsAvailable)
            .HasDefaultValue(true);

        builder.Property(d => d.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(d => d.UpdatedAt)
            .HasColumnType("datetime");

        builder.HasOne(d => d.User)
            .WithOne(u => u.Donor)
            .HasForeignKey<Donor>(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.BloodType)
            .WithMany(bt => bt.Donors)
            .HasForeignKey(d => d.BloodTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class DonationCampaignConfiguration : IEntityTypeConfiguration<DonationCampaign>
{
    public void Configure(EntityTypeBuilder<DonationCampaign> builder)
    {
        builder.ToTable("DonationCampaigns");
        builder.HasKey(dc => dc.CampaignId);

        builder.Property(dc => dc.CampaignName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(dc => dc.Location)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(dc => dc.Organizer)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(dc => dc.StartDate)
            .HasColumnType("datetime");

        builder.Property(dc => dc.EndDate)
            .HasColumnType("datetime");

        builder.Property(dc => dc.Status)
            .HasColumnType("tinyint");

        builder.Property(dc => dc.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(dc => dc.AttachmentUrl)
            .HasMaxLength(500);

        builder.Property(dc => dc.AttachmentName)
            .HasMaxLength(255);
    }
}

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("Appointments");
        builder.HasKey(a => a.AppointmentId);

        builder.Property(a => a.AppointmentDate)
            .HasColumnType("datetime");

        builder.Property(a => a.TimeSlot)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(a => a.Status)
            .HasColumnType("tinyint");

        builder.Property(a => a.Note)
            .HasMaxLength(500);

        builder.Property(a => a.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(a => a.Donor)
            .WithMany(d => d.Appointments)
            .HasForeignKey(a => a.DonorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Campaign)
            .WithMany(dc => dc.Appointments)
            .HasForeignKey(a => a.CampaignId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class HealthCheckConfiguration : IEntityTypeConfiguration<HealthCheck>
{
    public void Configure(EntityTypeBuilder<HealthCheck> builder)
    {
        builder.ToTable("HealthChecks");
        builder.HasKey(hc => hc.HealthCheckId);

        // One-to-One Appointment <-> HealthCheck
        builder.HasIndex(hc => hc.AppointmentId)
            .IsUnique();

        builder.Property(hc => hc.BloodPressure)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(hc => hc.Temperature)
            .HasColumnType("decimal(4,2)");

        builder.Property(hc => hc.Weight)
            .HasColumnType("decimal(5,2)");

        builder.Property(hc => hc.Hemoglobin)
            .HasColumnType("decimal(5,2)");

        builder.Property(hc => hc.DoctorName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(hc => hc.CheckDate)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(hc => hc.Appointment)
            .WithOne(a => a.HealthCheck)
            .HasForeignKey<HealthCheck>(hc => hc.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class BloodDonationConfiguration : IEntityTypeConfiguration<BloodDonation.Domain.Entities.BloodDonation>
{
    public void Configure(EntityTypeBuilder<BloodDonation.Domain.Entities.BloodDonation> builder)
    {
        builder.ToTable("BloodDonations");
        builder.HasKey(bd => bd.DonationId);

        // One-to-One Appointment <-> BloodDonation
        builder.HasIndex(bd => bd.AppointmentId)
            .IsUnique();

        builder.Property(bd => bd.DonationDate)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(bd => bd.DonationStatus)
            .HasColumnType("tinyint");

        builder.Property(bd => bd.StaffName)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasOne(bd => bd.Appointment)
            .WithOne(a => a.BloodDonation)
            .HasForeignKey<BloodDonation.Domain.Entities.BloodDonation>(bd => bd.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(bd => bd.BloodType)
            .WithMany(bt => bt.BloodDonations)
            .HasForeignKey(bd => bd.BloodTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class BloodInventoryConfiguration : IEntityTypeConfiguration<BloodInventory>
{
    public void Configure(EntityTypeBuilder<BloodInventory> builder)
    {
        builder.ToTable("BloodInventory");
        builder.HasKey(bi => bi.InventoryId);

        builder.Property(bi => bi.ExpiredDate)
            .HasColumnType("date");

        builder.Property(bi => bi.StorageLocation)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(bi => bi.Status)
            .HasColumnType("tinyint");

        builder.Property(bi => bi.UpdatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(bi => bi.BloodType)
            .WithMany(bt => bt.BloodInventories)
            .HasForeignKey(bi => bi.BloodTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.NotificationId);

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(n => n.Type)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(n => n.IsRead)
            .HasDefaultValue(false);

        builder.Property(n => n.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OtpVerificationConfiguration : IEntityTypeConfiguration<OtpVerification>
{
    public void Configure(EntityTypeBuilder<OtpVerification> builder)
    {
        builder.ToTable("OTPVerification");
        builder.HasKey(ov => ov.OtpId);

        builder.Property(ov => ov.OtpCode)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(ov => ov.ExpiredAt)
            .HasColumnType("datetime");

        builder.Property(ov => ov.Verified)
            .HasDefaultValue(false);

        builder.Property(ov => ov.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(ov => ov.User)
            .WithMany(u => u.OtpVerifications)
            .HasForeignKey(ov => ov.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class FileRecordConfiguration : IEntityTypeConfiguration<FileRecord>
{
    public void Configure(EntityTypeBuilder<FileRecord> builder)
    {
        builder.ToTable("Files");
        builder.HasKey(f => f.FileId);

        builder.Property(f => f.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(f => f.ContentType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.UploadedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(f => f.Donor)
            .WithMany(d => d.Files)
            .HasForeignKey(f => f.DonorId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(f => f.Appointment)
            .WithMany()
            .HasForeignKey(f => f.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        builder.HasKey(al => al.LogId);

        builder.Property(al => al.Action)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(al => al.TableName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(al => al.IPAddress)
            .HasMaxLength(50);

        builder.Property(al => al.CreatedAt)
            .HasColumnType("datetime")
            .HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(al => al.User)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(al => al.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
