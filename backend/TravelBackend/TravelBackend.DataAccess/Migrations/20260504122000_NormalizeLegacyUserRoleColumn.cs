using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelBackend.DataAccess.Context;

#nullable disable

namespace TravelBackend.DataAccess.Migrations
{
    [DbContext(typeof(UserContext))]
    [Migration("20260504122000_NormalizeLegacyUserRoleColumn")]
    public partial class NormalizeLegacyUserRoleColumn : Migration
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
                          AND column_name = 'Role'
                          AND data_type <> 'integer'
                    ) THEN
                        ALTER TABLE "Users"
                        ALTER COLUMN "Role" TYPE integer
                        USING CASE lower(trim("Role"::text))
                            WHEN 'admin' THEN 30
                            WHEN 'host' THEN 20
                            WHEN 'user' THEN 1
                            WHEN '' THEN 1
                            ELSE COALESCE(NULLIF(regexp_replace("Role"::text, '[^0-9-]', '', 'g'), '')::integer, 1)
                        END;
                    END IF;

                    ALTER TABLE "Users" ALTER COLUMN "Role" SET DEFAULT 1;
                    ALTER TABLE "Users" ALTER COLUMN "Role" SET NOT NULL;
                END $$;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
