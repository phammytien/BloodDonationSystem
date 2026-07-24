using Microsoft.EntityFrameworkCore;
using BloodDonation.Domain.Entities;

namespace BloodDonation.Infrastructure.Data;

public class BloodDonationDbContext : DbContext
{
    public BloodDonationDbContext(DbContextOptions<BloodDonationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<BloodType> BloodTypes { get; set; } = null!;
    public DbSet<Donor> Donors { get; set; } = null!;
    public DbSet<DonationCampaign> DonationCampaigns { get; set; } = null!;
    public DbSet<Appointment> Appointments { get; set; } = null!;
    public DbSet<HealthCheck> HealthChecks { get; set; } = null!;
    public DbSet<BloodDonation.Domain.Entities.BloodDonation> BloodDonations { get; set; } = null!;
    public DbSet<BloodInventory> BloodInventories { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<OtpVerification> OtpVerifications { get; set; } = null!;
    public DbSet<FileRecord> Files { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Applies all entity configurations implementing IEntityTypeConfiguration<T> in the current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BloodDonationDbContext).Assembly);
    }
}
