//using InventoryManagement.API.Dtos;
//using InventoryManagement.API.Models;
//using InventoryManagement.API.Services;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.AspNetCore.Mvc;

//namespace InventoryManagement.API.Controllers;

//[ApiController]
//[Route("api/[controller]")]
//public class AuthController : ControllerBase
//{
//    private readonly UserManager<User> _userManager;
//    private readonly SignInManager<User> _signInManager;
//    private readonly ITokenService _tokenService;

//    public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, ITokenService tokenService)
//    {
//        _userManager = userManager;
//        _signInManager = signInManager;
//        _tokenService = tokenService;
//    }

//    [HttpPost("register")]
//    public async Task<IActionResult> Register(UserRegistrationDto dto)
//    {
//        if (await _userManager.FindByNameAsync(dto.Username) != null)
//        {
//            return BadRequest("Username already exists");
//        }

//        if (await _userManager.FindByEmailAsync(dto.Email) != null)
//        {
//            return BadRequest("Email already exists");
//        }

//        var user = new User
//        {
//            UserName = dto.Username,
//            Email = dto.Email,
//            FirstName = dto.FirstName,
//            LastName = dto.LastName,
//            Role = UserRole.Staff,
//            Status = ApprovalStatus.Pending
//        };

//        var result = await _userManager.CreateAsync(user, dto.Password);

//        if (!result.Succeeded)
//        {
//            return BadRequest(result.Errors);
//        }

//        return Ok(new { message = "Registration successful. Please wait for admin approval." });
//    }

//    [HttpPost("login")]
//    public async Task<IActionResult> Login(UserLoginDto dto)
//    {
//        var user = await _userManager.FindByNameAsync(dto.Username);
//        if (user == null)
//        {
//            return Unauthorized("Invalid credentials");
//        }

//        if (user.Status != ApprovalStatus.Approved)
//        {
//            return Unauthorized("Account not approved yet");
//        }

//        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
//        if (!result.Succeeded)
//        {
//            return Unauthorized("Invalid credentials");
//        }

//        var token = _tokenService.CreateToken(user);
//        var userResponse = new UserResponseDto(
//            user.Id,
//            user.UserName!,
//            user.Email!,
//            user.FirstName,
//            user.LastName,
//            user.Role,
//            user.Status,
//            user.CreatedAt
//        );

//        return Ok(new LoginResponseDto(token, userResponse));
//    }

//    [HttpPost("logout")]
//    public async Task<IActionResult> Logout()
//    {
//        await _signInManager.SignOutAsync();
//        return Ok(new { message = "Logged out successfully" });
//    }
//}


using InventoryManagement.API.Dtos;
using InventoryManagement.API.Models;
using InventoryManagement.API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace InventoryManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly ITokenService _tokenService;

    public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, ITokenService tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(UserRegistrationDto dto)
    {
        if (await _userManager.FindByNameAsync(dto.Username) != null)
        {
            return BadRequest("Username already exists");
        }

        if (await _userManager.FindByEmailAsync(dto.Email) != null)
        {
            return BadRequest("Email already exists");
        }

        var user = new User
        {
            UserName = dto.Username,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = UserRole.Staff,
            Status = ApprovalStatus.Pending
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok(new { message = "Registration successful. Please wait for admin approval." });
    }

    //[HttpPost("login")]
    //public async Task<IActionResult> Login(UserLoginDto dto)
    //{
    //    var user = await _userManager.FindByNameAsync(dto.Username);
    //    if (user == null)
    //    {
    //        return Unauthorized("Invalid credentials");
    //    }

    //    if (user.Status != ApprovalStatus.Approved)
    //    {
    //        return Unauthorized("Account not approved yet");
    //    }

    //    var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
    //    if (!result.Succeeded)
    //    {
    //        return Unauthorized("Invalid credentials");
    //    }

    //    // ✅ FIXED: Create proper JWT claims including NameIdentifier
    //    var claims = new List<Claim>
    //    {
    //        new Claim(ClaimTypes.NameIdentifier, user.Id), // ← CRITICAL for StaffController
    //        new Claim(JwtRegisteredClaimNames.Sub, user.Id),
    //        new Claim("userId", user.Id), // Additional fallback
    //        new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
    //        new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
    //        new Claim("role", user.Role.ToString()),
    //        // Add role claim for authorization
    //        new Claim(ClaimTypes.Role, user.Role.ToString())
    //    };

    //    var token = _tokenService.CreateToken(user, claims);
    //    var userResponse = new UserResponseDto(
    //        user.Id,
    //        user.UserName!,
    //        user.Email!,
    //        user.FirstName,
    //        user.LastName,
    //        user.Role,
    //        user.Status,
    //        user.CreatedAt
    //    );

    //    return Ok(new LoginResponseDto(token, userResponse));
    //}
    // In AuthController.cs - Login method
    [HttpPost("login")]
    public async Task<IActionResult> Login(UserLoginDto dto)
    {
        var user = await _userManager.FindByNameAsync(dto.Username);
        if (user == null || user.Status != ApprovalStatus.Approved)
        {
            return Unauthorized("Invalid credentials or account not approved");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized("Invalid credentials");
        }

        var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(JwtRegisteredClaimNames.Sub, user.Id),
        new Claim("userId", user.Id),
        new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
        new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
        new Claim(ClaimTypes.Role, user.Role.ToString())
    };

        var token = _tokenService.CreateToken(user, claims);
        var userResponse = new UserResponseDto(
            user.Id, user.UserName!, user.Email!, user.FirstName, user.LastName,
            user.Role, user.Status, user.CreatedAt
        );

        return Ok(new LoginResponseDto(token, userResponse));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Logged out successfully" });
    }
}