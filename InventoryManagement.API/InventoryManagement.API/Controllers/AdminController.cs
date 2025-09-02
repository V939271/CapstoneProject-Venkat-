using InventoryManagement.API.Data;
using InventoryManagement.API.Dtos;
using InventoryManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace InventoryManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        UserManager<User> userManager,
        ApplicationDbContext context,
        ILogger<AdminController> logger)
    {
        _userManager = userManager;
        _context = context;
        _logger = logger;
    }

    // APPROVAL ENDPOINTS
    [HttpGet("approvals")]
    public async Task<IActionResult> GetPendingApprovals()
    {
        try
        {
            var pendingUsers = await _userManager.Users
                .Where(u => u.Status == ApprovalStatus.Pending)
                .Select(u => new PendingUserDto(
                    u.Id,
                    u.UserName!,
                    u.Email!,
                    u.FirstName,
                    u.LastName,
                    u.CreatedAt
                ))
                .ToListAsync();

            return Ok(pendingUsers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending approvals");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("approvals/{id}/approve")]
    public async Task<IActionResult> ApproveUser(string id, ApproveUserDto dto)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (user.Status != ApprovalStatus.Pending)
            {
                return BadRequest(new { message = "User is not in pending status" });
            }

            user.Status = ApprovalStatus.Approved;
            user.Role = dto.Role;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to approve user", errors = result.Errors });
            }

            // Add user to role
            var roleName = GetRoleName(dto.Role);
            await _userManager.AddToRoleAsync(user, roleName);

            _logger.LogInformation("User {UserId} approved with role {Role}", id, roleName);
            return Ok(new { message = "User approved successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("approvals/{id}/reject")]
    public async Task<IActionResult> RejectUser(string id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (user.Status != ApprovalStatus.Pending)
            {
                return BadRequest(new { message = "User is not in pending status" });
            }

            user.Status = ApprovalStatus.Rejected;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to reject user", errors = result.Errors });
            }

            _logger.LogInformation("User {UserId} rejected", id);
            return Ok(new { message = "User rejected successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    // USER MANAGEMENT ENDPOINTS
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _userManager.Users
                .Select(u => new UserResponseDto(
                    u.Id,
                    u.UserName!,
                    u.Email!,
                    u.FirstName,
                    u.LastName,
                    u.Role,
                    u.Status,
                    u.CreatedAt
                ))
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(string id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var userResponse = new UserResponseDto(
                user.Id,
                user.UserName!,
                user.Email!,
                user.FirstName,
                user.LastName,
                user.Role,
                user.Status,
                user.CreatedAt
            );

            return Ok(userResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            // Validate input
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid data", errors = ModelState });
            }

            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return Conflict(new { message = "User with this email already exists" });
            }

            // Create new user
            var user = new User
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = (UserRole)request.Role,
                Status = ApprovalStatus.Approved, // Admin-created users are auto-approved
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                // Assign role
                string roleName = GetRoleName(request.Role);
                await _userManager.AddToRoleAsync(user, roleName);

                _logger.LogInformation("User {Email} created successfully with role {Role}", request.Email, roleName);

                var userResponse = new UserResponseDto(
                    user.Id,
                    user.UserName!,
                    user.Email!,
                    user.FirstName,
                    user.LastName,
                    user.Role,
                    user.Status,
                    user.CreatedAt
                );

                return CreatedAtAction(nameof(GetUser), new { id = user.Id }, userResponse);
            }
            else
            {
                var errors = result.Errors.Select(e => e.Description);
                _logger.LogWarning("Failed to create user {Email}: {Errors}", request.Email, string.Join(", ", errors));
                return BadRequest(new { message = "Failed to create user", errors });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid data", errors = ModelState });
            }

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Check if email is being changed and if it's already taken
            if (request.Email != user.Email)
            {
                var existingUser = await _userManager.FindByEmailAsync(request.Email);
                if (existingUser != null && existingUser.Id != id)
                {
                    return Conflict(new { message = "Email is already in use by another user" });
                }
                user.Email = request.Email;
                user.UserName = request.Email;
            }

            // Update user properties
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to update user", errors = result.Errors });
            }

            // Update password if provided
            if (!string.IsNullOrEmpty(request.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var passwordResult = await _userManager.ResetPasswordAsync(user, token, request.Password);
                if (!passwordResult.Succeeded)
                {
                    return BadRequest(new { message = "Failed to update password", errors = passwordResult.Errors });
                }
            }

            _logger.LogInformation("User {UserId} updated successfully", id);

            var userResponse = new UserResponseDto(
                user.Id,
                user.UserName!,
                user.Email!,
                user.FirstName,
                user.LastName,
                user.Role,
                user.Status,
                user.CreatedAt
            );

            return Ok(userResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Prevent admin from deleting themselves
            var currentUserId = _userManager.GetUserId(User);
            if (user.Id == currentUserId)
            {
                return BadRequest(new { message = "You cannot delete your own account" });
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to delete user", errors = result.Errors });
            }

            _logger.LogInformation("User {UserId} ({Email}) deleted successfully", id, user.Email);
            return Ok(new { message = "User deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateUserRole(string id, ApproveUserDto dto)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Remove from current roles
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Any())
            {
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
            }

            // Update role and add to new role
            user.Role = dto.Role;
            user.UpdatedAt = DateTime.UtcNow;

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return BadRequest(new { message = "Failed to update user role", errors = updateResult.Errors });
            }

            var roleName = GetRoleName(dto.Role);
            await _userManager.AddToRoleAsync(user, roleName);

            _logger.LogInformation("User {UserId} role updated to {Role}", id, roleName);
            return Ok(new { message = "User role updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user role {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    // LOGS ENDPOINT
    [HttpGet("logs")]
    public async Task<IActionResult> GetAllLogs()
    {
        try
        {
            var logs = await _context.InventoryMovements
                .Include(m => m.Product)
                .Include(m => m.User)
                .OrderByDescending(m => m.Timestamp)
                .Select(m => new InventoryMovementResponseDto(
                    m.Id,
                    m.ProductId,
                    m.Product.Name,
                    m.UserId,
                    $"{m.User.FirstName} {m.User.LastName}",
                    m.Change,
                    m.PreviousQuantity,
                    m.NewQuantity,
                    m.Reason,
                    m.Type,
                    m.Timestamp,
                    m.Notes
                ))
                .ToListAsync();

            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all logs");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    // HELPER METHODS
    private string GetRoleName(UserRole role)
    {
        return role switch
        {
            UserRole.Staff => "Staff",
            UserRole.Manager => "Manager",
            UserRole.Admin => "Admin",
            _ => "Staff"
        };
    }

    private string GetRoleName(int roleId)
    {
        return roleId switch
        {
            1 => "Staff",
            2 => "Manager",
            3 => "Admin",
            _ => "Staff"
        };
    }
}

// REQUEST DTOs
public class CreateUserRequest
{
    [Required]
    [StringLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Range(1, 3)]
    public int Role { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
    [Required]
    [StringLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [StringLength(100, MinimumLength = 6)]
    public string? Password { get; set; }
}

