import hashlib
from fastapi import Request
from fastapi.responses import Response as FastAPIResponse

async def etag_middleware(request: Request, call_next):
    """
    HTTP ETag & 304 Not Modified Middleware.
    Computes an MD5 checksum of response content for GET 200 responses.
    If the client sends a matching If-None-Match header, returns a 304 Not Modified response (0 body bytes).
    Bypassed when Cache-Control header contains 'no-store'.
    """
    response = await call_next(request)
    if request.method == "GET" and response.status_code == 200:
        cache_control = response.headers.get("cache-control", "")
        if "no-store" in cache_control:
            return response

        body = b"".join([chunk async for chunk in response.body_iterator])
        etag = f'"{hashlib.md5(body).hexdigest()}"'
        
        # Check If-None-Match header from client
        if_none_match = request.headers.get("if-none-match")
        if if_none_match and if_none_match == etag:
            res_headers = dict(response.headers)
            res_headers["ETag"] = etag
            return FastAPIResponse(status_code=304, headers=res_headers)

        res_headers = dict(response.headers)
        res_headers["ETag"] = etag
        return FastAPIResponse(
            content=body,
            status_code=response.status_code,
            headers=res_headers,
            media_type=response.media_type
        )
    return response
