using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ToolLibraryApi.Migrations
{
    /// <inheritdoc />
    public partial class AddNavigationProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Tools_OwnerId",
                table: "Tools",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Loans_BorrowerId",
                table: "Loans",
                column: "BorrowerId");

            migrationBuilder.CreateIndex(
                name: "IX_Loans_ToolId",
                table: "Loans",
                column: "ToolId");

            migrationBuilder.AddForeignKey(
                name: "FK_Loans_Residents_BorrowerId",
                table: "Loans",
                column: "BorrowerId",
                principalTable: "Residents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Loans_Tools_ToolId",
                table: "Loans",
                column: "ToolId",
                principalTable: "Tools",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tools_Residents_OwnerId",
                table: "Tools",
                column: "OwnerId",
                principalTable: "Residents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Loans_Residents_BorrowerId",
                table: "Loans");

            migrationBuilder.DropForeignKey(
                name: "FK_Loans_Tools_ToolId",
                table: "Loans");

            migrationBuilder.DropForeignKey(
                name: "FK_Tools_Residents_OwnerId",
                table: "Tools");

            migrationBuilder.DropIndex(
                name: "IX_Tools_OwnerId",
                table: "Tools");

            migrationBuilder.DropIndex(
                name: "IX_Loans_BorrowerId",
                table: "Loans");

            migrationBuilder.DropIndex(
                name: "IX_Loans_ToolId",
                table: "Loans");
        }
    }
}
