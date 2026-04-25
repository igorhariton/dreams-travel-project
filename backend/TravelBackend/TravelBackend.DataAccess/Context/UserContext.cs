using Microsoft.EntityFrameworkCore;
using TravelBackend.Domain.Entities.User;

namespace TravelBackend.DataAccess.Context
{
    public class UserContext : DbContext
    {
        public UserContext()
        {
        }

        public UserContext(DbContextOptions<UserContext> options) : base(options)
        {
        }

        public DbSet<UserData> Users { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (optionsBuilder.IsConfigured) return;

            var connectionString = DbSession.ConnectionString ??
                "Host=localhost;Port=5432;Database=TravelBackendDb;Username=postgres;Password=parola";

            optionsBuilder.UseNpgsql(connectionString);
        }
    }
}
