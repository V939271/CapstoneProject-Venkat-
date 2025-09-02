//using System.IdentityModel.Tokens.Jwt;
//using System.Security.Claims;
//using System.Text;
//using InventoryManagement.API.Models;
//using Microsoft.IdentityModel.Tokens;

//namespace InventoryManagement.API.Services;

//public class TokenService : ITokenService
//{
//    private readonly IConfiguration _config;

//    public TokenService(IConfiguration config)
//    {
//        _config = config;
//    }

//    public string CreateToken(User user)
//    {
//        var tokenHandler = new JwtSecurityTokenHandler();
//        var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]!);

//        var claims = new List<Claim>
//        {
//            new(ClaimTypes.NameIdentifier, user.Id),
//            new(ClaimTypes.Name, user.UserName!),
//            new(ClaimTypes.Email, user.Email!),
//            new(ClaimTypes.Role, user.Role.ToString()),
//            new("FirstName", user.FirstName),
//            new("LastName", user.LastName)
//        };

//        var tokenDescriptor = new SecurityTokenDescriptor
//        {
//            Subject = new ClaimsIdentity(claims),
//            Expires = DateTime.UtcNow.AddDays(7),
//            Issuer = _config["Jwt:Issuer"],
//            Audience = _config["Jwt:Audience"],
//            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
//        };

//        var token = tokenHandler.CreateToken(tokenDescriptor);
//        return tokenHandler.WriteToken(token);
//    }
//}


using InventoryManagement.API.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace InventoryManagement.API.Services;

// TokenService.cs
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<TokenService> _logger;

    public TokenService(IConfiguration configuration, ILogger<TokenService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string CreateToken(User user, IEnumerable<Claim> claims)
    {
        try
        {
            // Log the claims being used for debugging
            _logger.LogInformation("Creating JWT for user {UserId} with claims: {@Claims}",
                user.Id, claims.Select(c => new { c.Type, c.Value }));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating JWT token for user {UserId}", user.Id);
            throw;
        }
    }
}
