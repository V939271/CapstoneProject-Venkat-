using InventoryManagement.API.Data;
using InventoryManagement.API.Dtos;
using InventoryManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace InventoryManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Staff,Manager,Admin")]
public class StaffController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<StaffController> _logger;

    public StaffController(ApplicationDbContext context, ILogger<StaffController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost("movements")]
    public async Task<IActionResult> CreateMovement([FromBody] InventoryMovementCreateDto dto)
    {
        try
        {
            _logger.LogInformation("=== MOVEMENT CREATION DEBUG START ===");
            _logger.LogInformation("Request data: {@Data}", dto);

            // ✅ DEBUG: Log all user claims to identify the issue
            var allClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            _logger.LogInformation("All user claims: {@Claims}", allClaims);

            // ✅ ENHANCED: Try multiple claim types for user ID
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value
                       ?? User.FindFirst("userId")?.Value
                       ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            _logger.LogInformation("Extracted userId: {UserId}", userId ?? "NULL");

            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogError("❌ No user identifier found in JWT claims");
                return Unauthorized(new
                {
                    message = "User not authenticated - no user identifier in JWT token",
                    availableClaims = allClaims.Select(c => c.Type).ToList(),
                    claimCount = allClaims.Count
                });
            }

            _logger.LogInformation("✅ User authenticated: {UserId}", userId);

            // Validate product exists
            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
            {
                _logger.LogWarning("Product not found: {ProductId}", dto.ProductId);
                return NotFound(new { message = "Product not found" });
            }

            _logger.LogInformation("✅ Product found: {ProductName}, Current Quantity: {Quantity}", product.Name, product.Quantity);

            // Validate movement type
            if (!Enum.IsDefined(typeof(MovementType), dto.Type))
            {
                _logger.LogWarning("Invalid movement type: {Type}", dto.Type);
                return BadRequest(new { message = "Invalid movement type" });
            }

            var previousQuantity = product.Quantity;
            var movementType = (MovementType)dto.Type;
            int actualChange = 0;
            int newQuantity = previousQuantity;

            // Calculate changes based on movement type
            switch (movementType)
            {
                case MovementType.StockIn:
                    actualChange = Math.Abs(dto.Change);
                    newQuantity = previousQuantity + actualChange;
                    break;

                case MovementType.StockOut:
                    actualChange = -Math.Abs(dto.Change);
                    newQuantity = previousQuantity + actualChange;
                    if (newQuantity < 0)
                    {
                        _logger.LogWarning("Insufficient stock for StockOut. Current: {Current}, Requested: {Requested}", previousQuantity, dto.Change);
                        return BadRequest(new { message = "Insufficient stock" });
                    }
                    break;

                case MovementType.Adjustment:
                    actualChange = dto.Change - previousQuantity;
                    newQuantity = dto.Change;
                    if (newQuantity < 0)
                    {
                        _logger.LogWarning("Adjustment would result in negative quantity: {NewQuantity}", newQuantity);
                        return BadRequest(new { message = "Adjustment quantity cannot be negative" });
                    }
                    break;

                case MovementType.Sale:
                    actualChange = -Math.Abs(dto.Change);
                    newQuantity = previousQuantity + actualChange;
                    if (newQuantity < 0)
                    {
                        _logger.LogWarning("Insufficient stock for Sale. Current: {Current}, Requested: {Requested}", previousQuantity, dto.Change);
                        return BadRequest(new { message = "Insufficient stock for sale" });
                    }
                    break;

                case MovementType.Return:
                    actualChange = Math.Abs(dto.Change);
                    newQuantity = previousQuantity + actualChange;
                    break;

                case MovementType.Damage:
                    actualChange = -Math.Abs(dto.Change);
                    newQuantity = previousQuantity + actualChange;
                    if (newQuantity < 0)
                    {
                        _logger.LogWarning("Damage adjustment: Setting quantity to 0 from {Current}", previousQuantity);
                        actualChange = -previousQuantity;
                        newQuantity = 0;
                    }
                    break;

                default:
                    _logger.LogWarning("Unsupported movement type: {Type}", movementType);
                    return BadRequest(new { message = "Unsupported movement type" });
            }

            _logger.LogInformation("Movement calculation: Previous={Previous}, Change={Change}, New={New}, Type={Type}",
                previousQuantity, actualChange, newQuantity, movementType);

            // Create movement record
            var movement = new InventoryMovement
            {
                ProductId = dto.ProductId,
                UserId = userId,
                Change = actualChange,
                PreviousQuantity = previousQuantity,
                NewQuantity = newQuantity,
                Reason = dto.Reason?.Trim() ?? string.Empty,
                Type = movementType,
                Notes = dto.Notes?.Trim(),
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation("Creating movement record: {@Movement}", new
            {
                movement.ProductId,
                movement.UserId,
                movement.Change,
                movement.Type
            });

            // Update product quantity
            product.Quantity = newQuantity;
            product.UpdatedAt = DateTime.UtcNow;

            _context.InventoryMovements.Add(movement);
            _context.Products.Update(product);

            _logger.LogInformation("Saving changes to database...");
            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Movement created successfully: ID={Id}", movement.Id);
            _logger.LogInformation("=== MOVEMENT CREATION DEBUG END ===");

            var responseDto = new InventoryMovementResponseDto(
                movement.Id,
                movement.ProductId,
                product.Name,
                movement.UserId,
                User.Identity?.Name ?? "Unknown",
                movement.Change,
                movement.PreviousQuantity,
                movement.NewQuantity,
                movement.Reason,
                movement.Type,
                movement.Timestamp,
                movement.Notes
            );

            return CreatedAtAction(nameof(GetMovement), new { id = movement.Id }, responseDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ CRITICAL ERROR in CreateMovement: {Message}", ex.Message);
            _logger.LogError("Stack trace: {StackTrace}", ex.StackTrace);

            // Return detailed error in development
            return StatusCode(500, new
            {
                message = "Internal server error during movement creation",
                error = ex.Message,
                type = ex.GetType().Name,
                stackTrace = ex.StackTrace
            });
        }
    }

    [HttpGet("movements/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMovement(int id)
    {
        try
        {
            _logger.LogInformation("Retrieving movement with ID: {MovementId}", id);

            var movement = await _context.InventoryMovements
                .Include(m => m.Product)
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (movement == null)
            {
                _logger.LogWarning("Movement not found: {MovementId}", id);
                return NotFound("Movement not found");
            }

            _logger.LogInformation("Movement found: ID={Id}, Product={Product}, User={User}",
                movement.Id, movement.Product?.Name, movement.User?.UserName);

            var movementDto = new InventoryMovementResponseDto(
                movement.Id,
                movement.ProductId,
                movement.Product.Name,
                movement.UserId,
                $"{movement.User.FirstName} {movement.User.LastName}",
                movement.Change,
                movement.PreviousQuantity,
                movement.NewQuantity,
                movement.Reason,
                movement.Type,
                movement.Timestamp,
                movement.Notes
            );

            return Ok(movementDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving movement {MovementId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("movements/product/{productId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMovementsByProductId(int productId)
    {
        try
        {
            _logger.LogInformation("Retrieving movements for product ID: {ProductId}", productId);

            var movements = await _context.InventoryMovements
                .Include(m => m.Product)
                .Include(m => m.User)
                .Where(m => m.ProductId == productId)
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

            _logger.LogInformation("Found {Count} movements for product {ProductId}", movements.Count, productId);

            return Ok(movements);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving movements for product {ProductId}", productId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("movements")]
    public async Task<IActionResult> GetUserMovements()
    {
        try
        {
            // ✅ ENHANCED: Try multiple claim types for user ID extraction
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value
                       ?? User.FindFirst("userId")?.Value
                       ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User not authenticated for GetUserMovements");
                return Unauthorized("User not authenticated");
            }

            _logger.LogInformation("Retrieving movements for user: {UserId}", userId);

            var movements = await _context.InventoryMovements
                .Include(m => m.Product)
                .Include(m => m.User)
                .Where(m => m.UserId == userId)
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

            _logger.LogInformation("Found {Count} movements for user {UserId}", movements.Count, userId);

            return Ok(movements);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user movements");
            return StatusCode(500, "Internal server error");
        }
    }
}


//using InventoryManagement.API.Data;
//using InventoryManagement.API.Dtos;
//using InventoryManagement.API.Models;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using System.Security.Claims;

//namespace InventoryManagement.API.Controllers;

//[ApiController]
//[Route("api/[controller]")]
//[Authorize(Roles = "Staff,Manager,Admin")]
//public class StaffController : ControllerBase
//{
//    private readonly ApplicationDbContext _context;

//    public StaffController(ApplicationDbContext context)
//    {
//        _context = context;
//    }

//    [HttpPost("movements")]
//    public async Task<IActionResult> CreateMovement(InventoryMovementCreateDto dto)
//    {
//        var product = await _context.Products.FindAsync(dto.ProductId);
//        if (product == null)
//        {
//            return NotFound("Product not found");
//        }

//        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
//        var previousQuantity = product.Quantity;
//        var newQuantity = previousQuantity + dto.Change;

//        // Validate that the stock won't go negative
//        if (newQuantity < 0)
//        {
//            return BadRequest("Insufficient stock. Cannot reduce quantity below zero.");
//        }

//        var movement = new InventoryMovement
//        {
//            ProductId = dto.ProductId,
//            UserId = userId,
//            Change = dto.Change,
//            PreviousQuantity = previousQuantity,
//            NewQuantity = newQuantity,
//            Reason = dto.Reason,
//            Type = dto.Type,
//            Notes = dto.Notes
//        };

//        // Update product quantity
//        product.Quantity = newQuantity;
//        product.UpdatedAt = DateTime.UtcNow;

//        _context.InventoryMovements.Add(movement);
//        await _context.SaveChangesAsync();

//        var movementDto = new InventoryMovementResponseDto(
//            movement.Id,
//            movement.ProductId,
//            product.Name,
//            movement.UserId,
//            User.Identity!.Name!,
//            movement.Change,
//            movement.PreviousQuantity,
//            movement.NewQuantity,
//            movement.Reason,
//            movement.Type,
//            movement.Timestamp,
//            movement.Notes
//        );

//        return CreatedAtAction(nameof(GetMovement), new { id = movement.Id }, movementDto);
//    }

//    [HttpGet("movements/{id}")]
//    [AllowAnonymous]
//    public async Task<IActionResult> GetMovement(int id)
//    {
//        var movement = await _context.InventoryMovements
//            .Include(m => m.Product)
//            .Include(m => m.User)
//            .FirstOrDefaultAsync(m => m.Id == id);

//        if (movement == null)
//        {
//            return NotFound("Movement not found");
//        }

//        var movementDto = new InventoryMovementResponseDto(
//            movement.Id,
//            movement.ProductId,
//            movement.Product.Name,
//            movement.UserId,
//            $"{movement.User.FirstName} {movement.User.LastName}",
//            movement.Change,
//            movement.PreviousQuantity,
//            movement.NewQuantity,
//            movement.Reason,
//            movement.Type,
//            movement.Timestamp,
//            movement.Notes
//        );

//        return Ok(movementDto);
//    }
//    [HttpGet("movements/product/{productId}")]
//    [AllowAnonymous]
//    public async Task<IActionResult> GetMovementsByProductId(int productId)
//    {
//        try
//        {
//            var movements = await _context.InventoryMovements
//                .Include(m => m.Product)
//                .Include(m => m.User)
//                .Where(m => m.ProductId == productId) // Filter by productId
//                .OrderByDescending(m => m.Timestamp)
//                .Select(m => new InventoryMovementResponseDto(
//                    m.Id,
//                    m.ProductId,
//                    m.Product.Name,
//                    m.UserId,
//                    $"{m.User.FirstName} {m.User.LastName}",
//                    m.Change,
//                    m.PreviousQuantity,
//                    m.NewQuantity,
//                    m.Reason,
//                    m.Type,
//                    m.Timestamp,
//                    m.Notes
//                ))
//                .ToListAsync();

//            return Ok(movements);
//        }
//        catch (Exception ex)
//        {
//            return StatusCode(500, "Internal server error");
//        }
//    }

//    [HttpGet("movements")]
//    public async Task<IActionResult> GetUserMovements()
//    {
//        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;

//        var movements = await _context.InventoryMovements
//            .Include(m => m.Product)
//            .Include(m => m.User)
//            .Where(m => m.UserId == userId)
//            .OrderByDescending(m => m.Timestamp)
//            .Select(m => new InventoryMovementResponseDto(
//                m.Id,
//                m.ProductId,
//                m.Product.Name,
//                m.UserId,
//                $"{m.User.FirstName} {m.User.LastName}",
//                m.Change,
//                m.PreviousQuantity,
//                m.NewQuantity,
//                m.Reason,
//                m.Type,
//                m.Timestamp,
//                m.Notes
//            ))
//            .ToListAsync();

//        return Ok(movements);
//    }
//}



//using InventoryManagement.API.Data;
//using InventoryManagement.API.Dtos;
//using InventoryManagement.API.Models;
//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using System.Linq;
//using System.Security.Claims;

//namespace InventoryManagement.API.Controllers;

//[ApiController]
//[Route("api/[controller]")]
//[Authorize(Roles = "Staff,Manager,Admin")]
//public class StaffController : ControllerBase
//{
//    private readonly ApplicationDbContext _context;

//    public StaffController(ApplicationDbContext context)
//    {
//        _context = context;
//    }

//    [HttpPost("movements")]
//    public async Task<IActionResult> CreateMovement(InventoryMovementCreateDto dto)
//    {
//        var product = await _context.Products.FindAsync(dto.ProductId);
//        if (product == null)
//        {
//            return NotFound("Product not found");
//        }

//        // Validate the movement type by casting int to enum
//        if (!Enum.IsDefined(typeof(MovementType), dto.Type))
//        {
//            return BadRequest("Invalid movement type");
//        }

//        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
//        var previousQuantity = product.Quantity;
//        int newQuantity = previousQuantity;

//        // Cast int to MovementType enum for switch statement
//        var movementType = (MovementType)dto.Type;

//        // Calculate new quantity based on movement type
//        switch (movementType)
//        {
//            case MovementType.StockIn: // Stock In - ADD quantity
//                newQuantity = previousQuantity + dto.Change;
//                break;

//            case MovementType.StockOut: // Stock Out - SUBTRACT quantity
//                newQuantity = previousQuantity - dto.Change;
//                if (newQuantity < 0)
//                {
//                    return BadRequest("Insufficient stock. Cannot reduce quantity below zero.");
//                }
//                break;

//            case MovementType.Adjustment: // Adjustment - SET to exact quantity
//                newQuantity = dto.Change;
//                break;

//            case MovementType.Sale: // Sale - SUBTRACT quantity
//                newQuantity = previousQuantity - dto.Change;
//                if (newQuantity < 0)
//                {
//                    return BadRequest("Insufficient stock for sale.");
//                }
//                break;

//            case MovementType.Return: // Return - ADD quantity
//                newQuantity = previousQuantity + dto.Change;
//                break;

//            case MovementType.Damage: // Damage - SUBTRACT quantity
//                newQuantity = previousQuantity - dto.Change;
//                if (newQuantity < 0)
//                {
//                    newQuantity = 0; // Set to 0 if damage exceeds current stock
//                }
//                break;

//            default:
//                return BadRequest("Invalid movement type");
//        }

//        // Create the movement record - cast int back to enum
//        var movement = new InventoryMovement
//        {
//            ProductId = dto.ProductId,
//            UserId = userId,
//            Change = dto.Change,
//            PreviousQuantity = previousQuantity,
//            NewQuantity = newQuantity,
//            Reason = dto.Reason,
//            Type = (MovementType)dto.Type, // Cast int to enum
//            Notes = dto.Notes,
//            Timestamp = DateTime.UtcNow
//        };

//        // Update the product quantity and timestamp
//        product.Quantity = newQuantity;
//        product.UpdatedAt = DateTime.UtcNow;

//        _context.InventoryMovements.Add(movement);
//        await _context.SaveChangesAsync();

//        var movementDto = new InventoryMovementResponseDto(
//            movement.Id,
//            movement.ProductId,
//            product.Name,
//            movement.UserId,
//            User.Identity!.Name!,
//            movement.Change,
//            movement.PreviousQuantity,
//            movement.NewQuantity,
//            movement.Reason,
//            movement.Type, // Cast enum back to int for DTO
//            movement.Timestamp,
//            movement.Notes
//        );

//        return CreatedAtAction(nameof(GetMovement), new { id = movement.Id }, movementDto);
//    }

//    [HttpGet("movements/{id}")]
//    //[AllowAnonymous]
//    public async Task<IActionResult> GetMovement(int id)
//    {
//        var movement = await _context.InventoryMovements
//            .Include(m => m.Product)
//            .Include(m => m.User)
//            .FirstOrDefaultAsync(m => m.Id == id);

//        if (movement == null)
//        {
//            return NotFound("Movement not found");
//        }

//        var movementDto = new InventoryMovementResponseDto(
//            movement.Id,
//            movement.ProductId,
//            movement.Product.Name,
//            movement.UserId,
//            $"{movement.User.FirstName} {movement.User.LastName}",
//            movement.Change,
//            movement.PreviousQuantity,
//            movement.NewQuantity,
//            movement.Reason,
//            movement.Type, // Cast enum to int for DTO
//            movement.Timestamp,
//            movement.Notes
//        );

//        return Ok(movementDto);
//    }

//    [HttpGet("movements/product/{productId}")]
//    //[AllowAnonymous]
//    public async Task<IActionResult> GetMovementsByProductId(int productId)
//    {
//        try
//        {
//            var movements = await _context.InventoryMovements
//                .Include(m => m.Product)
//                .Include(m => m.User)
//                .Where(m => m.ProductId == productId)
//                .OrderByDescending(m => m.Timestamp)
//                .Select(m => new InventoryMovementResponseDto(
//                    m.Id,
//                    m.ProductId,
//                    m.Product.Name,
//                    m.UserId,
//                    $"{m.User.FirstName} {m.User.LastName}",
//                    m.Change,
//                    m.PreviousQuantity,
//                    m.NewQuantity,
//                    m.Reason,
//                    m.Type, // Cast enum to int for DTO
//                    m.Timestamp,
//                    m.Notes
//                ))
//                .ToListAsync();

//            return Ok(movements);
//        }
//        catch (Exception ex)
//        {
//            return StatusCode(500, "Internal server error");
//        }
//    }

//    [HttpGet("movements")]
//    public async Task<IActionResult> GetUserMovements()
//    {
//        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;

//        var movements = await _context.InventoryMovements
//            .Include(m => m.Product)
//            .Include(m => m.User)
//            .Where(m => m.UserId == userId)
//            .OrderByDescending(m => m.Timestamp)
//            .Select(m => new InventoryMovementResponseDto(
//                m.Id,
//                m.ProductId,
//                m.Product.Name,
//                m.UserId,
//                $"{m.User.FirstName} {m.User.LastName}",
//                m.Change,
//                m.PreviousQuantity,
//                m.NewQuantity,
//                m.Reason,
//                m.Type, // Cast enum to int for DTO
//                m.Timestamp,
//                m.Notes
//            ))
//            .ToListAsync();

//        return Ok(movements);
//    }
//    [HttpGet("all-movements")]
//    [Authorize(Roles = "Manager,Admin")] // Only Manager and Admin can see all movements
//    public async Task<IActionResult> GetAllMovements()
//    {
//        try
//        {
//            var movements = await _context.InventoryMovements
//                .Include(m => m.Product)
//                .Include(m => m.User)
//                .OrderByDescending(m => m.Timestamp)
//                .Select(m => new InventoryMovementResponseDto(
//                    m.Id,
//                    m.ProductId,
//                    m.Product.Name,
//                    m.UserId,
//                    $"{m.User.FirstName} {m.User.LastName}",
//                    m.Change,
//                    m.PreviousQuantity,
//                    m.NewQuantity,
//                    m.Reason,
//                    m.Type,
//                    m.Timestamp,
//                    m.Notes
//                ))
//                .ToListAsync();

//            return Ok(movements);
//        }
//        catch (Exception ex)
//        {
//            return StatusCode(500, "Internal server error");
//        }
//    }
//}
