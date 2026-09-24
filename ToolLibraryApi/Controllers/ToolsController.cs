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

}