using Microsoft.EntityFrameworkCore;
using TravelBackend.Domain.Entities.Booking;
using TravelBackend.Domain.Entities.Destination;
using TravelBackend.Domain.Entities.Favorite;
using TravelBackend.Domain.Entities.Hotel;
using TravelBackend.Domain.Entities.PlannerTrip;
using TravelBackend.Domain.Entities.Rental;

namespace TravelBackend.DataAccess.Context
{
    public class TravelContext : DbContext
    {
        public TravelContext()
        {
        }

        public TravelContext(DbContextOptions<TravelContext> options) : base(options)
        {
        }

        public DbSet<DestinationData> Destinations { get; set; }
        public DbSet<HotelData> Hotels { get; set; }
        public DbSet<RentalData> Rentals { get; set; }
        public DbSet<BookingData> Bookings { get; set; }
        public DbSet<FavoriteData> Favorites { get; set; }
        public DbSet<PlannerTripData> PlannerTrips { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (optionsBuilder.IsConfigured) return;

            var connectionString = DbSession.ConnectionString ??
                "Host=localhost;Port=5432;Database=TravelBackendDb;Username=postgres;Password=parola";

            optionsBuilder.UseNpgsql(connectionString);
        }
    }
}
