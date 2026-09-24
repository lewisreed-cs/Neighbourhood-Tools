using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ToolLibraryApi.Data;
using ToolLibraryApi.DTOs;
using ToolLibraryApi.Models;

namespace ToolLibraryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToolsController : ControllerBase
{
    private readonly ToolLibraryContext _context;

    public ToolsController(ToolLibraryContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Tool>>> GetTools()
    {
        return await _context.Tools.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Tool>> GetToolById(int id)
    {
        var tool = await _context.Tools.FindAsync(id);
        if (tool == null) return NotFound("No tool with that ID.");
        return tool;
    }

    [HttpPost]
    public async Task<ActionResult<Tool>> CreateTool(CreateToolDto dto)
    {
        bool ownerExists = await _context.Residents
            .AnyAsync(r => r.Id == dto.OwnerId);

        if (!ownerExists) return BadRequest("Owner does not exist.");

        var tool = new Tool
        {
            Name = dto.Name,
            Description = dto.Description,
            Weight = dto.Weight,
            OwnerId = dto.OwnerId
        };

        _context.Tools.Add(tool);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetToolById),
            new { id = tool.Id },
            tool);
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<Tool>> UpdateTool(int id, UpdateToolDto dto)
    {
        var tool = await _context.Tools.FindAsync(id);
        if (tool == null) return NotFound("Tool does not exist.");

        if (dto.Name != null) tool.Name = dto.Name;
        if (dto.Description != null) tool.Description = dto.Description;
        if (dto.Weight.HasValue) tool.Weight = dto.Weight.Value;
        
        if (dto.OwnerId.HasValue)
        {
            bool ownerExists = await _context.Residents
                .AnyAsync(r => r.Id == dto.OwnerId);
            if (!ownerExists) return BadRequest("Owner does not exist.");

            tool.OwnerId = dto.OwnerId.Value;
        } 

        await _context.SaveChangesAsync();
        return Ok(tool);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTool(int id)
    {
        var tool = await _context.Tools.FindAsync(id);

        if (tool == null) return NotFound("Tool does not exist.");

        if (tool.Status == "On Loan")
        {
            return BadRequest("Cannot delete a tool that is currently on loan.");
        }

        _context.Tools.Remove(tool);

        await _context.SaveChangesAsync();

        return NoContent();
    }

}