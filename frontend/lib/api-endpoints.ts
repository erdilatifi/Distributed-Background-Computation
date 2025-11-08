/**
 * API Endpoint Constants
 * 
 * Centralized repository of all API endpoint paths to ensure consistency
 * across the application. All endpoints follow RESTful conventions and
 * include proper versioning.
 * 
 * @module api-endpoints
 * @since 2.0.0
 */

/**
 * Current API version prefix
 * @constant
 */
export const API_VERSION = 'v1';

/**
 * API endpoint constants organized by functional area
 * @constant
 */
export const ENDPOINTS = {
  /**
   * Health & Monitoring endpoints
   */
  HEALTH: '/healthz',
  METRICS: '/metrics',
  MONITORING_HEALTH: '/monitoring/health',
  MONITORING_READY: '/monitoring/ready',
  MONITORING_STATS: '/monitoring/stats',

  /**
   * Authenticated job management endpoints
   */
  JOBS: `/v1/jobs`,
  JOB_BY_ID: (id: string) => `/v1/jobs/${id}`,
  JOB_EVENTS: (id: string) => `/v1/jobs/${id}/events`,
  JOB_CANCEL: (id: string) => `/v1/jobs/${id}`,

  /**
   * Public demo endpoints (no authentication required)
   */
  DEMO_JOBS: `/v1/jobs/demo`,
  DEMO_JOB_BY_ID: (id: string) => `/v1/jobs/demo/${id}`,

  /**
   * User profile and statistics endpoints
   */
  USER_ME: `/v1/me`,
  USER_STATS: `/v1/me/stats`,

  /**
   * Cache management endpoints
   */
  CACHE_STATS: `/v1/cache/stats`,

  /**
   * WebSocket endpoints for real-time updates
   */
  WS_JOB: (id: string) => `/v1/ws/${id}`,
} as const;

/**
 * Constructs the full API URL by combining the base URL with an endpoint path
 * 
 * @param endpoint - The endpoint path (e.g., '/v1/jobs' or ENDPOINTS.JOBS)
 * @returns The complete URL including protocol, domain, and path
 * 
 * @example
 * ```typescript
 * const url = getApiUrl(ENDPOINTS.JOBS);
 * // Returns: 'http://localhost:8000/v1/jobs'
 * ```
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${baseUrl}${endpoint}`;
}

/**
 * Validates that all job-related endpoints use the correct API version prefix
 * 
 * @returns Object containing validation status and any error messages
 * @returns {boolean} valid - True if all endpoints are correctly versioned
 * @returns {string[]} errors - Array of error messages for invalid endpoints
 * 
 * @example
 * ```typescript
 * const { valid, errors } = validateEndpoints();
 * if (!valid) {
 *   console.error('Invalid endpoints:', errors);
 * }
 * ```
 */
export function validateEndpoints(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check that all job-related endpoints start with /v1
  Object.entries(ENDPOINTS).forEach(([key, value]) => {
    if (key.includes('JOB') || key.includes('USER') || key.includes('CACHE')) {
      const endpoint = typeof value === 'function' ? value('test-id') : value;
      if (!endpoint.startsWith(`/${API_VERSION}/`)) {
        errors.push(`${key}: ${endpoint} does not start with /${API_VERSION}/`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Type definition for all available endpoint keys
 * Provides type safety when referencing endpoint names
 * 
 * @example
 * ```typescript
 * const endpointName: EndpointKey = 'JOBS';
 * const url = getApiUrl(ENDPOINTS[endpointName]);
 * ```
 */
export type EndpointKey = keyof typeof ENDPOINTS;
