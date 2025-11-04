using System.Net;
using System.Net.Mail;

namespace LinkedInApp.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetLink);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetLink)
        {
            try
            {
                // For development - log the reset link
                _logger.LogInformation($"🔐 Password Reset Link for {email}: {resetLink}");

                // Try to send via SMTP if configured
                await SendEmailViaSmtp(email, resetLink);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email");
                // Don't throw - we don't want password reset to fail because of email issues
            }
        }

        private async Task SendEmailViaSmtp(string email, string resetLink)
        {
            var smtpHost = _configuration["EmailSettings:SmtpHost"];
            var smtpPort = _configuration["EmailSettings:SmtpPort"];
            var smtpUsername = _configuration["EmailSettings:SmtpUsername"];
            var smtpPassword = _configuration["EmailSettings:SmtpPassword"];

            // If SMTP is not configured, just log and return
            if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
            {
                _logger.LogWarning("SMTP not configured. Password reset link: {ResetLink}", resetLink);
                return;
            }

            using var client = new SmtpClient(smtpHost, int.Parse(smtpPort!))
            {
                Credentials = new NetworkCredential(smtpUsername, smtpPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_configuration["EmailSettings:FromEmail"] ?? "noreply@linkedinapp.com"),
                Subject = "Reset Your LinkedInApp Password",
                Body = CreateEmailBody(resetLink),
                IsBodyHtml = true
            };
            mailMessage.To.Add(email);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation($"✅ Password reset email sent to {email}");
        }

        private string CreateEmailBody(string resetLink)
        {
            return $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background: linear-gradient(135deg, #0a66c2, #004182); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;'>
                        <h1>LinkedInApp</h1>
                    </div>
                    <div style='background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;'>
                        <h2>Password Reset Request</h2>
                        <p>You requested to reset your password. Click the button below to set a new password:</p>
                        <p style='text-align: center;'>
                            <a href='{resetLink}' style='background-color: #0a66c2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 24px; display: inline-block; font-weight: bold;'>
                                Reset Password
                            </a>
                        </p>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                    <div style='text-align: center; margin-top: 20px; font-size: 12px; color: #666;'>
                        <p>&copy; 2024 LinkedInApp. All rights reserved.</p>
                    </div>
                </div>";
        }
    }
}