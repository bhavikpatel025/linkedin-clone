using LinkedInApp.DTOs;
using LinkedInApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace LinkedInApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConnectionsController : ControllerBase
    {
        private readonly IConnectionService _connectionService;

        public ConnectionsController(IConnectionService connectionService)
        {
            _connectionService = connectionService;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserConnections(int userId)
        {
            var result = await _connectionService.GetUserConnections(userId);
            return Ok(result);
        }

        [HttpGet("pending/{userId}")]
        public async Task<IActionResult> GetPendingConnections(int userId)
        {
            var result = await _connectionService.GetPendingConnections(userId);
            return Ok(result);
        }

        [HttpGet("suggestions/{userId}")]
        public async Task<IActionResult> GetConnectionSuggestions(int userId)
        {
            var result = await _connectionService.GetConnectionSuggestions(userId);
            return Ok(result);
        }

        [HttpPost("send-request")]
        public async Task<IActionResult> SendConnectionRequest([FromBody] ConnectionRequestDto request)
        {
            var result = await _connectionService.SendConnectionRequest(request);
            return Ok(result);
        }

        [HttpPost("respond-request")]
        public async Task<IActionResult> RespondToConnectionRequest([FromBody] ConnectionResponseDto response)
        {
            var result = await _connectionService.RespondToConnectionRequest(response);
            return Ok(result);
        }

        [HttpDelete("{connectionId}")]
        public async Task<IActionResult> RemoveConnection(int connectionId, [FromQuery] int userId)
        {
            var result = await _connectionService.RemoveConnection(connectionId, userId);
            return Ok(result);
        }

        [HttpGet("count/{userId}")]
        public async Task<IActionResult> GetConnectionCount(int userId)
        {
            var result = await _connectionService.GetConnectionCount(userId);
            return Ok(result);
        }

        [HttpGet("check-status")]
        public async Task<IActionResult> CheckConnectionStatus([FromQuery] int user1Id, [FromQuery] int user2Id)
        {
            var result = await _connectionService.CheckConnectionStatus(user1Id, user2Id);
            return Ok(result);
        }
    }
}