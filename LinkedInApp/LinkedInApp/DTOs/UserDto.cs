namespace LinkedInApp.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string? ProfilePicture { get; set; }
        public DateTime CreatedDate { get; set; }
        public List<SkillDto> Skills { get; set; } = new List<SkillDto>();
    }
}