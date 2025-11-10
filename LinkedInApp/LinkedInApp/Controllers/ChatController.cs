// Controllers/ChatController.cs
using LinkedInApp.DTOs;
using LinkedInApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LinkedInApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly IJwtService _jwtService;

        public ChatController(IChatService chatService, IJwtService jwtService)
        {
            _chatService = chatService;
            _jwtService = jwtService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateChat([FromBody] CreateChatDto createChatDto)
        {
            var currentUserId = _jwtService.GetUserIdFromClaims(User);
            var response = await _chatService.CreateChatAsync(createChatDto, currentUserId);
            return Ok(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserChats()
        {
            var currentUserId = _jwtService.GetUserIdFromClaims(User);
            var response = await _chatService.GetUserChatsAsync(currentUserId);
            return Ok(response);
        }

        [HttpGet("{chatId}")]
        public async Task<IActionResult> GetChat(int chatId)
        {
            var currentUserId = _jwtService.GetUserIdFromClaims(User);
            var response = await _chatService.GetChatAsync(chatId, currentUserId);
            return Ok(response);
        }

        [HttpPost("message")]
        public async Task<IActionResult> SendMessage([FromBody] CreateMessageDto createMessageDto)
        {
            var currentUserId = _jwtService.GetUserIdFromClaims(User);
            var response = await _chatService.SendMessageAsync(createMessageDto, currentUserId);
            return Ok(response);
        }

        [HttpGet("{chatId}/messages")]
        public async Task<IActionResult> GetChatMessages(int chatId)
        {
            var currentUserId = _jwtService.GetUserIdFromClaims(User);
            var response = await _chatService.GetChatMessagesAsync(chatId, currentUserId);
            return Ok(response);
        }

        [HttpPost("message/{messageId}/read")]
        public async Task<IActionResult> MarkMessageAsRead(int messageId)
        {
            var currentUserId = _jwtService.GetUserIdFromClaims(User);
            var response = await _chatService.MarkMessageAsReadAsync(messageId, currentUserId);
            return Ok(response);
        }

        [HttpPost("{chatId}/read-all")]
        public async Task<IActionResult> MarkAllMessagesAsRead(int chatId)
        {
            var currentUserId = _jwtService.GetUserIdFromClaims(User);
            var response = await _chatService.MarkAllMessagesAsReadAsync(chatId, currentUserId);
            return Ok(response);
        }
    }
}