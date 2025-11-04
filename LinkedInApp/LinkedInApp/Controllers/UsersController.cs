using LinkedInApp.DTOs;
using LinkedInApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LinkedInApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<UserDto>>> Register([FromBody] UserRegistrationDto registrationDto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            var result = await _userService.RegisterAsync(registrationDto);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<UserDto>>> Login([FromBody] UserLoginDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            var result = await _userService.LoginAsync(loginDto);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpGet("roles")]
        public async Task<ActionResult<ApiResponse<List<RoleDto>>>> GetRoles()
        {
            var result = await _userService.GetRolesAsync();
            return Ok(result);
        }

        [HttpGet("skills")]
        public async Task<ActionResult<ApiResponse<List<SkillDto>>>> GetSkills()
        {
            var result = await _userService.GetSkillsAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetUser(int id)
        {
            var result = await _userService.GetUserByIdAsync(id);

            if (result.Success)
                return Ok(result);

            return NotFound(result);
        }

        [HttpPost("upload-profile-picture")]
        public async Task<IActionResult> UploadProfilePicture([FromForm] ProfilePictureUpdateDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            // Validate file
            if (dto.ProfilePicture == null || dto.ProfilePicture.Length == 0)
            {
                return BadRequest(new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Please select a file",
                    Errors = new List<string> { "No file selected" }
                });
            }

            // Validate file size (max 5MB)
            if (dto.ProfilePicture.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "File size too large",
                    Errors = new List<string> { "File size must be less than 5MB" }
                });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var fileExtension = Path.GetExtension(dto.ProfilePicture.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "Invalid file type",
                    Errors = new List<string> { "Only JPG, JPEG, PNG, and GIF files are allowed" }
                });
            }

            var result = await _userService.UpdateProfilePictureAsync(dto);
            return Ok(result);
        }

        // Update User Profile
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromForm] UserUpdateDto dto)
        {
            if (id != dto.Id)
            {
                return BadRequest(new ApiResponse<UserDto>
                {
                    Success = false,
                    Message = "ID mismatch",
                    Errors = new List<string> { "Route ID does not match request body ID" }
                });
            }

            // Validate file if provided
            if (dto.ProfilePicture != null && dto.ProfilePicture.Length > 0)
            {
                // Validate file size (max 5MB)
                if (dto.ProfilePicture.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "File size too large",
                        Errors = new List<string> { "File size must be less than 5MB" }
                    });
                }

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var fileExtension = Path.GetExtension(dto.ProfilePicture.FileName).ToLower();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new ApiResponse<UserDto>
                    {
                        Success = false,
                        Message = "Invalid file type",
                        Errors = new List<string> { "Only JPG, JPEG, PNG, and GIF files are allowed" }
                    });
                }
            }

            var result = await _userService.UpdateUserAsync(dto);
            return Ok(result);
        }

        // Delete Profile Picture
        [HttpDelete("{id}/profile-picture")]
        public async Task<IActionResult> DeleteProfilePicture(int id)
        {
            var result = await _userService.DeleteProfilePictureAsync(id);
            return Ok(result);
        }
    }
}