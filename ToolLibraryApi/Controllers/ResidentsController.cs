using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToolLibraryApi.Data;
using ToolLibraryApi.DTOs;
using ToolLibraryApi.Models;

namespace ToolLibraryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResidentsController : ControllerBase
{
    private readonly ToolLibraryContext _context;

    public ResidentsController(ToolLibraryContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Resident>>> GetResidents()
    {
        return await _context.Residents.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Resident>> GetResidentById(int id)
    {
        var resident = await _context.Residents.FindAsync(id);
        if (resident == null) return NotFound("No resident with that ID.");
        return resident;
    }

    [HttpPost]
    public async Task<ActionResult<Resident>> CreateResident(CreateResidentDto dto)
    {
        var resident = new Resident
        {
            Name = dto.Name,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber
        };

        _context.Residents.Add(resident);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetResidentById),
            new { id = resident.Id },
            resident);
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<Resident>> UpdateResident(int id, UpdateResidentDto dto)
    {
        var resident = await _context.Residents.FindAsync(id);
        if (resident == null) return NotFound("Resident does not exist.");

        if (dto.Name != null) resident.Name = dto.Name;
        if (dto.Email != null) resident.Email = dto.Email;
        if (dto.PhoneNumber != null) resident.PhoneNumber = dto.PhoneNumber;

        await _context.SaveChangesAsync();
        return Ok(resident);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteResident(int id)
    {
        var resident = await _context.Residents.FindAsync(id);

        if (resident == null) return NotFound("Resident does not exist.");

        bool ownsTools = await _context.Tools
            .AnyAsync(t => t.OwnerId == id);

        if (ownsTools)
        {
            return BadRequest("Cannot delete a resident who owns tools.");
        }

        _context.Residents.Remove(resident);

        await _context.SaveChangesAsync();

        return NoContent();
    }

}