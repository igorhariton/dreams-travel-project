using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelBackend.DataAccess.Context;

#nullable disable

namespace TravelBackend.DataAccess.Migrations.Travel
{
    [DbContext(typeof(TravelContext))]
    [Migration("20260425122510_EnsureTravelPostgresColumns")]
    public partial class EnsureTravelPostgresColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "UserId" integer NOT NULL DEFAULT 0;
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "ListingType" character varying(30) NOT NULL DEFAULT '';
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "ListingId" integer NOT NULL DEFAULT 0;
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "CheckIn" timestamp with time zone NOT NULL DEFAULT now();
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "CheckOut" timestamp with time zone NOT NULL DEFAULT now();
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "Guests" integer NOT NULL DEFAULT 0;
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "TotalPrice" numeric(18,2) NOT NULL DEFAULT 0;
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "Status" integer NOT NULL DEFAULT 1;
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false;
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT now();
                ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone;

                ALTER TABLE "Destinations" ADD COLUMN IF NOT EXISTS "Name" character varying(80) NOT NULL DEFAULT '';
                ALTER TABLE "Destinations" ADD COLUMN IF NOT EXISTS "Country" character varying(80) NOT NULL DEFAULT '';
                ALTER TABLE "Destinations" ADD COLUMN IF NOT EXISTS "Description" character varying(500) NOT NULL DEFAULT '';
                ALTER TABLE "Destinations" ADD COLUMN IF NOT EXISTS "ImageUrl" character varying(300) NOT NULL DEFAULT '';
                ALTER TABLE "Destinations" ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false;
                ALTER TABLE "Destinations" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT now();
                ALTER TABLE "Destinations" ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone;

                ALTER TABLE "Favorites" ADD COLUMN IF NOT EXISTS "UserId" integer NOT NULL DEFAULT 0;
                ALTER TABLE "Favorites" ADD COLUMN IF NOT EXISTS "ListingType" character varying(30) NOT NULL DEFAULT '';
                ALTER TABLE "Favorites" ADD COLUMN IF NOT EXISTS "ListingId" integer NOT NULL DEFAULT 0;
                ALTER TABLE "Favorites" ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false;
                ALTER TABLE "Favorites" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT now();

                ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS "Name" character varying(100) NOT NULL DEFAULT '';
                ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS "Description" character varying(500) NOT NULL DEFAULT '';
                ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS "DestinationId" integer NOT NULL DEFAULT 0;
                ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS "PricePerNight" numeric(18,2) NOT NULL DEFAULT 0;
                ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS "Rating" double precision NOT NULL DEFAULT 0;
                ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS "ImageUrl" character varying(300) NOT NULL DEFAULT '';
                ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false;
                ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT now();
                ALTER TABLE "Hotels" ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone;

                ALTER TABLE "PlannerTrips" ADD COLUMN IF NOT EXISTS "UserId" integer NOT NULL DEFAULT 0;
                ALTER TABLE "PlannerTrips" ADD COLUMN IF NOT EXISTS "DestinationId" integer NOT NULL DEFAULT 0;
                ALTER TABLE "PlannerTrips" ADD COLUMN IF NOT EXISTS "Title" character varying(100) NOT NULL DEFAULT '';
                ALTER TABLE "PlannerTrips" ADD COLUMN IF NOT EXISTS "StartDate" timestamp with time zone NOT NULL DEFAULT now();
                ALTER TABLE "PlannerTrips" ADD COLUMN IF NOT EXISTS "EndDate" timestamp with time zone NOT NULL DEFAULT now();
                ALTER TABLE "PlannerTrips" ADD COLUMN IF NOT EXISTS "Notes" character varying(1000) NOT NULL DEFAULT '';
                ALTER TABLE "PlannerTrips" ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false;
                ALTER TABLE "PlannerTrips" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT now();
                ALTER TABLE "PlannerTrips" ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone;

                ALTER TABLE "Rentals" ADD COLUMN IF NOT EXISTS "Name" character varying(100) NOT NULL DEFAULT '';
                ALTER TABLE "Rentals" ADD COLUMN IF NOT EXISTS "RentalType" character varying(60) NOT NULL DEFAULT '';
                ALTER TABLE "Rentals" ADD COLUMN IF NOT EXISTS "Description" character varying(500) NOT NULL DEFAULT '';
                ALTER TABLE "Rentals" ADD COLUMN IF NOT EXISTS "DestinationId" integer NOT NULL DEFAULT 0;
                ALTER TABLE "Rentals" ADD COLUMN IF NOT EXISTS "PricePerDay" numeric(18,2) NOT NULL DEFAULT 0;
                ALTER TABLE "Rentals" ADD COLUMN IF NOT EXISTS "ImageUrl" character varying(300) NOT NULL DEFAULT '';
                ALTER TABLE "Rentals" ADD COLUMN IF NOT EXISTS "IsDeleted" boolean NOT NULL DEFAULT false;
                ALTER TABLE "Rentals" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT now();
                ALTER TABLE "Rentals" ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
