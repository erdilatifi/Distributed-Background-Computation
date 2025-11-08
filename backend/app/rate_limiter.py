"""
P0 & P3: In-memory token bucket rate limiter for per-IP quotas.

This module implements a token bucket algorithm for rate limiting without
requiring a database. Suitable for demo environments to prevent abuse.
"""
from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass, field
from threading import Lock
from typing import Dict, Tuple


@dataclass
class TokenBucket:
    """Token bucket for rate limiting with automatic refill."""
    capacity: int  # Maximum tokens
    tokens: float  # Current tokens
    refill_rate: float  # Tokens per second
    last_refill: float = field(default_factory=time.time)
    
    def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens. Returns True if successful, False if insufficient tokens.
        
        Args:
            tokens: Number of tokens to consume
            
        Returns:
            True if tokens were consumed, False otherwise
        """
        self._refill()
        
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False
    
    def _refill(self) -> None:
        """Refill tokens based on elapsed time since last refill."""
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now
    
    def time_until_available(self, tokens: int = 1) -> float:
        """
        Calculate time in seconds until requested tokens will be available.
        
        Args:
            tokens: Number of tokens needed
            
        Returns:
            Seconds until tokens are available (0 if already available)
        """
        self._refill()
        
        if self.tokens >= tokens:
            return 0.0
        
        needed = tokens - self.tokens
        return needed / self.refill_rate


class InMemoryRateLimiter:
    """
    In-memory rate limiter using token bucket algorithm.
    
    Thread-safe implementation for per-IP rate limiting.
    Automatically cleans up old entries to prevent memory leaks.
    """
    
    def __init__(
        self,
        requests_per_minute: int = 10,
        cleanup_interval: int = 600  # 10 minutes
    ):
        """
        Initialize rate limiter.
        
        Args:
            requests_per_minute: Maximum requests allowed per minute per IP
            cleanup_interval: Seconds between cleanup of stale entries
        """
        self.capacity = requests_per_minute
        self.refill_rate = requests_per_minute / 60.0  # tokens per second
        self.buckets: Dict[str, TokenBucket] = {}
        self.lock = Lock()
        self.last_cleanup = time.time()
        self.cleanup_interval = cleanup_interval
    
    def check_rate_limit(self, ip_address: str) -> Tuple[bool, float]:
        """
        Check if request from IP should be allowed.
        
        Args:
            ip_address: Client IP address
            
        Returns:
            Tuple of (allowed: bool, retry_after: float)
            - allowed: True if request is allowed
            - retry_after: Seconds to wait before retrying (0 if allowed)
        """
        with self.lock:
            # Periodic cleanup
            if time.time() - self.last_cleanup > self.cleanup_interval:
                self._cleanup_stale_buckets()
            
            # Get or create bucket for this IP
            if ip_address not in self.buckets:
                self.buckets[ip_address] = TokenBucket(
                    capacity=self.capacity,
                    tokens=self.capacity,
                    refill_rate=self.refill_rate
                )
            
            bucket = self.buckets[ip_address]
            
            # Try to consume a token
            if bucket.consume(1):
                return True, 0.0
            else:
                retry_after = bucket.time_until_available(1)
                return False, retry_after
    
    def _cleanup_stale_buckets(self) -> None:
        """Remove buckets that are at full capacity (inactive IPs)."""
        stale_ips = [
            ip for ip, bucket in self.buckets.items()
            if bucket.tokens >= bucket.capacity
        ]
        
        for ip in stale_ips:
            del self.buckets[ip]
        
        self.last_cleanup = time.time()
        
        if stale_ips:
            print(f"Cleaned up {len(stale_ips)} stale rate limit buckets")
    
    def get_stats(self) -> Dict[str, any]:
        """Get current rate limiter statistics."""
        with self.lock:
            return {
                "active_ips": len(self.buckets),
                "capacity": self.capacity,
                "refill_rate_per_second": self.refill_rate,
                "last_cleanup": self.last_cleanup
            }


# Global rate limiter instance
_rate_limiter: InMemoryRateLimiter | None = None


def get_rate_limiter(requests_per_minute: int = 10) -> InMemoryRateLimiter:
    """Get or create the global rate limiter instance."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = InMemoryRateLimiter(requests_per_minute=requests_per_minute)
    return _rate_limiter
