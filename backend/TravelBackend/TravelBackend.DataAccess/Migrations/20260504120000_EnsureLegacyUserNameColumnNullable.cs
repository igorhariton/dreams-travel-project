using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelBackend.DataAccess.Context;

#nullable disable

namespace TravelBackend.DataAccess.Migrations
{
    [DbContext(typeof(UserContext))]
    [Migration("20260504120000_EnsureLegacyUserNameColumnNullable")]
    public partial class EnsureLegacyUserNameColumnNullable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'Users'
                          AND column_name = 'Name'
                    ) THEN
                        UPDATE "Users"
                        SET "Name" = COALESCE(NULLIF("Name", ''), trim(concat_ws(' ', "FirstName", "LastName")), "UserName", "Email", '')
                        WHERE "Name" IS NULL OR "Name" = '';

                        ALTER TABLE "Users" ALTER COLUMN "Name" SET DEFAULT '';
                        ALTER TABLE "Users" ALTER COLUMN "Name" DROP NOT NULL;
                    END IF;
                END $$;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
