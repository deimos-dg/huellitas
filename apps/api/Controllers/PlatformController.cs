using Microsoft.AspNetCore.Mvc;

namespace Huellitas.Api.Controllers;

[ApiController]
[Route("api/v1/platform")]
public sealed class PlatformController : ControllerBase
{
    [HttpGet]
    public PlatformInformation Get() => new("Huellitas de Luz", "2.0", "Patitas Tech");
}

public sealed record PlatformInformation(string Name, string Version, string Team);
