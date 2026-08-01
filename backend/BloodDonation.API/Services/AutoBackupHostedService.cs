using System;
using System.Threading;
using System.Threading.Tasks;
using BloodDonation.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BloodDonation.API.Services;

public class AutoBackupHostedService : IHostedService, IDisposable
{
    private readonly ILogger<AutoBackupHostedService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private Timer? _timer;

    public AutoBackupHostedService(ILogger<AutoBackupHostedService> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Auto Backup Service is starting.");

        // Run every 10 minutes
        _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromMinutes(10));

        return Task.CompletedTask;
    }

    private void DoWork(object? state)
    {
        _logger.LogInformation("Auto Backup executing...");
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var backupService = scope.ServiceProvider.GetRequiredService<IBackupService>();
            
            // Execute backup asynchronously but do not wait for it here
            _ = backupService.CreateBackupAsync("auto");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred executing Auto Backup.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Auto Backup Service is stopping.");
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _timer?.Dispose();
    }
}
