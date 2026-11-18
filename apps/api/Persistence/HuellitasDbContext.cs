using Huellitas.Api.Domain.Accounts;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Huellitas.Api.Persistence;

public sealed class HuellitasDbContext(DbContextOptions<HuellitasDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(user =>
        {
            user.ToTable("Users");
            user.Property(account => account.DisplayName).HasMaxLength(100).IsRequired();
            user.Property(account => account.Email).IsRequired();
            user.Property(account => account.NormalizedEmail).IsRequired();
            user.Property(account => account.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            user.HasIndex(account => account.NormalizedEmail).IsUnique();
        });

        builder.Entity<IdentityRole<Guid>>(role =>
        {
            role.ToTable("Roles");
            role.HasData(
                InitialRole("74a6d01f-7eb2-4eba-8f58-1d7595709eb6", PlatformRoles.User),
                InitialRole("4787ffa2-973a-41ad-bee6-04084325b1ba", PlatformRoles.Administrator),
                InitialRole("ecc4d28c-7e29-4dd8-a924-e7a02da5dc27", PlatformRoles.Shelter));
        });

        builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");
    }

    private static IdentityRole<Guid> InitialRole(string id, string name) => new()
    {
        Id = Guid.Parse(id),
        Name = name,
        NormalizedName = name.ToUpperInvariant(),
        ConcurrencyStamp = id,
    };
}
