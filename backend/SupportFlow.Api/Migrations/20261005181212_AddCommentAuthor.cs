using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SupportFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentAuthor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "Comments",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Comments_CreatedByUserId",
                table: "Comments",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_AspNetUsers_CreatedByUserId",
                table: "Comments",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_AspNetUsers_CreatedByUserId",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_CreatedByUserId",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Comments");
        }
    }
}
