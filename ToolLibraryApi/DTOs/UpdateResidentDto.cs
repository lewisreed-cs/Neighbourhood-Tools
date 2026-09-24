using System.ComponentModel.DataAnnotations;

namespace ToolLibraryApi.DTOs;

public class UpdateResidentDto
{
    [MaxLength(100)]
    public string? Name { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? PhoneNumber { get; set; }
}