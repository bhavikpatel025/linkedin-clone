using LinkedInApp.DTOs;
using LinkedInApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LinkedInApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RepliesController : ControllerBase
    {
        private readonly IPostService _postService;

        public RepliesController(IPostService postService)
        {
            _postService = postService;
        }

        [HttpPost]
        public async Task<IActionResult> AddReply([FromBody] ReplyCreateDto replyDto)
        {
            try
            {
                var response = await _postService.AddReplyAsync(replyDto);

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
                return StatusCode(500, new ApiResponse<ReplyDto>
                {
                    Success = false,
                    Message = "An error occurred while adding reply",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpDelete("{replyId}")]
        public async Task<IActionResult> DeleteReply(int replyId, [FromQuery] int userId)
        {
            try
            {
                var response = await _postService.DeleteReplyAsync(replyId, userId);

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
                    Message = "An error occurred while deleting reply",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpGet("comment/{commentId}")]
        public async Task<IActionResult> GetRepliesByCommentId(int commentId)
        {
            try
            {
                var response = await _postService.GetRepliesByCommentIdAsync(commentId);

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
                return StatusCode(500, new ApiResponse<List<ReplyDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving replies",
                    Errors = new List<string> { ex.Message }
                });
            }
        }
    }
}