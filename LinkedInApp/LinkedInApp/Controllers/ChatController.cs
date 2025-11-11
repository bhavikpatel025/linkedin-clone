// Controllers/ChatController.cs
using LinkedInApp.DTOs;
using LinkedInApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace LinkedInApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly IJwtService _jwtService;
        private readonly IFileService _fileService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            IChatService chatService,
            IJwtService jwtService,
            IFileService fileService,
            ILogger<ChatController> logger)
        {
            _chatService = chatService;
            _jwtService = jwtService;
            _fileService = fileService;
            _logger = logger;
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
            try
            {
                var currentUserId = _jwtService.GetUserIdFromClaims(User);
                var response = await _chatService.SendMessageAsync(createMessageDto, currentUserId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessage endpoint");
                return BadRequest(new ApiResponse<MessageDto>
                {
                    Success = false,
                    Message = "Failed to send message",
                    Errors = new List<string> { ex.Message }
                });
            }
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

        [HttpPost("upload-file")]
        public async Task<IActionResult> UploadFile([FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new ApiResponse<FileUploadResponseDto>
                    {
                        Success = false,
                        Message = "No file provided"
                    });
                }

                var fileType = _fileService.GetFileType(file.FileName);
                var uploadPath = _fileService.GetUploadPath(fileType);
                var result = await _fileService.UploadFileAsync(file, uploadPath, true);

                var response = new ApiResponse<FileUploadResponseDto>
                {
                    Success = result.Success,
                    Message = result.Message,
                    Data = result
                };

                return result.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file");
                return BadRequest(new ApiResponse<FileUploadResponseDto>
                {
                    Success = false,
                    Message = "File upload failed",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPost("upload-files")]
        public async Task<IActionResult> UploadFiles([FromForm] List<IFormFile> files)
        {
            try
            {
                if (files == null || !files.Any())
                {
                    return BadRequest(new ApiResponse<List<FileUploadResponseDto>>
                    {
                        Success = false,
                        Message = "No files provided"
                    });
                }

                var results = new List<FileUploadResponseDto>();

                foreach (var file in files)
                {
                    var fileType = _fileService.GetFileType(file.FileName);
                    var uploadPath = _fileService.GetUploadPath(fileType);
                    var result = await _fileService.UploadFileAsync(file, uploadPath, true);
                    results.Add(result);
                }

                var response = new ApiResponse<List<FileUploadResponseDto>>
                {
                    Success = true,
                    Message = $"Uploaded {results.Count(r => r.Success)} of {files.Count} files",
                    Data = results
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading files");
                return BadRequest(new ApiResponse<List<FileUploadResponseDto>>
                {
                    Success = false,
                    Message = "File upload failed",
                    Errors = new List<string> { ex.Message }
                });
            }
        }
        // Controllers/ChatController.cs - ADD THIS METHOD
        [HttpPost("message-with-files")]
        public async Task<IActionResult> SendMessageWithFiles([FromForm] string messageData, [FromForm] List<IFormFile> files)
        {
            try
            {
                var currentUserId = _jwtService.GetUserIdFromClaims(User);

                // Deserialize the message data
                var createMessageDto = JsonSerializer.Deserialize<CreateMessageDto>(messageData, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (createMessageDto == null)
                {
                    return BadRequest(new ApiResponse<MessageDto>
                    {
                        Success = false,
                        Message = "Invalid message data"
                    });
                }

                // Set the files
                createMessageDto.Files = files;

                var response = await _chatService.SendMessageAsync(createMessageDto, currentUserId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessageWithFiles endpoint");
                return BadRequest(new ApiResponse<MessageDto>
                {
                    Success = false,
                    Message = "Failed to send message with files",
                    Errors = new List<string> { ex.Message }
                });
            }
        }
    }
}