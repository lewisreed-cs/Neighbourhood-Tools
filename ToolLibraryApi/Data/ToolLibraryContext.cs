using Microsoft.EntityFrameworkCore;
using ToolLibraryApi.Models;

namespace ToolLibraryApi.Data;

public class ToolLibraryContext : DbContext
{
    public ToolLibraryContext(DbContextOptions<ToolLibraryContext> options) : base(options) {}
    
    public DbSet<Resident> Residents { get; set; }
    public DbSet<Tool> Tools { get; set; }
    public DbSet<Loan> Loans { get; set; }
}