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
        var loan = new Loan
        {
            ToolId = dto.ToolId,
            BorrowerId = dto.BorrowerId
        };

        _context.Loans.Add(loan);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetLoanById),
            new { id = loan.Id },
            loan);
    }

    
}