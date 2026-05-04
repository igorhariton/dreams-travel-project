using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelBackend.DataAccess.Context;

#nullable disable

namespace TravelBackend.DataAccess.Migrations
{
    [DbContext(typeof(UserContext))]
    [Migration("20260504121000_AllowLegacyUserColumnsNullable")]
    public partial class AllowLegacyUserColumnsNullable : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                DECLARE
                    legacy_column record;
                BEGIN
                    FOR legacy_column IN
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'Users'
                          AND is_nullable = 'NO'
                          AND column_name NOT IN (
                              'Id',
                              'FirstName',
                              'LastName',
                              'UserName',
                              'Email',
                              'Password',
                              'Phone',
                              'Role',
                              'RegisteredOn'
                          )
                    LOOP
                        EXECUTE format('ALTER TABLE "Users" ALTER COLUMN %I DROP NOT NULL', legacy_column.column_name);
                    END LOOP;
                END $$;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
