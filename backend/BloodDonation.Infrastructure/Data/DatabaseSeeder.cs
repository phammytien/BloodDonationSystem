using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using BloodDonation.Domain.Entities;
using BloodDonation.Domain.Enums;
using BloodDonation.Infrastructure.Data;

namespace BloodDonation.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BloodDonationDbContext>();

        // 1. Migrate database to apply migrations and save to SQL Server
        await context.Database.EnsureDeletedAsync();
        await context.Database.MigrateAsync();

        // 2. Seed Roles
        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
        var staffRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Staff");
        var donorRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Donor");

        if (adminRole == null)
        {
            adminRole = new Role { RoleName = "Admin", Description = "System Administrator", CreatedAt = DateTime.UtcNow };
            context.Roles.Add(adminRole);
        }
        if (staffRole == null)
        {
            staffRole = new Role { RoleName = "Staff", Description = "Hospital Staff", CreatedAt = DateTime.UtcNow };
            context.Roles.Add(staffRole);
        }
        if (donorRole == null)
        {
            donorRole = new Role { RoleName = "Donor", Description = "Blood Donor", CreatedAt = DateTime.UtcNow };
            context.Roles.Add(donorRole);
        }

        await context.SaveChangesAsync();

        // 3. Seed Blood Types
        var defaultBloodType = await context.BloodTypes.FirstOrDefaultAsync();
        if (defaultBloodType == null)
        {
            var groups = new[] { "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };
            foreach (var group in groups)
            {
                context.BloodTypes.Add(new BloodType { BloodGroup = group });
            }
            await context.SaveChangesAsync();
            defaultBloodType = await context.BloodTypes.FirstOrDefaultAsync(bt => bt.BloodGroup == "O+");
        }

        // 4. Seed Admin User
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        if (adminUser == null)
        {
            adminUser = new User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Email = "admin@lifegive.vn",
                Phone = "0987654321",
                RoleId = adminRole.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(adminUser);
        }

        // 5. Seed Staff User
        var staffUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "staff");
        if (staffUser == null)
        {
            staffUser = new User
            {
                Username = "staff",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"),
                Email = "staff@lifegive.vn",
                Phone = "0987654322",
                RoleId = staffRole.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(staffUser);
        }

        // 6. Seed Donor User & Profile
        var donorUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "donor");
        if (donorUser == null)
        {
            donorUser = new User
            {
                Username = "donor",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"),
                Email = "donor@lifegive.vn",
                Phone = "0987654323",
                RoleId = donorRole.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(donorUser);
            await context.SaveChangesAsync(); // Save user to generate UserId

            // Create linked Donor profile
            var donorProfile = new Donor
            {
                UserId = donorUser.UserId,
                FullName = "Nguyễn Văn Anh",
                Gender = true,
                DateOfBirth = new DateTime(1995, 8, 15),
                CitizenId = "123456789",
                Phone = "0987654323",
                Email = "donor@lifegive.vn",
                Address = "123 Nguyễn Trãi",
                Province = "Hà Nội",
                Ward = "Nhân Chính",
                Occupation = "Kỹ sư",
                BloodTypeId = defaultBloodType!.BloodTypeId,
                Weight = 65m,
                Height = 172.00m,
                TotalDonationTimes = 2,
                IsAvailable = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Donors.Add(donorProfile);
        }

        await context.SaveChangesAsync();

        // 7. Seed Demo Donation Campaigns
        var hasCampaign = await context.DonationCampaigns.AnyAsync();
        if (!hasCampaign)
        {
            context.DonationCampaigns.AddRange(
                new DonationCampaign
                {
                    CampaignName = "Chiến dịch Hiến máu Nhân đạo Hè 2026",
                    Description = "Chiến dịch hiến máu nhân đạo thường niên nhằm bổ sung nguồn máu dự trữ cho các bệnh viện trong mùa hè.",
                    Location = "Bệnh viện Đa Khoa Trung Ương Hà Nội",
                    Organizer = "Hội Chữ thập đỏ Việt Nam",
                    StartDate = new DateTime(2026, 8, 1, 7, 0, 0),
                    EndDate = new DateTime(2026, 8, 5, 17, 0, 0),
                    MaxParticipants = 500,
                    Status = CampaignStatus.Upcoming,
                    AttachmentUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    AttachmentName = "KeHoachHienMau_He2026.pdf",
                    CreatedAt = DateTime.UtcNow
                },
                new DonationCampaign
                {
                    CampaignName = "Ngày hội Giọt hồng 2026",
                    Description = "Sự kiện hiến máu lớn nhất năm, kết hợp các hoạt động văn hóa và tuyên truyền về hiến máu.",
                    Location = "Trung tâm Hội nghị Quốc gia, Hà Nội",
                    Organizer = "Viện Huyết học - Truyền máu Trung ương",
                    StartDate = new DateTime(2026, 6, 10, 7, 0, 0),
                    EndDate = new DateTime(2026, 6, 12, 17, 0, 0),
                    MaxParticipants = 1000,
                    Status = CampaignStatus.Closed,
                    AttachmentUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    AttachmentName = "TuyenBoHienMau_GiotHong2026.pdf",
                    CreatedAt = DateTime.UtcNow
                }
            );
        }

        // 8. Seed Blood Inventory
        var hasInventory = await context.BloodInventories.AnyAsync();
        if (!hasInventory)
        {
            var allBloodTypes = await context.BloodTypes.ToListAsync();
            foreach (var bt in allBloodTypes)
            {
                context.BloodInventories.Add(new BloodInventory
                {
                    BloodTypeId = bt.BloodTypeId,
                    QuantityML = new Random().Next(2000, 15000),
                    ExpiredDate = DateTime.UtcNow.AddDays(42).Date,  // Blood typically expires in 42 days
                    StorageLocation = "Kho lạnh A - Tầng 2",
                    Status = InventoryStatus.Available,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        await context.SaveChangesAsync();
        await SeedMockDataAsync(context);

        await context.SaveChangesAsync();
        Console.WriteLine("[DATABASE SEEDER] Seeded Roles, BloodTypes, Users, Campaigns, and BloodInventory successfully.");
    }

    private static async Task SeedMockDataAsync(BloodDonationDbContext context)
    {
        var donorRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Donor");
        var defaultBloodType = await context.BloodTypes.FirstOrDefaultAsync(bt => bt.BloodGroup == "O+");
        if (donorRole == null || defaultBloodType == null) return;

        var realNames = new[] { "Trần Văn Nam", "Nguyễn Thị Mai", "Lê Hữu Phúc", "Phạm Thu Hương", "Hoàng Ngọc Yến", "Vũ Minh Đức", "Đặng Quang Hưng", "Bùi Thị Lan", "Trịnh Xuân Bách", "Đỗ Hải Yến" };
        var doctorNames = new[] { "Bác sĩ Lê Thị Trúc", "Bác sĩ Phạm Văn Cường", "Y tá Nguyễn Hữu Bình", "Bác sĩ Đặng Thu Thủy" };

        // Ensure 10 donors
        var donorCount = await context.Donors.CountAsync();
        if (donorCount < 10)
        {
            for (int i = donorCount; i < 10; i++)
            {
                var newUser = new User
                {
                    Username = $"donor{i}",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"),
                    Email = $"donor{i}@lifegive.vn",
                    Phone = $"0987654{300 + i}",
                    RoleId = donorRole.RoleId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-new Random().Next(10, 100))
                };
                context.Users.Add(newUser);
                await context.SaveChangesAsync(); // get id

                var newDonor = new Donor
                {
                    UserId = newUser.UserId,
                    FullName = realNames[i % realNames.Length],
                    Gender = i % 2 == 0,
                    DateOfBirth = new DateTime(1990 + i, 1 + (i % 11), 1 + (i % 28)),
                    CitizenId = $"0123456789{i}",
                    Phone = newUser.Phone,
                    Email = newUser.Email,
                    Address = $"Số {i} Đường ABC",
                    Province = "Hà Nội",
                    Ward = "Phường XYZ",
                    Occupation = "Tự do",
                    BloodTypeId = defaultBloodType.BloodTypeId,
                    Weight = 60m + i,
                    Height = 165.00m + i,
                    TotalDonationTimes = new Random().Next(0, 5),
                    IsAvailable = true,
                    CreatedAt = newUser.CreatedAt
                };
                context.Donors.Add(newDonor);
            }
            await context.SaveChangesAsync();
        }

        // Ensure 10 campaigns
        var campaignCount = await context.DonationCampaigns.CountAsync();
        if (campaignCount < 10)
        {
            for (int i = campaignCount; i < 10; i++)
            {
                context.DonationCampaigns.Add(new DonationCampaign
                {
                    CampaignName = $"Chiến dịch Hiến máu Tình nguyện đợt {i + 1} - 2026",
                    Description = $"Chiến dịch hiến máu được tổ chức thường kỳ số {i + 1}.",
                    Location = $"Điểm hiến máu số {i + 1}",
                    Organizer = "Hội Chữ thập đỏ",
                    StartDate = DateTime.UtcNow.AddDays(new Random().Next(-20, 20)),
                    EndDate = DateTime.UtcNow.AddDays(new Random().Next(21, 30)),
                    MaxParticipants = 100 + i * 50,
                    Status = i % 3 == 0 ? CampaignStatus.Closed : (i % 2 == 0 ? CampaignStatus.Upcoming : CampaignStatus.Opening),
                    CreatedAt = DateTime.UtcNow.AddDays(-new Random().Next(10, 50))
                });
            }
            await context.SaveChangesAsync();
        }

        // Ensure some Appointments and Donations
        var appointmentCount = await context.Appointments.CountAsync();
        if (appointmentCount < 10)
        {
            var donors = await context.Donors.ToListAsync();
            var campaigns = await context.DonationCampaigns.ToListAsync();
            var rand = new Random();

            for (int i = appointmentCount; i < 15; i++)
            {
                var d = donors[i % donors.Count];
                var c = campaigns[i % campaigns.Count];

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = c.CampaignId,
                    AppointmentDate = c.StartDate.AddDays(rand.Next(0, 3)),
                    TimeSlot = "08:00 - 10:00",
                    Status = (i % 3 == 0) ? AppointmentStatus.Pending : AppointmentStatus.Completed,
                    CreatedAt = DateTime.UtcNow.AddDays(-rand.Next(1, 10))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync();

                if (appt.Status == AppointmentStatus.Completed)
                {
                    context.BloodDonations.Add(new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? defaultBloodType.BloodTypeId,
                        VolumeML = 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = doctorNames[i % doctorNames.Length],
                        Remark = "Sức khỏe tốt"
                    });
                }
            }
            await context.SaveChangesAsync();
        }
    }
}
