namespace ToolLibraryApi.Models;

public class Resident
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public ICollection<Tool> Tools { get; set; } = [];
}