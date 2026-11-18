using Microsoft.AspNetCore.Identity;

namespace Huellitas.Api.Persistence;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public required string DisplayName { get; set; }
    public DateTimeOffset CreatedAt { get; private set; }
}
