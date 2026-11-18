using Huellitas.Api.Infrastructure;
using Huellitas.Api.Persistence;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddDbContext<HuellitasDbContext>((services, options) =>
{
    var configuration = services.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("Huellitas");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("Configura la conexión ConnectionStrings__Huellitas.");
    }

    options.UseNpgsql(connectionString, postgres => postgres.SetPostgresVersion(17, 0));
});
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseReadiness>("postgresql", tags: ["ready"], timeout: TimeSpan.FromSeconds(5));

var app = builder.Build();

app.UseExceptionHandler();
app.MapControllers();
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false,
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
});

app.Run();

public partial class Program;
