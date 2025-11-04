using LinkedInApp.DTOs;
using LinkedInApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LinkedInApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly IPostService _postService;

        public CommentsController(IPostService postService)
        {
            _postService = postService;
        }

        [HttpDelete("{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId, [FromQuery] int userId)
        {
            try
            {
                var response = await _postService.DeleteCommentAsync(commentId, userId);

                if (response.Success)
                {
                    return Ok(response);
                }
                else
                {
                    return BadRequest(response);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred while deleting the comment",
                    Errors = new List<string> { ex.Message }
                });
            }
        }
    }
}