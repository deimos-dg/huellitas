using System.Net;
using Huellitas.Api.Domain.Accounts;
using Huellitas.Api.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Huellitas.Api.Tests;

public sealed class PostgresTests
{
    [PostgresFact]
    public async Task InitialMigrationSeedsRolesAndEnforcesUniqueEmail()
    {
        var server = new NpgsqlConnectionStringBuilder(
            Environment.GetEnvironmentVariable(PostgresFactAttribute.ConnectionVariable)!)
        {
            Pooling = false,
        };
        var databaseName = $"huellitas_test_{Guid.NewGuid():N}";

        await using var connection = new NpgsqlConnection(server.ConnectionString);
        await connection.OpenAsync();
        await using var createDatabase = new NpgsqlCommand($"CREATE DATABASE {databaseName}", connection);
        await createDatabase.ExecuteNonQueryAsync();

        try
        {
            server.Database = databaseName;
            using var factory = new ApiFactory(server.ConnectionString);
            using var client = factory.CreateClient();

            using var beforeMigration = await client.GetAsync("/health/ready");
            Assert.Equal(HttpStatusCode.ServiceUnavailable, beforeMigration.StatusCode);

            await using (var scope = factory.Services.CreateAsyncScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<HuellitasDbContext>();
                await db.Database.MigrateAsync();

                var roles = await db.Roles.Select(role => role.Name).ToListAsync();
                Assert.Equal(3, roles.Count);
                Assert.Contains(PlatformRoles.User, roles);
                Assert.Contains(PlatformRoles.Administrator, roles);
                Assert.Contains(PlatformRoles.Shelter, roles);

                db.Users.Add(CreateUser("Primera cuenta"));
                await db.SaveChangesAsync();
            }

            using var afterMigration = await client.GetAsync("/health/ready");
            Assert.Equal(HttpStatusCode.OK, afterMigration.StatusCode);

            await using (var scope = factory.Services.CreateAsyncScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<HuellitasDbContext>();
                var stored = await db.Users.AsNoTracking().SingleAsync();
                Assert.Equal("Primera cuenta", stored.DisplayName);
                Assert.NotEqual(Guid.Empty, stored.Id);
                Assert.NotEqual(default, stored.CreatedAt);

                db.Users.Add(CreateUser("Cuenta duplicada"));
                var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
                var postgresError = Assert.IsType<PostgresException>(error.InnerException);
                Assert.Equal(PostgresErrorCodes.UniqueViolation, postgresError.SqlState);
                Assert.Equal("EmailIndex", postgresError.ConstraintName);
            }
        }
        finally
        {
            await using var dropDatabase = new NpgsqlCommand($"DROP DATABASE {databaseName}", connection);
            await dropDatabase.ExecuteNonQueryAsync();
        }
    }

    private static ApplicationUser CreateUser(string displayName) => new()
    {
        DisplayName = displayName,
        Email = "cuenta@example.invalid",
        NormalizedEmail = "CUENTA@EXAMPLE.INVALID",
    };
}

internal sealed class PostgresFactAttribute : FactAttribute
{
    public const string ConnectionVariable = "HUELLITAS_TEST_POSTGRES";

    public PostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(ConnectionVariable)))
        {
            Skip = $"Configura {ConnectionVariable} para ejecutar la integración con PostgreSQL.";
        }
    }
}
