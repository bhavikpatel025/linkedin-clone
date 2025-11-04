using System.ComponentModel.DataAnnotations;

namespace LinkedInApp.Models
{
    public class Skill
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public virtual ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
    }
}