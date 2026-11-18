using Huellitas.Api.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Huellitas.Api.Infrastructure;

public sealed class DatabaseReadiness(HuellitasDbContext database) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var pendingMigrations = await database.Database.GetPendingMigrationsAsync(cancellationToken);

        return pendingMigrations.Any()
            ? HealthCheckResult.Unhealthy("Hay migraciones pendientes.")
            : HealthCheckResult.Healthy();
    }
}
