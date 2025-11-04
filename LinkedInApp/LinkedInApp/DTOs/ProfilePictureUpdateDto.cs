using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace LinkedInApp.DTOs
{
    //  DTO for uploading profile picture only
    public class ProfilePictureUpdateDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public IFormFile ProfilePicture { get; set; } = null!;
    }

    //  DTO for updating user profile (with optional profile picture)
    public class UserUpdateDto
    {
        [Required]
        public int Id { get; set; }

        [StringLength(100)]
        public string? Name { get; set; }

        [StringLength(10)]
        public string? Gender { get; set; }

        [Phone]
        public string? PhoneNumber { get; set; }

        public string? Location { get; set; }

        [StringLength(500)]
        public string? Bio { get; set; }

        public IFormFile? ProfilePicture { get; set; }
    }
}