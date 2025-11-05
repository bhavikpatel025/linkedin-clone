using LinkedInApp.DTOs;
using LinkedInApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LinkedInApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;

        public PostsController(IPostService postService)
        {
            _postService = postService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<PostDto>>>> GetAllPosts([FromQuery] int currentUserId = 0)
        {
            var result = await _postService.GetAllPostsAsync(currentUserId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<PostDto>>> GetPost(int id, [FromQuery] int currentUserId = 0)
        {
            var result = await _postService.GetPostByIdAsync(id, currentUserId);

            if (result.Success)
                return Ok(result);

            return NotFound(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<ApiResponse<List<PostDto>>>> GetUserPosts(int userId, [FromQuery] int currentUserId = 0)
        {
            var result = await _postService.GetUserPostsAsync(userId, currentUserId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<PostDto>>> CreatePost([FromForm] PostCreateDto postCreateDto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ApiResponse<PostDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            var result = await _postService.CreatePostAsync(postCreateDto);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<PostDto>>> UpdatePost(int id, [FromForm] PostUpdateDto postUpdateDto)
        {
            if (id != postUpdateDto.Id)
            {
                return BadRequest(new ApiResponse<PostDto>
                {
                    Success = false,
                    Message = "ID mismatch",
                    Errors = new List<string> { "Route ID does not match request body ID" }
                });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ApiResponse<PostDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            var result = await _postService.UpdatePostAsync(postUpdateDto);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpPost("save")]
        public async Task<IActionResult> SavePost([FromBody] SavePostRequestDto saveRequest)
        {
            try
            {
                var result = await _postService.SavePostAsync(saveRequest);
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Internal server error",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpDelete("unsave/{userId}/{postId}")]
        public async Task<IActionResult> UnsavePost(int userId, int postId)
        {
            try
            {
                var result = await _postService.UnsavePostAsync(userId, postId);
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Internal server error",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpGet("saved/{userId}")]
        public async Task<IActionResult> GetUserSavedPosts(int userId)
        {
            try
            {
                var result = await _postService.GetUserSavedPostsAsync(userId);
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Internal server error",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpGet("is-saved/{userId}/{postId}")]
        public async Task<IActionResult> IsPostSaved(int userId, int postId)
        {
            try
            {
                var result = await _postService.IsPostSavedAsync(userId, postId);
                if (!result.Success)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Internal server error",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeletePost(int id, [FromQuery] int userId)
        {
            var result = await _postService.DeletePostAsync(id, userId);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpPost("like")]
        public async Task<ActionResult<ApiResponse<bool>>> ToggleLike([FromBody] LikeDto likeDto)
        {
            var result = await _postService.ToggleLikeAsync(likeDto);
            return Ok(result);
        }

        [HttpPost("comment")]
        public async Task<ActionResult<ApiResponse<CommentDto>>> AddComment([FromBody] CommentCreateDto commentCreateDto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new ApiResponse<CommentDto>
                {
                    Success = false,
                    Message = "Validation failed",
                    Errors = errors
                });
            }

            var result = await _postService.AddCommentAsync(commentCreateDto);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }
    }
}