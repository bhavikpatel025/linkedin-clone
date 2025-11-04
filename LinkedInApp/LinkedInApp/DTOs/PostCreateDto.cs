using System.ComponentModel.DataAnnotations;

namespace LinkedInApp.DTOs
{
    public class PostCreateDto
    {
        [Required(ErrorMessage = "Description is required")]
        public string Description { get; set; } = string.Empty;

        public IFormFile? Photo { get; set; }
        public int UserId { get; set; }
    }
}