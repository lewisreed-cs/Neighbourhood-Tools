using System.ComponentModel.DataAnnotations;

namespace ToolLibraryApi.DTOs;

public class CreateResidentDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = "";

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    [Phone]
    public string PhoneNumber { get; set; } = "";
}