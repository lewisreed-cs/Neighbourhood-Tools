namespace ToolLibraryApi.DTOs;

public class CreateToolDto
{
    public string Name { get; set; } = "";

    public string Description { get; set; } = "";

    public decimal Weight { get; set; }

    public int OwnerId { get; set; }
}