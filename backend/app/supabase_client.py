"""
Supabase client configuration and utilities
"""
from functools import lru_cache
from typing import Optional
from supabase import create_client, Client
from .config import get_settings


@lru_cache()
def get_supabase_service_client() -> Client:
    """
    Get Supabase client with service role key (full access, bypasses RLS).
    Use this for backend operations that need to access all data.
    """
    settings = get_settings()
    return create_client(
        settings.supabase_url,
        settings.supabase_service_key
    )


def get_supabase_user_client(access_token: str) -> Client:
    """
    Get Supabase client for an authenticated user (respects RLS).
    Use this when you want to enforce row-level security.
    """
    settings = get_settings()
    supabase = create_client(
        settings.supabase_url,
        settings.supabase_anon_key
    )
    # Set the user's session
    supabase.auth.set_session(access_token, "")
    return supabase


async def verify_supabase_token(token: str) -> Optional[dict]:
    """
    Verify a Supabase JWT token and return user data.
    Returns None if token is invalid.
    """
    try:
        settings = get_settings()
        # Create a fresh client with anon key for token verification
        supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
        # Get user with the provided JWT token
        response = supabase.auth.get_user(token)
        if response and response.user:
            return {
                "id": response.user.id,
                "email": response.user.email,
                "aud": response.user.aud,
                "role": response.user.role,
                "created_at": str(response.user.created_at) if response.user.created_at else None,
            }
        return None
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None


async def get_user_profile(user_id: str) -> Optional[dict]:
    """Get user profile from Supabase"""
    supabase = get_supabase_service_client()
    try:
        result = supabase.table("user_profiles")\
            .select("*")\
            .eq("id", user_id)\
            .single()\
            .execute()
        return result.data
    except Exception as e:
        print(f"Failed to get user profile: {e}")
        return None


async def check_rate_limit(user_id: str, endpoint: str, max_requests: int = 100) -> tuple[bool, int]:
    """
    Check if user has exceeded rate limit for an endpoint.
    Returns (is_allowed, remaining_requests)
    """
    supabase = get_supabase_service_client()
    
    try:
        # Get or create rate limit record
        result = supabase.rpc(
            'check_rate_limit',
            {
                'p_user_id': user_id,
                'p_endpoint': endpoint,
                'p_max_requests': max_requests
            }
        ).execute()
        
        if result.data:
            return result.data['allowed'], result.data['remaining']
        
        # Fallback: allow if function doesn't exist
        return True, max_requests
    except Exception as e:
        print(f"Rate limit check failed: {e}")
        # Fail open - allow request if rate limit check fails
        return True, max_requests


async def log_audit_event(
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    job_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log an audit event to Supabase"""
    supabase = get_supabase_service_client()
    
    try:
        supabase.table("audit_logs").insert({
            "user_id": user_id,
            "job_id": job_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent
        }).execute()
    except Exception as e:
        print(f"Failed to log audit event: {e}")


async def get_cached_result(n: int, chunks: int) -> Optional[dict]:
    """Check if result is cached"""
    supabase = get_supabase_service_client()
    
    try:
        result = supabase.rpc(
            'get_cached_result',
            {'p_n': n, 'p_chunks': chunks}
        ).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Cache lookup failed: {e}")
        return None


async def save_to_cache(n: int, chunks: int, result: int, computation_time_ms: int):
    """Save computation result to cache"""
    supabase = get_supabase_service_client()
    
    try:
        cache_key = f"{n}_{chunks}"
        supabase.table("job_cache").upsert({
            "cache_key": cache_key,
            "n": n,
            "chunks": chunks,
            "result": result,
            "computation_time_ms": computation_time_ms,
            "last_used_at": "now()",
            "use_count": 1
        }).execute()
    except Exception as e:
        print(f"Failed to save to cache: {e}")
