using LinkedInApp.DTOs;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;

namespace LinkedInApp.Services
{
    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FileService> _logger;

        public FileService(IWebHostEnvironment environment, IConfiguration configuration, ILogger<FileService> logger)
        {
            _environment = environment;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<FileUploadResponseDto> UploadFileAsync(IFormFile file, string uploadPath, bool generateThumbnail = false)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return new FileUploadResponseDto { Success = false, Message = "File is empty" };
                }

                // Validate file size (10MB max)
                var maxFileSize = 10 * 1024 * 1024;
                if (file.Length > maxFileSize)
                {
                    return new FileUploadResponseDto { Success = false, Message = "File size exceeds 10MB limit" };
                }

                // Create upload directory if it doesn't exist
                var fullUploadPath = Path.Combine(_environment.WebRootPath, uploadPath);
                if (!Directory.Exists(fullUploadPath))
                {
                    Directory.CreateDirectory(fullUploadPath);
                }

                // Generate unique file name
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(fullUploadPath, fileName);
                var relativeFilePath = Path.Combine(uploadPath, fileName).Replace("\\", "/");

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                _logger.LogInformation("File uploaded successfully: {FilePath}", filePath);

                var response = new FileUploadResponseDto
                {
                    Success = true,
                    Message = "File uploaded successfully",
                    FileUrl = $"/{relativeFilePath}",
                    FileName = file.FileName,
                    FileType = GetFileType(file.FileName),
                    FileSize = file.Length
                };

                // Generate thumbnail for images
                if (generateThumbnail && IsImageFile(file.FileName))
                {
                    var thumbnailPath = GenerateThumbnail(filePath, fullUploadPath);
                    if (!string.IsNullOrEmpty(thumbnailPath))
                    {
                        response.ThumbnailUrl = $"/{Path.Combine(uploadPath, Path.GetFileName(thumbnailPath)).Replace("\\", "/")}";
                    }
                }

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file: {FileName}", file?.FileName);
                return new FileUploadResponseDto { Success = false, Message = $"Error uploading file: {ex.Message}" };
            }
        }

        public string GenerateThumbnail(string imagePath, string thumbnailPath, int width = 200, int height = 200)
        {
            try
            {
                var thumbnailFileName = $"thumb_{Path.GetFileNameWithoutExtension(imagePath)}.jpg";
                var thumbnailFullPath = Path.Combine(thumbnailPath, thumbnailFileName);

                // Create thumbnail directory if it doesn't exist
                if (!Directory.Exists(thumbnailPath))
                {
                    Directory.CreateDirectory(thumbnailPath);
                }

                using (var image = Image.Load(imagePath))
                {
                    // Calculate aspect ratio preserving dimensions
                    var options = new ResizeOptions
                    {
                        Size = new Size(width, height),
                        Mode = ResizeMode.Max, // Preserves aspect ratio
                        Compand = true
                    };

                    image.Mutate(x => x.Resize(options));

                    // Save as JPEG for consistent thumbnail format
                    image.Save(thumbnailFullPath, new SixLabors.ImageSharp.Formats.Jpeg.JpegEncoder
                    {
                        Quality = 80 // Good quality with reasonable file size
                    });
                }

                _logger.LogInformation("Thumbnail generated: {ThumbnailPath}", thumbnailFullPath);
                return thumbnailFullPath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating thumbnail for: {ImagePath}", imagePath);
                return null;
            }
        }
        public async Task<bool> DeleteFileAsync(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(_environment.WebRootPath, filePath.TrimStart('/'));
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {FilePath}", filePath);
                return false;
            }
        }

        public string GetFileType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".jpg" or ".jpeg" or ".png" or ".gif" or ".bmp" or ".webp" => "image",
                ".mp4" or ".avi" or ".mov" or ".wmv" or ".flv" => "video",
                ".mp3" or ".wav" or ".ogg" or ".flac" => "audio",
                ".pdf" => "pdf",
                ".doc" or ".docx" => "word",
                ".xls" or ".xlsx" => "excel",
                ".ppt" or ".pptx" => "powerpoint",
                ".zip" or ".rar" or ".7z" => "archive",
                _ => "document"
            };
        }

        public string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            int order = 0;
            double len = bytes;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len /= 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }

        public string GetUploadPath(string fileType)
        {
            return fileType switch
            {
                "image" => "uploads/images",
                "video" => "uploads/videos",
                "audio" => "uploads/audio",
                _ => "uploads/documents"
            };
        }

        private bool IsImageFile(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" }.Contains(extension);
        }
    }
}