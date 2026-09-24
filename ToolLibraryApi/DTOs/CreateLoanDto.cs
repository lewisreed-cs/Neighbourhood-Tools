using System.ComponentModel.DataAnnotations;

namespace ToolLibraryApi.DTOs;

public class CreateLoanDto
{
    [Range(1, int.MaxValue)]
    public int ToolId { get; set; }

    [Range(1, int.MaxValue)]
    public int BorrowerId { get; set; }
}