using System.ComponentModel.DataAnnotations;

namespace LinkedInApp.DTOs
{
    public class PostUpdateDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Description is required")]
        public string Description { get; set; } = string.Empty;

        public IFormFile? Photo { get; set; }
        public string? ExistingPhotoPath { get; set; }
    }
}