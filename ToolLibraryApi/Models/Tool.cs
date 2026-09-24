namespace ToolLibraryApi.Models;

public class Tool
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Weight { get; set; }
    public string Status { get; set; } = "Available";
    public int OwnerId { get; set; }
    public Resident? Owner { get; set; }
}