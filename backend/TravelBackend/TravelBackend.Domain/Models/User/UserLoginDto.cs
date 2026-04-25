namespace TravelBackend.Domain.Models.User
{
    public class UserLoginDto
    {
        public string CredentialType { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
