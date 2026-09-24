namespace ToolLibraryApi.Models;

public class Loan
{
    public int Id { get; set; }
    public int ToolId { get; set; }
    public int BorrowerId { get; set; }
    public DateTime LoanDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public Tool? Tool { get; set; }
    public Resident? Borrower { get; set; }
}