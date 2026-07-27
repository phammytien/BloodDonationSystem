using System.Threading.Tasks;
using System.Collections.Generic;

namespace BloodDonation.Infrastructure.Services;

public class BackupFileInfo
{
    public string FileName { get; set; } = null!;
    public long FileSize { get; set; }
    public System.DateTime CreatedAt { get; set; }
}

public interface IBackupService
{
    Task<string> CreateBackupAsync(string backupType = "auto");
    Task<List<BackupFileInfo>> GetAvailableBackupsAsync();
    Task<byte[]?> GetBackupFileAsync(string fileName);
    Task CleanUpOldBackupsAsync(int keepLatest = 5);
}
