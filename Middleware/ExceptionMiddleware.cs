using System.Net;
using System.Text.Json;

namespace KSSMCS.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            // Log the full exception for developers
            _logger.LogError(ex,
                "Unhandled exception on {Method} {Path}",
                context.Request.Method,
                context.Request.Path);

            // Prepare the clean response for the client
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        // Map known exception types to appropriate status codes
        var (statusCode, message) = ex switch
        {
            ArgumentException argEx => ((int)HttpStatusCode.BadRequest, argEx.Message),
            UnauthorizedAccessException => ((int)HttpStatusCode.Unauthorized, "You are not authorized to perform this action."),
            KeyNotFoundException => ((int)HttpStatusCode.NotFound, "The requested resource was not found."),
            InvalidOperationException invalidEx => ((int)HttpStatusCode.Conflict, invalidEx.Message),
            _ => ((int)HttpStatusCode.InternalServerError,
                  "An unexpected error occurred. Please try again later.")
        };

        context.Response.StatusCode = statusCode;

        var response = new
        {
            statusCode,
            message,
            timestamp = DateTime.UtcNow,
            // Only include technical details in Development
            details = _env.IsDevelopment() ? ex.ToString() : null,
            traceId = context.TraceIdentifier
        };

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}