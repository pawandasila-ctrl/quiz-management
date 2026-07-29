from fastapi import Request

async def security_headers_middleware(request: Request, call_next):
    """
    Applies security headers across all incoming HTTP responses.
    Includes X-Frame-Options, X-Content-Type-Options, HSTS, XSS protection, and CSP.
    """
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response
