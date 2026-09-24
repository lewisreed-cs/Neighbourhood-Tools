using System.Reflection.Metadata.Ecma335;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToolLibraryApi.Data;
using ToolLibraryApi.DTOs;
using ToolLibraryApi.Models;

namespace ToolLibraryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LoansController : ControllerBase
{
    private readonly ToolLibraryContext _context;

    public LoansController(ToolLibraryContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Loan>>> GetLoans()
    {
        return await _context.Loans.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Loan>> GetLoanById(int id)
    {
        var loan = await _context.Loans.FindAsync(id);
        if (loan == null) return NotFound("No loan with that ID.");
        return loan;
    }

    [HttpPost]
    public async Task<ActionResult<Loan>> CreateLoan(CreateLoanDto dto)
    {
        bool borrowerExists = await _context.Residents
            .AnyAsync(r => r.Id == dto.BorrowerId);

        if (!borrowerExists) return BadRequest("Borrower does not exist.");

        var tool = await _context.Tools.FindAsync(dto.ToolId);
        if (tool == null) return BadRequest("Tool does not exist.");

        if (tool.Status == "On Loan") return BadRequest("Tool is already on loan.");
        tool.Status = "On Loan";

        var loan = new Loan
        {
            ToolId = dto.ToolId,
            BorrowerId = dto.BorrowerId,
            LoanDate = DateTime.UtcNow
        };

        _context.Loans.Add(loan);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetLoanById),
            new { id = loan.Id },
            loan);
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<Loan>> UpdateLoan(int id, UpdateLoanDto dto)
    {
        var loan = await _context.Loans.FindAsync(id);
        if (loan == null) return NotFound("Loan does not exist.");

        if (!dto.ReturnDate.HasValue) return BadRequest("Return date is required.");

        if (loan.ReturnDate != null) return BadRequest("Loan has already been returned.");

        if (dto.ReturnDate.Value <= loan.LoanDate) return BadRequest("Return date occurs before the loan date.");

        var tool = await _context.Tools.FindAsync(loan.ToolId);
        tool!.Status = "Available";

        loan.ReturnDate = dto.ReturnDate.Value;

        await _context.SaveChangesAsync();
        return Ok(loan);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLoan(int id)
    {
        var loan = await _context.Loans.FindAsync(id);

        if (loan == null) return NotFound("Loan does not exist.");

        if (loan.ReturnDate == null)
        {
            return BadRequest("Cannot delete an active loan.");
        }

        _context.Loans.Remove(loan);

        await _context.SaveChangesAsync();

        return NoContent();
    }
    
}