from __future__ import annotations

from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field, conint, confloat


class JobRequest(BaseModel):
    n: conint(ge=1) = Field(..., description="Upper bound of the inclusive range to sum.")
    chunks: conint(ge=1, le=1024) = Field(
        ..., description="Number of parallel tasks to split the computation into."
    )


class JobCreated(BaseModel):
    job_id: str = Field(..., description="Identifier that can be used to poll job status.")
    status: str = Field(..., description="Initial status of the job.")
    cached: bool = Field(False, description="Whether result was returned from cache.")
    result: Optional[int] = Field(None, description="Result if cached.")


class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: confloat(ge=0.0, le=1.0) = Field(..., description="Percent complete expressed as 0-1.")
    completed_chunks: int = Field(..., ge=0)
    total_chunks: int = Field(..., ge=1)
    result: Optional[int] = Field(
        None, description="Final aggregated result once the job succeeds."
    )
    detail: Optional[str] = Field(None, description="Additional context about the job state.")
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    is_cached: bool = False
