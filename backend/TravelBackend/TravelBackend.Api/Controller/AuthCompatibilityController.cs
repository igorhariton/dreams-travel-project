using Microsoft.AspNetCore.Mvc;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.DataAccess.Context;
using TravelBackend.Domain.Entities.User;
using TravelBackend.Domain.Models.User;

namespace TravelBackend.Api.Controller
{
    [Route("api/auth")]
    [ApiController]
    public class AuthCompatibilityController : ControllerBase
    {
        private readonly IUserLoginAction _userLogin;
        private readonly IUserRegAction _userRegister;

        public AuthCompatibilityController()
        {
            var bl = new BusinessLayer.BusinessLogic();
            _userLogin = bl.UserLoginAction();
            _userRegister = bl.UserRegAction();
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var credential = (request.Identifier ?? request.CredentialType ?? request.Email ?? string.Empty).Trim();
            var password = request.Password ?? string.Empty;

            if (string.IsNullOrWhiteSpace(credential) || string.IsNullOrWhiteSpace(password))
            {
                return BadRequest(new { message = "Credential and password are required." });
            }

            var result = _userLogin.UserLoginDataValidation(new UserLoginDto
            {
                CredentialType = credential,
                Password = password
            });

            if (!result.IsSuccess)
            {
                return Unauthorized(new { message = result.Message ?? "Invalid user credentials." });
            }

            var user = FindUser(credential);
            if (user == null)
            {
                return Unauthorized(new { message = "User profile could not be loaded." });
            }

            return Ok(new
            {
                message = result.Message,
                user = ToFrontendUser(user)
            });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            var email = (request.Email ?? string.Empty).Trim();
            var password = request.Password ?? string.Empty;
            var phone = (request.Phone ?? string.Empty).Trim();
            var username = BuildUsername(request.Username, request.Name, email);
            var (firstName, lastName) = SplitName(request.Name, username);

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                return BadRequest(new { message = "Email and password are required." });
            }

            var result = _userRegister.UserRegDataValidation(new UserRegisterDto
            {
                FirstName = firstName,
                LastName = lastName,
                UserName = username,
                Email = email,
                Password = password,
                Phone = phone
            });

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message ?? "Registration failed." });
            }

            var user = FindUser(email);
            if (user == null)
            {
                return Ok(new { message = result.Message });
            }

            var requestedRole = ParsePublicRole(request.Role);
            if (user.Role != requestedRole)
            {
                using var db = new UserContext();
                var persistedUser = db.Users.FirstOrDefault(x => x.Id == user.Id);
                if (persistedUser != null)
                {
                    persistedUser.Role = requestedRole;
                    db.SaveChanges();
                    user.Role = requestedRole;
                }
            }

            return Ok(new
            {
                message = result.Message,
                user = ToFrontendUser(user)
            });
        }

        [HttpGet("me")]
        public IActionResult Me()
        {
            return Unauthorized(new { message = "No active session." });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new { message = "Logged out." });
        }

        private static UserData? FindUser(string credential)
        {
            using var db = new UserContext();
            return db.Users.FirstOrDefault(x => x.UserName == credential || x.Email == credential);
        }

        private static object ToFrontendUser(UserData user)
        {
            var name = string.Join(" ", new[] { user.FirstName, user.LastName }.Where(x => !string.IsNullOrWhiteSpace(x))).Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                name = user.UserName;
            }

            return new
            {
                id = user.Id.ToString(),
                username = user.UserName,
                name,
                email = user.Email,
                phone = user.Phone,
                role = ToFrontendRole(user.Role)
            };
        }

        private static string ToFrontendRole(UserRole role)
        {
            return role switch
            {
                UserRole.Admin => "admin",
                UserRole.Host => "host",
                _ => "user"
            };
        }

        private static UserRole ParsePublicRole(string? role)
        {
            return string.Equals(role, "host", StringComparison.OrdinalIgnoreCase)
                ? UserRole.Host
                : UserRole.User;
        }

        private static string BuildUsername(string? username, string? name, string email)
        {
            var candidate = FirstNonEmpty(username, name, email.Split('@')[0]);
            var sanitized = new string(candidate.Trim().Select(ch => char.IsLetterOrDigit(ch) ? ch : '_').ToArray()).Trim('_');

            if (sanitized.Length < 4)
            {
                sanitized = $"{sanitized}_user".Trim('_');
            }

            return sanitized.Length > 30 ? sanitized[..30] : sanitized;
        }

        private static (string FirstName, string LastName) SplitName(string? name, string fallback)
        {
            var parts = (name ?? string.Empty)
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            var firstName = parts.FirstOrDefault() ?? fallback;
            var lastName = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : string.Empty;

            return (TrimToLength(firstName, 30), TrimToLength(lastName, 30));
        }

        private static string TrimToLength(string value, int length)
        {
            return value.Length <= length ? value : value[..length];
        }

        private static string FirstNonEmpty(params string?[] values)
        {
            return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)) ?? "user";
        }

        public class LoginRequest
        {
            public string? Identifier { get; set; }
            public string? CredentialType { get; set; }
            public string? Email { get; set; }
            public string? Password { get; set; }
        }

        public class RegisterRequest
        {
            public string? Name { get; set; }
            public string? Username { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
            public string? Password { get; set; }
            public string? Role { get; set; }
        }
    }
}
