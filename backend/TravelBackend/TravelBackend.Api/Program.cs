using Microsoft.EntityFrameworkCore;
using TravelBackend.DataAccess.Context;
using TravelBackend.Domain.Entities.User;

var builder = WebApplication.CreateBuilder(args);

//connection strinf setup
TravelBackend.DataAccess.DbSession.ConnectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<TravelContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<UserContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

SeedDevelopmentData(app);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("FrontendDev");

app.UseAuthorization();
app.MapControllers();

app.Run();

static void SeedDevelopmentData(WebApplication app)
{
    if (!app.Environment.IsDevelopment()) return;

    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DevelopmentData");

    try
    {
        var travelDb = scope.ServiceProvider.GetRequiredService<TravelContext>();
        var userDb = scope.ServiceProvider.GetRequiredService<UserContext>();

        travelDb.Database.Migrate();
        userDb.Database.Migrate();

        NormalizeTravelSeedData(travelDb);

        UpsertDefaultUser(
            userDb,
            username: "admin",
            email: "admin@traveldreams.local",
            password: "Admin2026!",
            firstName: "TravelDreams",
            lastName: "Admin",
            phone: "+373000001",
            role: UserRole.Admin);

        UpsertDefaultUser(
            userDb,
            username: "host",
            email: "host@traveldreams.local",
            password: "Host2026!",
            firstName: "TravelDreams",
            lastName: "Host",
            phone: "+373000002",
            role: UserRole.Host);

        userDb.SaveChanges();
        travelDb.SaveChanges();
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not migrate and seed development data. Check PostgreSQL before signing in.");
    }
}

static void NormalizeTravelSeedData(TravelContext db)
{
    foreach (var rental in db.Rentals.Where(x => !x.IsDeleted).ToList())
    {
        var defaults = rental.Name.Trim().ToLowerInvariant() switch
        {
            "white cliff villa" => new { Type = "Villa", Price = 420m },
            "mountain chalet" => new { Type = "Chalet", Price = 310m },
            "tokyo skyline apartment" => new { Type = "Apartment", Price = 230m },
            _ => new { Type = "Rental", Price = 180m }
        };

        if (string.IsNullOrWhiteSpace(rental.RentalType))
        {
            rental.RentalType = defaults.Type;
        }

        if (rental.PricePerDay <= 0)
        {
            rental.PricePerDay = defaults.Price;
        }
    }
}

static void UpsertDefaultUser(
    UserContext db,
    string username,
    string email,
    string password,
    string firstName,
    string lastName,
    string phone,
    UserRole role)
{
    var user = db.Users.FirstOrDefault(x => x.UserName == username || x.Email == email);

    if (user == null)
    {
        db.Users.Add(new UserData
        {
            UserName = username,
            Email = email,
            Password = password,
            FirstName = firstName,
            LastName = lastName,
            Phone = phone,
            Role = role,
            RegisteredOn = DateTime.UtcNow
        });
        return;
    }

    user.UserName = username;
    user.Email = email;
    user.Password = password;
    user.FirstName = firstName;
    user.LastName = lastName;
    user.Phone = phone;
    user.Role = role;
}
