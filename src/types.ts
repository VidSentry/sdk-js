/**
 * VidSentry SDK Types
 */

/** SDK Configuration */
export interface VidSentryConfig {
    /** API Key (starts with vs_live_ or vs_test_) */
    apiKey: string;
    /** Base URL for API (defaults to production) */
    baseUrl?: string;
    /** Request timeout in ms (default: 30000) */
    timeout?: number;
    /** Enable debug logging */
    debug?: boolean;
}

/** Moderation request options */
export interface ModerateOptions {
    /** URL of video to moderate */
    videoUrl?: string;
    /** GCS URI (gs://bucket/path) */
    gcsUri?: string;
    /** File path in Supabase storage */
    filePath?: string;
    /** Video title for tracking */
    title?: string;
    /** Tier: 'standard' (visual only) or 'premium' (visual + audio) */
    tier?: 'standard' | 'premium';
    /** Moderation settings */
    settings?: ModerationSettings;
}

/** Moderation settings */
export interface ModerationSettings {
    /** Enable visual blur for detected content */
    blur?: boolean;
    /** Enable audio muting for hate speech */
    mute?: boolean;
    /** Sensitivity (0-100, higher = more strict) */
    visualSensitivity?: number;
    audioSensitivity?: number;
}

/** Moderation result */
export interface ModerateResult {
    /** Whether the request was accepted */
    success: boolean;
    /** Video ID in VidSentry database */
    videoId: string;
    /** Moderation job ID */
    jobId: string;
    /** Processing tier used */
    tier: 'standard' | 'premium';
    /** Estimated cost in ZAR */
    estimatedCost: number;
    /** Message from server */
    message?: string;
}

/** Job status */
export type JobStatus =
    | 'pending'
    | 'processing'
    | 'moderated'
    | 'blurred'
    | 'error'
    | 'cancelled';

/** Job details */
export interface JobDetails {
    /** Job ID */
    id: string;
    /** Video ID */
    videoId: string;
    /** Current status */
    status: JobStatus;
    /** Original video URL */
    originalUrl: string;
    /** Moderated video URL (if completed) */
    moderatedUrl?: string;
    /** Detected issues */
    detections?: Detection[];
    /** Gemini context analysis */
    geminiAnalysis?: GeminiAnalysis;
    /** Error message (if failed) */
    errorMessage?: string;
    /** Processing started timestamp */
    processingStartedAt?: string;
    /** Processing completed timestamp */
    processingCompletedAt?: string;
    /** Created timestamp */
    createdAt: string;
}

/** Detection result */
export interface Detection {
    type: 'visual' | 'audio';
    category: string;
    confidence: number;
    timestamp?: number;
    duration?: number;
    details?: Record<string, unknown>;
}

/** Gemini analysis result */
export interface GeminiAnalysis {
    videoDescription?: string;
    setting?: string;
    contentCategories?: string[];
    culturalContext?: string;
    isCulturalContent?: boolean;
    regionDetected?: string;
    safetyScores?: {
        violence: number;
        nudity: number;
        hateSymbols: number;
        dangerousActivities: number;
        overallRisk: number;
    };
    isSafe?: boolean;
    safetyReasons?: string[];
    summary?: string;
}

/** Signed URL result */
export interface SignedUrlResult {
    url: string;
    expiresAt: string;
}

/** API Error */
export interface VidSentryError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
