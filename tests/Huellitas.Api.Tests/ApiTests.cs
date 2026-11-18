using System.Net;
using System.Net.Http.Json;
using Huellitas.Api.Controllers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Huellitas.Api.Tests;

public sealed class ApiTests
{
    private const string UnavailableDatabase = "Host=127.0.0.1;Port=1;Database=huellitas;Username=huellitas;Timeout=1";

    [Fact]
    public async Task PlatformEndpointReturnsVersionAndTeam()
    {
        using var factory = new ApiFactory(UnavailableDatabase);
        using var client = factory.CreateClient();

        var result = await client.GetFromJsonAsync<PlatformInformation>("/api/v1/platform");

        Assert.Equal(new PlatformInformation("Huellitas de Luz", "2.0", "Patitas Tech"), result);
    }

    [Fact]
    public async Task ProcessStaysLiveWhenDatabaseIsUnavailable()
    {
        using var factory = new ApiFactory(UnavailableDatabase);
        using var client = factory.CreateClient();

        using var live = await client.GetAsync("/health/live");
        using var ready = await client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, live.StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, ready.StatusCode);
        Assert.Equal("Unhealthy", await ready.Content.ReadAsStringAsync());
    }
}

internal sealed class ApiFactory(string connectionString) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Huellitas"] = connectionString,
            });
        });
    }
}
