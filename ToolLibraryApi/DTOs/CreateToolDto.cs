using System.ComponentModel.DataAnnotations;

namespace ToolLibraryApi.DTOs;

public class CreateToolDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = "";

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = "";

    [Range(0.1, 1000)]
    public decimal Weight { get; set; }

    [Range(1, int.MaxValue)]
    public int OwnerId { get; set; }
}