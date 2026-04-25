using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelBackend.DataAccess.Context;

#nullable disable

namespace TravelBackend.DataAccess.Migrations
{
    [DbContext(typeof(UserContext))]
    [Migration("20260425122500_EnsureUserPostgresColumns")]
    public partial class EnsureUserPostgresColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "FirstName" character varying(30) NOT NULL DEFAULT '';
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "LastName" character varying(30) NOT NULL DEFAULT '';
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "UserName" character varying(30) NOT NULL DEFAULT '';
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Email" character varying(60) NOT NULL DEFAULT '';
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Password" character varying(48) NOT NULL DEFAULT '';
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Phone" character varying(12) NOT NULL DEFAULT '';
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Role" integer NOT NULL DEFAULT 1;
                ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "RegisteredOn" timestamp with time zone NOT NULL DEFAULT now();
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
