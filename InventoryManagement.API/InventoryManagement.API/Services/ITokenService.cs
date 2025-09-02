//using InventoryManagement.API.Models;

//namespace InventoryManagement.API.Services;

//public interface ITokenService
//{
//    string CreateToken(User user);
//}

// In ITokenService.cs
// ITokenService.cs
// Services/ITokenService.cs
using InventoryManagement.API.Models;
using System.Security.Claims;

namespace InventoryManagement.API.Services;

// ITokenService.cs
public interface ITokenService
{
    string CreateToken(User user, IEnumerable<Claim> claims);
}