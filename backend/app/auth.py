"""
Authentication and authorization utilities
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .supabase_client import verify_supabase_token, get_user_profile, check_rate_limit, log_audit_event


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify JWT token and return authenticated user.
    Raises 401 if token is invalid.
    """
    token = credentials.credentials
    user = await verify_supabase_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Get current user and verify they are active.
    Also loads user profile data.
    """
    # Get user profile
    profile = await get_user_profile(current_user["id"])
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Merge user auth data with profile
    current_user["profile"] = profile
    return current_user


async def check_user_rate_limit(
    request: Request,
    current_user: dict = Depends(get_current_user),
    max_requests: int = 100
) -> dict:
    """
    Check rate limit for current user and endpoint.
    Raises 429 if limit exceeded.
    """
    endpoint = request.url.path
    user_id = current_user["id"]
    
    is_allowed, remaining = await check_rate_limit(user_id, endpoint, max_requests)
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again later.",
            headers={"X-RateLimit-Remaining": "0"}
        )
    
    # Add rate limit info to response headers
    request.state.rate_limit_remaining = remaining
    return current_user


async def check_job_quota(
    current_user: dict = Depends(get_current_active_user)
) -> dict:
    """
    Check if user has remaining job quota.
    Raises 403 if quota exceeded.
    """
    profile = current_user.get("profile", {})
    jobs_today = profile.get("jobs_today", 0)
    job_quota = profile.get("job_quota", 100)
    is_premium = profile.get("is_premium", False)
    
    # Premium users have unlimited quota
    if is_premium:
        return current_user
    
    if jobs_today >= job_quota:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Daily job quota exceeded ({job_quota} jobs/day). Upgrade to premium for unlimited jobs.",
            headers={"X-Quota-Remaining": "0"}
        )
    
    return current_user


class OptionalAuth:
    """
    Optional authentication - returns user if authenticated, None otherwise.
    Useful for endpoints that work with or without auth.
    """
    async def __call__(
        self,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
    ) -> Optional[dict]:
        if not credentials:
            return None
        
        try:
            user = await verify_supabase_token(credentials.credentials)
            return user
        except Exception:
            return None


# Dependency instances
optional_auth = OptionalAuth()


async def log_user_action(
    action: str,
    resource_type: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
    resource_id: Optional[str] = None,
    job_id: Optional[str] = None,
    details: Optional[dict] = None
):
    """Log user action for audit trail"""
    await log_audit_event(
        user_id=current_user["id"],
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        job_id=job_id,
        details=details,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
