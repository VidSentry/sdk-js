/**
 * @vidsentry/sdk
 * 
 * Official VidSentry SDK for video content moderation
 * with African cultural awareness
 * 
 * @example
 * ```typescript
 * import { VidSentry } from '@vidsentry/sdk';
 * 
 * const client = new VidSentry({ apiKey: 'vs_live_...' });
 * const result = await client.moderate({ videoUrl: '...' });
 * ```
 */

// Main client
export { VidSentry } from './client.js';

// Types
export type {
    VidSentryConfig,
    ModerateOptions,
    ModerateResult,
    ModerationSettings,
    JobDetails,
    JobStatus,
    Detection,
    GeminiAnalysis,
    SignedUrlResult,
} from './types.js';

// Errors
export {
    VidSentryError,
    AuthenticationError,
    RateLimitError,
    InsufficientFundsError,
    NotFoundError,
    TimeoutError,
    NetworkError,
} from './errors.js';
