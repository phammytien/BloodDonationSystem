using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using BloodDonation.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BloodDonation.Infrastructure.Services;

public class BackupService : IBackupService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly string _backupFolder;

    public BackupService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
        _backupFolder = Path.Combine(Directory.GetCurrentDirectory(), "Backups");
        if (!Directory.Exists(_backupFolder))
        {
            Directory.CreateDirectory(_backupFolder);
        }
    }

    public async Task<string> CreateBackupAsync(string backupType = "auto")
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var fileName = $"backup_{timestamp}_{backupType}.json";
        var filePath = Path.Combine(_backupFolder, fileName);

        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BloodDonationDbContext>();

        // Disable change tracking for faster query
        context.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;

        var data = new
        {
            Users = await context.Users.ToListAsync(),
            Donors = await context.Donors.ToListAsync(),
            BloodTypes = await context.BloodTypes.ToListAsync(),
            DonationCampaigns = await context.DonationCampaigns.ToListAsync(),
            Appointments = await context.Appointments.ToListAsync(),
            Notifications = await context.Notifications.ToListAsync()
        };

        var options = new JsonSerializerOptions 
        { 
            WriteIndented = true,
            ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
        };
        var jsonString = JsonSerializer.Serialize(data, options);

        await File.WriteAllTextAsync(filePath, jsonString);

        // Auto cleanup old backups
        await CleanUpOldBackupsAsync();

        return fileName;
    }

    public Task<List<BackupFileInfo>> GetAvailableBackupsAsync()
    {
        var directory = new DirectoryInfo(_backupFolder);
        var files = directory.GetFiles("*.json")
            .OrderByDescending(f => f.CreationTime)
            .Select(f => new BackupFileInfo
            {
                FileName = f.Name,
                FileSize = f.Length,
                CreatedAt = f.CreationTime
            })
            .ToList();

        return Task.FromResult(files);
    }

    public async Task<byte[]?> GetBackupFileAsync(string fileName)
    {
        var filePath = Path.Combine(_backupFolder, fileName);
        if (!File.Exists(filePath)) return null;

        return await File.ReadAllBytesAsync(filePath);
    }

    public Task CleanUpOldBackupsAsync(int keepLatest = 20)
    {
        var directory = new DirectoryInfo(_backupFolder);
        var files = directory.GetFiles("*.json")
            .OrderByDescending(f => f.CreationTime)
            .ToList();

        if (files.Count > keepLatest)
        {
            var filesToDelete = files.Skip(keepLatest);
            foreach (var file in filesToDelete)
            {
                try
                {
                    file.Delete();
                }
                catch
                {
                    // Ignore locked files
                }
            }
        }

        return Task.CompletedTask;
    }
}
