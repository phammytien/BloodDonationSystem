
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using BloodDonation.Domain.Entities;
using BloodDonation.Domain.Enums;
using BloodDonation.Infrastructure.Data;
using System.Collections.Generic;

namespace BloodDonation.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BloodDonationDbContext>();

        // Uncomment the line below to reset the database completely
        // await context.Database.EnsureDeletedAsync();
        await context.Database.MigrateAsync();

        // 1. Roles
        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
        if (adminRole == null) { adminRole = new Role { RoleName = "Admin", Description = "System Administrator", CreatedAt = DateTime.UtcNow }; context.Roles.Add(adminRole); }
        
        var staffRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Staff");
        if (staffRole == null) { staffRole = new Role { RoleName = "Staff", Description = "Hospital Staff", CreatedAt = DateTime.UtcNow }; context.Roles.Add(staffRole); }
        
        var donorRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Donor");
        if (donorRole == null) { donorRole = new Role { RoleName = "Donor", Description = "Blood Donor", CreatedAt = DateTime.UtcNow }; context.Roles.Add(donorRole); }

        await context.SaveChangesAsync();

        // 2. Blood Types
        var bloodGroups = new[] { "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };
        var dictBloodTypes = new Dictionary<string, int>();
        foreach (var group in bloodGroups)
        {
            var bt = await context.BloodTypes.FirstOrDefaultAsync(b => b.BloodGroup == group);
            if (bt == null)
            {
                bt = new BloodType { BloodGroup = group };
                context.BloodTypes.Add(bt);
                await context.SaveChangesAsync();
            }
            dictBloodTypes[group] = bt.BloodTypeId;
        }

        // 3. Admin & Staff
        // 2. Admin User
        var adminRoleRef = await context.Roles.FirstAsync(r => r.RoleName == "Admin");
        var admin = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@lifegive.vn");
        if (admin == null)
        {
            admin = new User { Username = "admin", FullName = "Quản Trị Viên", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"), Email = "admin@lifegive.vn", RoleId = adminRoleRef.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow };
            context.Users.Add(admin);
        }
        await context.SaveChangesAsync();

        // 3. Staff Users
        var staffRoleRef = await context.Roles.FirstAsync(r => r.RoleName == "Staff");
        
        var staff1 = await context.Users.FirstOrDefaultAsync(u => u.Email == "staff01@lifegive.vn");
        if (staff1 == null)
        {
            staff1 = new User { Username = "staff01", FullName = "Nguyễn Văn Thành", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"), Email = "staff01@lifegive.vn", Phone = "0900000001", RoleId = staffRoleRef.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow };
            context.Users.Add(staff1);
        }
        else
        {
            bool updated = false;
            if (string.IsNullOrEmpty(staff1.FullName) || staff1.FullName == "Nguyễn Văn Nhân Viên 1" || staff1.FullName == "staff01") { staff1.FullName = "Nguyễn Văn Thành"; updated = true; }
            if (updated) context.Users.Update(staff1);
        }

        var staff2 = await context.Users.FirstOrDefaultAsync(u => u.Email == "staff02@lifegive.vn");
        if (staff2 == null)
        {
            staff2 = new User { Username = "staff02", FullName = "Trần Thu Thủy", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"), Email = "staff02@lifegive.vn", Phone = "0900000002", RoleId = staffRoleRef.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow };
            context.Users.Add(staff2);
        }

        var staff3 = await context.Users.FirstOrDefaultAsync(u => u.Email == "nguyen.hoa@lifegive.vn");
        if (staff3 == null)
        {
            staff3 = new User { Username = "nguyen.hoa", FullName = "Nguyễn Thị Hoa", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"), Email = "nguyen.hoa@lifegive.vn", Phone = "0900000003", RoleId = staffRoleRef.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow };
            context.Users.Add(staff3);
        }
        else if (string.IsNullOrEmpty(staff3.FullName))
        {
            staff3.FullName = "Nguyễn Thị Hoa";
        }

        var staff4 = await context.Users.FirstOrDefaultAsync(u => u.Email == "tran.binh@lifegive.vn");
        if (staff4 == null)
        {
            staff4 = new User { Username = "tran.binh", FullName = "Trần Thanh Bình", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"), Email = "tran.binh@lifegive.vn", Phone = "0900000004", RoleId = staffRoleRef.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow };
            context.Users.Add(staff4);
        }
        else if (string.IsNullOrEmpty(staff4.FullName))
        {
            staff4.FullName = "Trần Thanh Bình";
        }

        var staff5 = await context.Users.FirstOrDefaultAsync(u => u.Email == "le.tuan@lifegive.vn");
        if (staff5 == null)
        {
            staff5 = new User { Username = "le.tuan", FullName = "Lê Minh Tuấn", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"), Email = "le.tuan@lifegive.vn", Phone = "0900000005", RoleId = staffRoleRef.RoleId, IsActive = false, CreatedAt = DateTime.UtcNow };
            context.Users.Add(staff5);
        }
        else if (string.IsNullOrEmpty(staff5.FullName))
        {
            staff5.FullName = "Lê Minh Tuấn";
        }

        await context.SaveChangesAsync();

        // 4. Donors
        var donorCount = await context.Donors.CountAsync();
        var allDonors = await context.Donors.ToListAsync();
        var rnd = new Random(12345); // Fixed seed for reproducible data
        
        if (donorCount < 30)
        {

            var user0 = await context.Users.FirstOrDefaultAsync(u => u.Email == "nguyenminhanh00@example.com");
            if (user0 == null)
            {
                user0 = new User { Username = "nguyenminhanh00", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "nguyenminhanh00@example.com", Phone = "0900000000", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user0);
                await context.SaveChangesAsync();
                
                var donor0 = new Donor { 
                    UserId = user0.UserId, 
                    FullName = "Nguyễn Minh Anh", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-43).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000000",
                    Phone = "0900000000",
                    Email = "nguyenminhanh00@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["AB+"],
                    Weight = 75m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user0.CreatedAt
                };
                context.Donors.Add(donor0);
                allDonors.Add(donor0);
            }
    
            var user1 = await context.Users.FirstOrDefaultAsync(u => u.Email == "tranquocbao01@example.com");
            if (user1 == null)
            {
                user1 = new User { Username = "tranquocbao01", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "tranquocbao01@example.com", Phone = "0900000001", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user1);
                await context.SaveChangesAsync();
                
                var donor1 = new Donor { 
                    UserId = user1.UserId, 
                    FullName = "Trần Quốc Bảo", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-35).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000001",
                    Phone = "0900000001",
                    Email = "tranquocbao01@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["A-"],
                    Weight = 67m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user1.CreatedAt
                };
                context.Donors.Add(donor1);
                allDonors.Add(donor1);
            }
    
            var user2 = await context.Users.FirstOrDefaultAsync(u => u.Email == "lehoangnam02@example.com");
            if (user2 == null)
            {
                user2 = new User { Username = "lehoangnam02", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "lehoangnam02@example.com", Phone = "0900000002", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user2);
                await context.SaveChangesAsync();
                
                var donor2 = new Donor { 
                    UserId = user2.UserId, 
                    FullName = "Lê Hoàng Nam", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-25).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000002",
                    Phone = "0900000002",
                    Email = "lehoangnam02@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["AB-"],
                    Weight = 73m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user2.CreatedAt
                };
                context.Donors.Add(donor2);
                allDonors.Add(donor2);
            }
    
            var user3 = await context.Users.FirstOrDefaultAsync(u => u.Email == "phamngoclan03@example.com");
            if (user3 == null)
            {
                user3 = new User { Username = "phamngoclan03", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "phamngoclan03@example.com", Phone = "0900000003", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user3);
                await context.SaveChangesAsync();
                
                var donor3 = new Donor { 
                    UserId = user3.UserId, 
                    FullName = "Phạm Ngọc Lan", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-45).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000003",
                    Phone = "0900000003",
                    Email = "phamngoclan03@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["A-"],
                    Weight = 57m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user3.CreatedAt
                };
                context.Donors.Add(donor3);
                allDonors.Add(donor3);
            }
    
            var user4 = await context.Users.FirstOrDefaultAsync(u => u.Email == "vothanhcong04@example.com");
            if (user4 == null)
            {
                user4 = new User { Username = "vothanhcong04", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "vothanhcong04@example.com", Phone = "0900000004", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user4);
                await context.SaveChangesAsync();
                
                var donor4 = new Donor { 
                    UserId = user4.UserId, 
                    FullName = "Võ Thành Công", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-50).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000004",
                    Phone = "0900000004",
                    Email = "vothanhcong04@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["O+"],
                    Weight = 60m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user4.CreatedAt
                };
                context.Donors.Add(donor4);
                allDonors.Add(donor4);
            }
    
            var user5 = await context.Users.FirstOrDefaultAsync(u => u.Email == "huynhthikimngan05@example.com");
            if (user5 == null)
            {
                user5 = new User { Username = "huynhthikimngan05", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "huynhthikimngan05@example.com", Phone = "0900000005", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user5);
                await context.SaveChangesAsync();
                
                var donor5 = new Donor { 
                    UserId = user5.UserId, 
                    FullName = "Huỳnh Thị Kim Ngân", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-40).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000005",
                    Phone = "0900000005",
                    Email = "huynhthikimngan05@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["O-"],
                    Weight = 60m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user5.CreatedAt
                };
                context.Donors.Add(donor5);
                allDonors.Add(donor5);
            }
    
            var user6 = await context.Users.FirstOrDefaultAsync(u => u.Email == "dangminhkhang06@example.com");
            if (user6 == null)
            {
                user6 = new User { Username = "dangminhkhang06", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "dangminhkhang06@example.com", Phone = "0900000006", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user6);
                await context.SaveChangesAsync();
                
                var donor6 = new Donor { 
                    UserId = user6.UserId, 
                    FullName = "Đặng Minh Khang", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-28).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000006",
                    Phone = "0900000006",
                    Email = "dangminhkhang06@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["A+"],
                    Weight = 79m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user6.CreatedAt
                };
                context.Donors.Add(donor6);
                allDonors.Add(donor6);
            }
    
            var user7 = await context.Users.FirstOrDefaultAsync(u => u.Email == "buithanhtruc07@example.com");
            if (user7 == null)
            {
                user7 = new User { Username = "buithanhtruc07", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "buithanhtruc07@example.com", Phone = "0900000007", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user7);
                await context.SaveChangesAsync();
                
                var donor7 = new Donor { 
                    UserId = user7.UserId, 
                    FullName = "Bùi Thanh Trúc", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-30).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000007",
                    Phone = "0900000007",
                    Email = "buithanhtruc07@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["A+"],
                    Weight = 71m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user7.CreatedAt
                };
                context.Donors.Add(donor7);
                allDonors.Add(donor7);
            }
    
            var user8 = await context.Users.FirstOrDefaultAsync(u => u.Email == "nguyenthithuha08@example.com");
            if (user8 == null)
            {
                user8 = new User { Username = "nguyenthithuha08", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "nguyenthithuha08@example.com", Phone = "0900000008", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user8);
                await context.SaveChangesAsync();
                
                var donor8 = new Donor { 
                    UserId = user8.UserId, 
                    FullName = "Nguyễn Thị Thu Hà", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-45).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000008",
                    Phone = "0900000008",
                    Email = "nguyenthithuha08@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["AB-"],
                    Weight = 55m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user8.CreatedAt
                };
                context.Donors.Add(donor8);
                allDonors.Add(donor8);
            }
    
            var user9 = await context.Users.FirstOrDefaultAsync(u => u.Email == "trannhathuy09@example.com");
            if (user9 == null)
            {
                user9 = new User { Username = "trannhathuy09", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "trannhathuy09@example.com", Phone = "0900000009", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user9);
                await context.SaveChangesAsync();
                
                var donor9 = new Donor { 
                    UserId = user9.UserId, 
                    FullName = "Trần Nhật Huy", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-54).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000009",
                    Phone = "0900000009",
                    Email = "trannhathuy09@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["B-"],
                    Weight = 77m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user9.CreatedAt
                };
                context.Donors.Add(donor9);
                allDonors.Add(donor9);
            }
    
            var user10 = await context.Users.FirstOrDefaultAsync(u => u.Email == "leminhthu10@example.com");
            if (user10 == null)
            {
                user10 = new User { Username = "leminhthu10", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "leminhthu10@example.com", Phone = "0900000010", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user10);
                await context.SaveChangesAsync();
                
                var donor10 = new Donor { 
                    UserId = user10.UserId, 
                    FullName = "Lê Minh Thư", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-32).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000010",
                    Phone = "0900000010",
                    Email = "leminhthu10@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["O-"],
                    Weight = 55m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user10.CreatedAt
                };
                context.Donors.Add(donor10);
                allDonors.Add(donor10);
            }
    
            var user11 = await context.Users.FirstOrDefaultAsync(u => u.Email == "phamhoangphuc11@example.com");
            if (user11 == null)
            {
                user11 = new User { Username = "phamhoangphuc11", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "phamhoangphuc11@example.com", Phone = "0900000011", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user11);
                await context.SaveChangesAsync();
                
                var donor11 = new Donor { 
                    UserId = user11.UserId, 
                    FullName = "Phạm Hoàng Phúc", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-24).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000011",
                    Phone = "0900000011",
                    Email = "phamhoangphuc11@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["AB+"],
                    Weight = 64m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user11.CreatedAt
                };
                context.Donors.Add(donor11);
                allDonors.Add(donor11);
            }
    
            var user12 = await context.Users.FirstOrDefaultAsync(u => u.Email == "vongocanh12@example.com");
            if (user12 == null)
            {
                user12 = new User { Username = "vongocanh12", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "vongocanh12@example.com", Phone = "0900000012", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user12);
                await context.SaveChangesAsync();
                
                var donor12 = new Donor { 
                    UserId = user12.UserId, 
                    FullName = "Võ Ngọc Ánh", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-27).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000012",
                    Phone = "0900000012",
                    Email = "vongocanh12@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["A-"],
                    Weight = 69m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user12.CreatedAt
                };
                context.Donors.Add(donor12);
                allDonors.Add(donor12);
            }
    
            var user13 = await context.Users.FirstOrDefaultAsync(u => u.Email == "huynhquockhanh13@example.com");
            if (user13 == null)
            {
                user13 = new User { Username = "huynhquockhanh13", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "huynhquockhanh13@example.com", Phone = "0900000013", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user13);
                await context.SaveChangesAsync();
                
                var donor13 = new Donor { 
                    UserId = user13.UserId, 
                    FullName = "Huỳnh Quốc Khánh", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-46).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000013",
                    Phone = "0900000013",
                    Email = "huynhquockhanh13@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["O+"],
                    Weight = 72m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user13.CreatedAt
                };
                context.Donors.Add(donor13);
                allDonors.Add(donor13);
            }
    
            var user14 = await context.Users.FirstOrDefaultAsync(u => u.Email == "dangthibichngoc14@example.com");
            if (user14 == null)
            {
                user14 = new User { Username = "dangthibichngoc14", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "dangthibichngoc14@example.com", Phone = "0900000014", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user14);
                await context.SaveChangesAsync();
                
                var donor14 = new Donor { 
                    UserId = user14.UserId, 
                    FullName = "Đặng Thị Bích Ngọc", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-48).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000014",
                    Phone = "0900000014",
                    Email = "dangthibichngoc14@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["O+"],
                    Weight = 45m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user14.CreatedAt
                };
                context.Donors.Add(donor14);
                allDonors.Add(donor14);
            }
    
            var user15 = await context.Users.FirstOrDefaultAsync(u => u.Email == "buigiahan15@example.com");
            if (user15 == null)
            {
                user15 = new User { Username = "buigiahan15", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "buigiahan15@example.com", Phone = "0900000015", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user15);
                await context.SaveChangesAsync();
                
                var donor15 = new Donor { 
                    UserId = user15.UserId, 
                    FullName = "Bùi Gia Hân", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-36).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000015",
                    Phone = "0900000015",
                    Email = "buigiahan15@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["O+"],
                    Weight = 63m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user15.CreatedAt
                };
                context.Donors.Add(donor15);
                allDonors.Add(donor15);
            }
    
            var user16 = await context.Users.FirstOrDefaultAsync(u => u.Email == "nguyenthanhdat16@example.com");
            if (user16 == null)
            {
                user16 = new User { Username = "nguyenthanhdat16", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "nguyenthanhdat16@example.com", Phone = "0900000016", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user16);
                await context.SaveChangesAsync();
                
                var donor16 = new Donor { 
                    UserId = user16.UserId, 
                    FullName = "Nguyễn Thành Đạt", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-25).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000016",
                    Phone = "0900000016",
                    Email = "nguyenthanhdat16@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["O+"],
                    Weight = 77m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user16.CreatedAt
                };
                context.Donors.Add(donor16);
                allDonors.Add(donor16);
            }
    
            var user17 = await context.Users.FirstOrDefaultAsync(u => u.Email == "tranngocmai17@example.com");
            if (user17 == null)
            {
                user17 = new User { Username = "tranngocmai17", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "tranngocmai17@example.com", Phone = "0900000017", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user17);
                await context.SaveChangesAsync();
                
                var donor17 = new Donor { 
                    UserId = user17.UserId, 
                    FullName = "Trần Ngọc Mai", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-51).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000017",
                    Phone = "0900000017",
                    Email = "tranngocmai17@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["B-"],
                    Weight = 78m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user17.CreatedAt
                };
                context.Donors.Add(donor17);
                allDonors.Add(donor17);
            }
    
            var user18 = await context.Users.FirstOrDefaultAsync(u => u.Email == "letrungkien18@example.com");
            if (user18 == null)
            {
                user18 = new User { Username = "letrungkien18", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "letrungkien18@example.com", Phone = "0900000018", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user18);
                await context.SaveChangesAsync();
                
                var donor18 = new Donor { 
                    UserId = user18.UserId, 
                    FullName = "Lê Trung Kiên", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-39).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000018",
                    Phone = "0900000018",
                    Email = "letrungkien18@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["A+"],
                    Weight = 59m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user18.CreatedAt
                };
                context.Donors.Add(donor18);
                allDonors.Add(donor18);
            }
    
            var user19 = await context.Users.FirstOrDefaultAsync(u => u.Email == "phamthaovy19@example.com");
            if (user19 == null)
            {
                user19 = new User { Username = "phamthaovy19", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "phamthaovy19@example.com", Phone = "0900000019", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user19);
                await context.SaveChangesAsync();
                
                var donor19 = new Donor { 
                    UserId = user19.UserId, 
                    FullName = "Phạm Thảo Vy", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-27).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000019",
                    Phone = "0900000019",
                    Email = "phamthaovy19@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["B+"],
                    Weight = 66m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user19.CreatedAt
                };
                context.Donors.Add(donor19);
                allDonors.Add(donor19);
            }
    
            var user20 = await context.Users.FirstOrDefaultAsync(u => u.Email == "vominhquan20@example.com");
            if (user20 == null)
            {
                user20 = new User { Username = "vominhquan20", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "vominhquan20@example.com", Phone = "0900000020", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user20);
                await context.SaveChangesAsync();
                
                var donor20 = new Donor { 
                    UserId = user20.UserId, 
                    FullName = "Võ Minh Quân", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-30).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000020",
                    Phone = "0900000020",
                    Email = "vominhquan20@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["B-"],
                    Weight = 75m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user20.CreatedAt
                };
                context.Donors.Add(donor20);
                allDonors.Add(donor20);
            }
    
            var user21 = await context.Users.FirstOrDefaultAsync(u => u.Email == "huynhthanhtam21@example.com");
            if (user21 == null)
            {
                user21 = new User { Username = "huynhthanhtam21", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "huynhthanhtam21@example.com", Phone = "0900000021", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user21);
                await context.SaveChangesAsync();
                
                var donor21 = new Donor { 
                    UserId = user21.UserId, 
                    FullName = "Huỳnh Thanh Tâm", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-37).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000021",
                    Phone = "0900000021",
                    Email = "huynhthanhtam21@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["B+"],
                    Weight = 81m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user21.CreatedAt
                };
                context.Donors.Add(donor21);
                allDonors.Add(donor21);
            }
    
            var user22 = await context.Users.FirstOrDefaultAsync(u => u.Email == "dangquocviet22@example.com");
            if (user22 == null)
            {
                user22 = new User { Username = "dangquocviet22", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "dangquocviet22@example.com", Phone = "0900000022", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user22);
                await context.SaveChangesAsync();
                
                var donor22 = new Donor { 
                    UserId = user22.UserId, 
                    FullName = "Đặng Quốc Việt", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-23).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000022",
                    Phone = "0900000022",
                    Email = "dangquocviet22@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["A+"],
                    Weight = 76m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user22.CreatedAt
                };
                context.Donors.Add(donor22);
                allDonors.Add(donor22);
            }
    
            var user23 = await context.Users.FirstOrDefaultAsync(u => u.Email == "buikhanhlinh23@example.com");
            if (user23 == null)
            {
                user23 = new User { Username = "buikhanhlinh23", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "buikhanhlinh23@example.com", Phone = "0900000023", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user23);
                await context.SaveChangesAsync();
                
                var donor23 = new Donor { 
                    UserId = user23.UserId, 
                    FullName = "Bùi Khánh Linh", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-29).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000023",
                    Phone = "0900000023",
                    Email = "buikhanhlinh23@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["B-"],
                    Weight = 67m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user23.CreatedAt
                };
                context.Donors.Add(donor23);
                allDonors.Add(donor23);
            }
    
            var user24 = await context.Users.FirstOrDefaultAsync(u => u.Email == "nguyenhoanglong24@example.com");
            if (user24 == null)
            {
                user24 = new User { Username = "nguyenhoanglong24", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "nguyenhoanglong24@example.com", Phone = "0900000024", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user24);
                await context.SaveChangesAsync();
                
                var donor24 = new Donor { 
                    UserId = user24.UserId, 
                    FullName = "Nguyễn Hoàng Long", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-27).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000024",
                    Phone = "0900000024",
                    Email = "nguyenhoanglong24@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["AB+"],
                    Weight = 79m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user24.CreatedAt
                };
                context.Donors.Add(donor24);
                allDonors.Add(donor24);
            }
    
            var user25 = await context.Users.FirstOrDefaultAsync(u => u.Email == "trandiemmy25@example.com");
            if (user25 == null)
            {
                user25 = new User { Username = "trandiemmy25", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "trandiemmy25@example.com", Phone = "0900000025", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user25);
                await context.SaveChangesAsync();
                
                var donor25 = new Donor { 
                    UserId = user25.UserId, 
                    FullName = "Trần Diễm My", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-34).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000025",
                    Phone = "0900000025",
                    Email = "trandiemmy25@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["AB-"],
                    Weight = 64m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user25.CreatedAt
                };
                context.Donors.Add(donor25);
                allDonors.Add(donor25);
            }
    
            var user26 = await context.Users.FirstOrDefaultAsync(u => u.Email == "leanhtuan26@example.com");
            if (user26 == null)
            {
                user26 = new User { Username = "leanhtuan26", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "leanhtuan26@example.com", Phone = "0900000026", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user26);
                await context.SaveChangesAsync();
                
                var donor26 = new Donor { 
                    UserId = user26.UserId, 
                    FullName = "Lê Anh Tuấn", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-21).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000026",
                    Phone = "0900000026",
                    Email = "leanhtuan26@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["O+"],
                    Weight = 64m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user26.CreatedAt
                };
                context.Donors.Add(donor26);
                allDonors.Add(donor26);
            }
    
            var user27 = await context.Users.FirstOrDefaultAsync(u => u.Email == "phamngochan27@example.com");
            if (user27 == null)
            {
                user27 = new User { Username = "phamngochan27", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "phamngochan27@example.com", Phone = "0900000027", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user27);
                await context.SaveChangesAsync();
                
                var donor27 = new Donor { 
                    UserId = user27.UserId, 
                    FullName = "Phạm Ngọc Hân", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-51).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000027",
                    Phone = "0900000027",
                    Email = "phamngochan27@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["A-"],
                    Weight = 50m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user27.CreatedAt
                };
                context.Donors.Add(donor27);
                allDonors.Add(donor27);
            }
    
            var user28 = await context.Users.FirstOrDefaultAsync(u => u.Email == "voducthinh28@example.com");
            if (user28 == null)
            {
                user28 = new User { Username = "voducthinh28", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "voducthinh28@example.com", Phone = "0900000028", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user28);
                await context.SaveChangesAsync();
                
                var donor28 = new Donor { 
                    UserId = user28.UserId, 
                    FullName = "Võ Đức Thịnh", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-35).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000028",
                    Phone = "0900000028",
                    Email = "voducthinh28@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["A+"],
                    Weight = 62m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user28.CreatedAt
                };
                context.Donors.Add(donor28);
                allDonors.Add(donor28);
            }
    
            var user29 = await context.Users.FirstOrDefaultAsync(u => u.Email == "huynhmaiphuong29@example.com");
            if (user29 == null)
            {
                user29 = new User { Username = "huynhmaiphuong29", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "huynhmaiphuong29@example.com", Phone = "0900000029", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user29);
                await context.SaveChangesAsync();
                
                var donor29 = new Donor { 
                    UserId = user29.UserId, 
                    FullName = "Huỳnh Mai Phương", 
                    Gender = false, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-30).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000029",
                    Phone = "0900000029",
                    Email = "huynhmaiphuong29@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["AB-"],
                    Weight = 69m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user29.CreatedAt
                };
                context.Donors.Add(donor29);
                allDonors.Add(donor29);
            }
    
            var user30 = await context.Users.FirstOrDefaultAsync(u => u.Email == "nguyenvanan30@example.com");
            if (user30 == null)
            {
                user30 = new User { Username = "nguyenvanan30", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "nguyenvanan30@example.com", Phone = "0900000030", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user30);
                await context.SaveChangesAsync();
                
                var donor30 = new Donor { 
                    UserId = user30.UserId, 
                    FullName = "Nguyễn Văn An", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-22).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000030",
                    Phone = "0900000030",
                    Email = "nguyenvanan30@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["B+"],
                    Weight = 63m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user30.CreatedAt
                };
                context.Donors.Add(donor30);
                allDonors.Add(donor30);
            }
    
            var user31 = await context.Users.FirstOrDefaultAsync(u => u.Email == "tranthibe31@example.com");
            if (user31 == null)
            {
                user31 = new User { Username = "tranthibe31", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "tranthibe31@example.com", Phone = "0900000031", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user31);
                await context.SaveChangesAsync();
                
                var donor31 = new Donor { 
                    UserId = user31.UserId, 
                    FullName = "Trần Thị Bé", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-41).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000031",
                    Phone = "0900000031",
                    Email = "tranthibe31@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["B-"],
                    Weight = 46m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user31.CreatedAt
                };
                context.Donors.Add(donor31);
                allDonors.Add(donor31);
            }
    
            var user32 = await context.Users.FirstOrDefaultAsync(u => u.Email == "levancuong32@example.com");
            if (user32 == null)
            {
                user32 = new User { Username = "levancuong32", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Donor@123"), Email = "levancuong32@example.com", Phone = "0900000032", RoleId = donorRole.RoleId, IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(100, 500)) };
                context.Users.Add(user32);
                await context.SaveChangesAsync();
                
                var donor32 = new Donor { 
                    UserId = user32.UserId, 
                    FullName = "Lê Văn Cường", 
                    Gender = true, 
                    DateOfBirth = DateTime.UtcNow.AddYears(-43).AddDays(rnd.Next(-300, 300)),
                    CitizenId = "079090000032",
                    Phone = "0900000032",
                    Email = "levancuong32@example.com",
                    Address = "Đồng Tháp",
                    Province = "Đồng Tháp",
                    Ward = "Phường 1",
                    Occupation = "Tự do",
                    BloodTypeId = dictBloodTypes["AB-"],
                    Weight = 69m,
                    Height = 165m,
                    TotalDonationTimes = 0,
                    IsAvailable = true,
                    CreatedAt = user32.CreatedAt
                };
                context.Donors.Add(donor32);
                allDonors.Add(donor32);
            }
    
            await context.SaveChangesAsync();
        }
        else 
        {
            // if already created, just reload all
            allDonors = await context.Donors.ToListAsync();
        }

        // 5. Campaigns
        var dbCampaigns = await context.DonationCampaigns.ToListAsync();
        var allDbCampaigns = new List<DonationCampaign>();

        var camp0 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội Hiến máu “Giọt hồng Đồng Tháp” năm 2026");
        if (camp0 == null)
        {
            camp0 = new DonationCampaign
            {
                CampaignName = "Ngày hội Hiến máu “Giọt hồng Đồng Tháp” năm 2026",
                Description = "Ngày hội Hiến máu “Giọt hồng Đồng Tháp” năm 2026",
                Location = "Hội trường Nhà Văn hóa Lao động tỉnh Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 01, 15, 07, 00, 0),
                EndDate = new DateTime(2026, 01, 15, 11, 30, 0),
                MaxParticipants = 250,
                Status = CampaignStatus.Closed,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp0);
        }
        allDbCampaigns.Add(camp0);
    
        var camp1 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Hiến máu đầu xuân – Trao giọt máu, gửi yêu thương");
        if (camp1 == null)
        {
            camp1 = new DonationCampaign
            {
                CampaignName = "Hiến máu đầu xuân – Trao giọt máu, gửi yêu thương",
                Description = "Hiến máu đầu xuân – Trao giọt máu, gửi yêu thương",
                Location = "Trung tâm Văn hóa – Học tập cộng đồng phường Mỹ Ngãi",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 02, 22, 07, 30, 0),
                EndDate = new DateTime(2026, 02, 22, 11, 00, 0),
                MaxParticipants = 150,
                Status = CampaignStatus.Closed,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp1);
        }
        allDbCampaigns.Add(camp1);
    
        var camp2 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Chủ nhật Đỏ – Hiến máu cứu người năm 2026");
        if (camp2 == null)
        {
            camp2 = new DonationCampaign
            {
                CampaignName = "Chủ nhật Đỏ – Hiến máu cứu người năm 2026",
                Description = "Chủ nhật Đỏ – Hiến máu cứu người năm 2026",
                Location = "Trường Đại học Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 03, 29, 06, 30, 0),
                EndDate = new DateTime(2026, 03, 29, 11, 30, 0),
                MaxParticipants = 400,
                Status = CampaignStatus.Closed,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp2);
        }
        allDbCampaigns.Add(camp2);
    
        var camp3 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Giọt máu nghĩa tình – Vì sức khỏe cộng đồng");
        if (camp3 == null)
        {
            camp3 = new DonationCampaign
            {
                CampaignName = "Giọt máu nghĩa tình – Vì sức khỏe cộng đồng",
                Description = "Giọt máu nghĩa tình – Vì sức khỏe cộng đồng",
                Location = "Trung tâm Y tế khu vực Cao Lãnh",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 05, 17, 07, 00, 0),
                EndDate = new DateTime(2026, 05, 17, 11, 00, 0),
                MaxParticipants = 180,
                Status = CampaignStatus.Closed,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp3);
        }
        allDbCampaigns.Add(camp3);
    
        var camp4 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Hành trình Đỏ – Kết nối dòng máu Việt 2026");
        if (camp4 == null)
        {
            camp4 = new DonationCampaign
            {
                CampaignName = "Hành trình Đỏ – Kết nối dòng máu Việt 2026",
                Description = "Hành trình Đỏ – Kết nối dòng máu Việt 2026",
                Location = "Quảng trường Văn Miếu",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 07, 12, 06, 30, 0),
                EndDate = new DateTime(2026, 07, 12, 12, 00, 0),
                MaxParticipants = 500,
                Status = CampaignStatus.Closed,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp4);
        }
        allDbCampaigns.Add(camp4);
    
        var camp5 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội Hiến máu tình nguyện phường Mỹ Ngãi – Đợt 1");
        if (camp5 == null)
        {
            camp5 = new DonationCampaign
            {
                CampaignName = "Ngày hội Hiến máu tình nguyện phường Mỹ Ngãi – Đợt 1",
                Description = "Ngày hội Hiến máu tình nguyện phường Mỹ Ngãi – Đợt 1",
                Location = "UBND phường Mỹ Ngãi",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 08, 05, 07, 00, 0),
                EndDate = new DateTime(2026, 08, 05, 11, 30, 0),
                MaxParticipants = 200,
                Status = CampaignStatus.Opening,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp5);
        }
        allDbCampaigns.Add(camp5);
    
        var camp6 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Giọt hồng tuổi trẻ – Chung tay vì người bệnh");
        if (camp6 == null)
        {
            camp6 = new DonationCampaign
            {
                CampaignName = "Giọt hồng tuổi trẻ – Chung tay vì người bệnh",
                Description = "Giọt hồng tuổi trẻ – Chung tay vì người bệnh",
                Location = "Nhà Văn hóa Sinh viên tỉnh Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 08, 20, 07, 00, 0),
                EndDate = new DateTime(2026, 08, 20, 11, 00, 0),
                MaxParticipants = 300,
                Status = CampaignStatus.Opening,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp6);
        }
        allDbCampaigns.Add(camp6);
    
        var camp7 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Trung thu yêu thương – Hiến máu sẻ chia");
        if (camp7 == null)
        {
            camp7 = new DonationCampaign
            {
                CampaignName = "Trung thu yêu thương – Hiến máu sẻ chia",
                Description = "Trung thu yêu thương – Hiến máu sẻ chia",
                Location = "Trung tâm Văn hóa tỉnh Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 09, 25, 07, 30, 0),
                EndDate = new DateTime(2026, 09, 25, 11, 30, 0),
                MaxParticipants = 220,
                Status = CampaignStatus.Upcoming,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp7);
        }
        allDbCampaigns.Add(camp7);
    
        var camp8 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Mỗi giọt máu cho đi – Một cuộc đời ở lại");
        if (camp8 == null)
        {
            camp8 = new DonationCampaign
            {
                CampaignName = "Mỗi giọt máu cho đi – Một cuộc đời ở lại",
                Description = "Mỗi giọt máu cho đi – Một cuộc đời ở lại",
                Location = "Bệnh viện Đa khoa Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 10, 18, 07, 00, 0),
                EndDate = new DateTime(2026, 10, 18, 12, 00, 0),
                MaxParticipants = 350,
                Status = CampaignStatus.Upcoming,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp8);
        }
        allDbCampaigns.Add(camp8);
    
        var camp9 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Hiến máu tình nguyện – Sẻ chia sự sống cuối năm 2026");
        if (camp9 == null)
        {
            camp9 = new DonationCampaign
            {
                CampaignName = "Hiến máu tình nguyện – Sẻ chia sự sống cuối năm 2026",
                Description = "Hiến máu tình nguyện – Sẻ chia sự sống cuối năm 2026",
                Location = "Nhà Thiếu nhi tỉnh Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 12, 13, 07, 00, 0),
                EndDate = new DateTime(2026, 12, 13, 11, 30, 0),
                MaxParticipants = 300,
                Status = CampaignStatus.Upcoming,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp9);
        }
        allDbCampaigns.Add(camp9);
    
        var camp10 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội hiến máu Thanh Niên - Đợt 11 năm 2026");
        if (camp10 == null)
        {
            camp10 = new DonationCampaign
            {
                CampaignName = "Ngày hội hiến máu Thanh Niên - Đợt 11 năm 2026",
                Description = "Ngày hội hiến máu Thanh Niên - Đợt 11 năm 2026",
                Location = "Trường Cao đẳng Y tế Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 12, 18, 07, 30, 0),
                EndDate = new DateTime(2026, 12, 18, 11, 00, 0),
                MaxParticipants = 117,
                Status = CampaignStatus.Upcoming,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp10);
        }
        allDbCampaigns.Add(camp10);
    
        var camp11 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội hiến máu Thanh Niên - Đợt 12 năm 2026");
        if (camp11 == null)
        {
            camp11 = new DonationCampaign
            {
                CampaignName = "Ngày hội hiến máu Thanh Niên - Đợt 12 năm 2026",
                Description = "Ngày hội hiến máu Thanh Niên - Đợt 12 năm 2026",
                Location = "Trường Cao đẳng Y tế Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 05, 08, 07, 30, 0),
                EndDate = new DateTime(2026, 05, 08, 11, 00, 0),
                MaxParticipants = 117,
                Status = CampaignStatus.Closed,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp11);
        }
        allDbCampaigns.Add(camp11);
    
        var camp12 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội hiến máu Thanh Niên - Đợt 13 năm 2026");
        if (camp12 == null)
        {
            camp12 = new DonationCampaign
            {
                CampaignName = "Ngày hội hiến máu Thanh Niên - Đợt 13 năm 2026",
                Description = "Ngày hội hiến máu Thanh Niên - Đợt 13 năm 2026",
                Location = "Trường Cao đẳng Y tế Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 09, 18, 07, 30, 0),
                EndDate = new DateTime(2026, 09, 18, 11, 00, 0),
                MaxParticipants = 158,
                Status = CampaignStatus.Upcoming,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp12);
        }
        allDbCampaigns.Add(camp12);
    
        var camp13 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội hiến máu Thanh Niên - Đợt 14 năm 2026");
        if (camp13 == null)
        {
            camp13 = new DonationCampaign
            {
                CampaignName = "Ngày hội hiến máu Thanh Niên - Đợt 14 năm 2026",
                Description = "Ngày hội hiến máu Thanh Niên - Đợt 14 năm 2026",
                Location = "Trường Cao đẳng Y tế Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 09, 10, 07, 30, 0),
                EndDate = new DateTime(2026, 09, 10, 11, 00, 0),
                MaxParticipants = 291,
                Status = CampaignStatus.Upcoming,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp13);
        }
        allDbCampaigns.Add(camp13);
    
        var camp14 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội hiến máu Thanh Niên - Đợt 15 năm 2026");
        if (camp14 == null)
        {
            camp14 = new DonationCampaign
            {
                CampaignName = "Ngày hội hiến máu Thanh Niên - Đợt 15 năm 2026",
                Description = "Ngày hội hiến máu Thanh Niên - Đợt 15 năm 2026",
                Location = "Trường Cao đẳng Y tế Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 04, 28, 07, 30, 0),
                EndDate = new DateTime(2026, 04, 28, 11, 00, 0),
                MaxParticipants = 207,
                Status = CampaignStatus.Closed,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp14);
        }
        allDbCampaigns.Add(camp14);
    
        var camp15 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội hiến máu Thanh Niên - Đợt 16 năm 2026");
        if (camp15 == null)
        {
            camp15 = new DonationCampaign
            {
                CampaignName = "Ngày hội hiến máu Thanh Niên - Đợt 16 năm 2026",
                Description = "Ngày hội hiến máu Thanh Niên - Đợt 16 năm 2026",
                Location = "Trường Cao đẳng Y tế Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 06, 08, 07, 30, 0),
                EndDate = new DateTime(2026, 06, 08, 11, 00, 0),
                MaxParticipants = 103,
                Status = CampaignStatus.Closed,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp15);
        }
        allDbCampaigns.Add(camp15);
    
        var camp16 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội hiến máu Thanh Niên - Đợt 17 năm 2026");
        if (camp16 == null)
        {
            camp16 = new DonationCampaign
            {
                CampaignName = "Ngày hội hiến máu Thanh Niên - Đợt 17 năm 2026",
                Description = "Ngày hội hiến máu Thanh Niên - Đợt 17 năm 2026",
                Location = "Trường Cao đẳng Y tế Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 08, 27, 07, 30, 0),
                EndDate = new DateTime(2026, 08, 27, 11, 00, 0),
                MaxParticipants = 259,
                Status = CampaignStatus.Opening,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp16);
        }
        allDbCampaigns.Add(camp16);
    
        var camp17 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội hiến máu Thanh Niên - Đợt 18 năm 2026");
        if (camp17 == null)
        {
            camp17 = new DonationCampaign
            {
                CampaignName = "Ngày hội hiến máu Thanh Niên - Đợt 18 năm 2026",
                Description = "Ngày hội hiến máu Thanh Niên - Đợt 18 năm 2026",
                Location = "Trường Cao đẳng Y tế Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 06, 18, 07, 30, 0),
                EndDate = new DateTime(2026, 06, 18, 11, 00, 0),
                MaxParticipants = 172,
                Status = CampaignStatus.Closed,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp17);
        }
        allDbCampaigns.Add(camp17);
    
        var camp18 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội hiến máu Thanh Niên - Đợt 19 năm 2026");
        if (camp18 == null)
        {
            camp18 = new DonationCampaign
            {
                CampaignName = "Ngày hội hiến máu Thanh Niên - Đợt 19 năm 2026",
                Description = "Ngày hội hiến máu Thanh Niên - Đợt 19 năm 2026",
                Location = "Trường Cao đẳng Y tế Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 08, 13, 07, 30, 0),
                EndDate = new DateTime(2026, 08, 13, 11, 00, 0),
                MaxParticipants = 295,
                Status = CampaignStatus.Opening,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp18);
        }
        allDbCampaigns.Add(camp18);
    
        var camp19 = dbCampaigns.FirstOrDefault(c => c.CampaignName == "Ngày hội hiến máu Thanh Niên - Đợt 20 năm 2026");
        if (camp19 == null)
        {
            camp19 = new DonationCampaign
            {
                CampaignName = "Ngày hội hiến máu Thanh Niên - Đợt 20 năm 2026",
                Description = "Ngày hội hiến máu Thanh Niên - Đợt 20 năm 2026",
                Location = "Trường Cao đẳng Y tế Đồng Tháp",
                Organizer = "Hội Chữ thập đỏ Đồng Tháp",
                StartDate = new DateTime(2026, 04, 21, 07, 30, 0),
                EndDate = new DateTime(2026, 04, 21, 11, 00, 0),
                MaxParticipants = 121,
                Status = CampaignStatus.Closed,
                CreatedAt = DateTime.UtcNow.AddDays(-rnd.Next(60, 200))
            };
            context.DonationCampaigns.Add(camp19);
        }
        allDbCampaigns.Add(camp19);
    
        await context.SaveChangesAsync();

        // 6. Appointments & Health checks & Donations
        var apptCount = await context.Appointments.CountAsync();
        if (apptCount < 50)
        {
            var usedDonors = new HashSet<string>();

            // Generate for campaign 0
            usedDonors.Clear();
            int numAppts0 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts0; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp0.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp0.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp0.CampaignId,
                    AppointmentDate = camp0.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:00 - 11:30",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp0.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 1
            usedDonors.Clear();
            int numAppts1 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts1; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp1.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp1.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp1.CampaignId,
                    AppointmentDate = camp1.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp1.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 2
            usedDonors.Clear();
            int numAppts2 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts2; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp2.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp2.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp2.CampaignId,
                    AppointmentDate = camp2.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "06:30 - 11:30",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp2.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 3
            usedDonors.Clear();
            int numAppts3 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts3; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp3.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp3.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp3.CampaignId,
                    AppointmentDate = camp3.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:00 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp3.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 4
            usedDonors.Clear();
            int numAppts4 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts4; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp4.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp4.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp4.CampaignId,
                    AppointmentDate = camp4.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "06:30 - 12:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp4.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 5
            usedDonors.Clear();
            int numAppts5 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts5; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp5.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp5.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp5.CampaignId,
                    AppointmentDate = camp5.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:00 - 11:30",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp5.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 6
            usedDonors.Clear();
            int numAppts6 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts6; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp6.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp6.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp6.CampaignId,
                    AppointmentDate = camp6.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:00 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp6.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 7
            usedDonors.Clear();
            int numAppts7 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts7; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp7.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp7.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp7.CampaignId,
                    AppointmentDate = camp7.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:30",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp7.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 8
            usedDonors.Clear();
            int numAppts8 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts8; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp8.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp8.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp8.CampaignId,
                    AppointmentDate = camp8.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:00 - 12:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp8.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 9
            usedDonors.Clear();
            int numAppts9 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts9; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp9.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp9.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp9.CampaignId,
                    AppointmentDate = camp9.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:00 - 11:30",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp9.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 10
            usedDonors.Clear();
            int numAppts10 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts10; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp10.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp10.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp10.CampaignId,
                    AppointmentDate = camp10.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp10.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 11
            usedDonors.Clear();
            int numAppts11 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts11; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp11.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp11.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp11.CampaignId,
                    AppointmentDate = camp11.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp11.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 12
            usedDonors.Clear();
            int numAppts12 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts12; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp12.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp12.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp12.CampaignId,
                    AppointmentDate = camp12.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp12.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 13
            usedDonors.Clear();
            int numAppts13 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts13; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp13.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp13.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp13.CampaignId,
                    AppointmentDate = camp13.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp13.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 14
            usedDonors.Clear();
            int numAppts14 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts14; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp14.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp14.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp14.CampaignId,
                    AppointmentDate = camp14.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp14.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 15
            usedDonors.Clear();
            int numAppts15 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts15; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp15.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp15.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp15.CampaignId,
                    AppointmentDate = camp15.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp15.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 16
            usedDonors.Clear();
            int numAppts16 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts16; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp16.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp16.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp16.CampaignId,
                    AppointmentDate = camp16.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp16.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 17
            usedDonors.Clear();
            int numAppts17 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts17; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp17.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp17.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp17.CampaignId,
                    AppointmentDate = camp17.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp17.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 18
            usedDonors.Clear();
            int numAppts18 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts18; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp18.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp18.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp18.CampaignId,
                    AppointmentDate = camp18.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp18.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            // Generate for campaign 19
            usedDonors.Clear();
            int numAppts19 = rnd.Next(15, 21);
            for(int k = 0; k < numAppts19; k++)
            {
                var d = allDonors[rnd.Next(allDonors.Count)];
                if (usedDonors.Contains(d.DonorId.ToString())) continue;
                usedDonors.Add(d.DonorId.ToString());

                AppointmentStatus st = AppointmentStatus.Pending;
                if (camp19.Status == CampaignStatus.Closed) {
                    int r = rnd.Next(100);
                    if (r < 70) st = AppointmentStatus.Completed; // 70% completed
                    else if (r < 80) st = AppointmentStatus.Confirmed; 
                    else if (r < 90) st = AppointmentStatus.Absent;
                    else st = AppointmentStatus.Cancelled;
                } else if (camp19.Status == CampaignStatus.Opening) {
                    int r = rnd.Next(100);
                    if (r < 50) st = AppointmentStatus.Pending;
                    else if (r < 90) st = AppointmentStatus.Confirmed;
                    else st = AppointmentStatus.Cancelled;
                } else { // Upcoming
                    int r = rnd.Next(100);
                    if (r < 60) st = AppointmentStatus.Pending;
                    else st = AppointmentStatus.Confirmed;
                }

                var appt = new Appointment
                {
                    DonorId = d.DonorId,
                    CampaignId = camp19.CampaignId,
                    AppointmentDate = camp19.StartDate.AddMinutes(rnd.Next(0, 240)),
                    TimeSlot = "07:30 - 11:00",
                    Status = st,
                    Note = st == AppointmentStatus.Cancelled ? "Bận công việc" : "",
                    CreatedAt = camp19.StartDate.AddDays(-rnd.Next(1, 15))
                };
                context.Appointments.Add(appt);
                await context.SaveChangesAsync(); // save to get id

                // HealthCheck and BloodDonation for Completed
                if (st == AppointmentStatus.Completed)
                {
                    var hc = new HealthCheck
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodPressure = rnd.Next(110, 130) + "/" + rnd.Next(70, 85),
                        Pulse = rnd.Next(65, 85),
                        Temperature = 36.5m + (decimal)(rnd.NextDouble() * 1.0),
                        Weight = d.Weight ?? 60m,
                        Hemoglobin = 13.5m + (decimal)(rnd.NextDouble() * 2.0),
                        HasDisease = false,
                        Eligible = true,
                        DoctorName = "Nguyễn Văn Thành",
                        CheckDate = appt.AppointmentDate
                    };
                    context.HealthChecks.Add(hc);

                    var bd = new BloodDonation.Domain.Entities.BloodDonation
                    {
                        AppointmentId = appt.AppointmentId,
                        BloodTypeId = d.BloodTypeId ?? dictBloodTypes["O+"],
                        VolumeML = rnd.Next(0,2) == 0 ? 250 : 350,
                        DonationDate = appt.AppointmentDate,
                        DonationStatus = DonationStatus.Success,
                        StaffName = "Nguyễn Văn Thành",
                        Remark = "Sức khỏe tốt"
                    };
                    context.BloodDonations.Add(bd);
                    var bi = new BloodDonation.Domain.Entities.BloodInventory
                    {
                        BloodTypeId = bd.BloodTypeId,
                        QuantityML = bd.VolumeML,
                        ExpiredDate = bd.DonationDate.AddDays(35),
                        StorageLocation = "Kho máu Trung tâm",
                        Status = InventoryStatus.Available
                    };
                    context.BloodInventories.Add(bi);
                    
                    d.TotalDonationTimes = d.TotalDonationTimes + 1;
                    context.Donors.Update(d);
                }
            }
    
            await context.SaveChangesAsync();
        }
        
        Console.WriteLine("[DATABASE SEEDER] Seeded everything successfully.");
    }
}
