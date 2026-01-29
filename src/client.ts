/**
 * VidSentry SDK - Main Client
 * 
 * @example
 * ```typescript
 * import { VidSentry } from '@vidsentry/sdk';
 * 
 * const client = new VidSentry({ apiKey: 'vs_live_...' });
 * 
 * // Moderate a video
 * const result = await client.moderate({
 *   videoUrl: 'https://example.com/video.mp4',
 *   tier: 'premium'
 * });
 * 
 * // Check status
 * const status = await client.getJobStatus(result.jobId);
 * ```
 */

import type {
    VidSentryConfig,
    ModerateOptions,
    ModerateResult,
    JobDetails,
    SignedUrlResult,
} from './types.js';

import {
    VidSentryError,
    AuthenticationError,
    RateLimitError,
    InsufficientFundsError,
    NotFoundError,
    TimeoutError,
    NetworkError,
} from './errors.js';

const DEFAULT_BASE_URL = 'https://cyzacqndakvnxhohmbgx.supabase.co';
const DEFAULT_TIMEOUT = 30000;

export class VidSentry {
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly timeout: number;
    private readonly debug: boolean;

    constructor(config: VidSentryConfig) {
        if (!config.apiKey) {
            throw new AuthenticationError('API key is required');
        }

        if (!config.apiKey.startsWith('vs_')) {
            throw new AuthenticationError('Invalid API key format. Keys should start with vs_live_ or vs_test_');
        }

        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
        this.timeout = config.timeout || DEFAULT_TIMEOUT;
        this.debug = config.debug || false;
    }

    /**
     * Moderate a video for content safety
     * 
     * @param options - Moderation options
     * @returns Moderation job details
     */
    async moderate(options: ModerateOptions): Promise<ModerateResult> {
        if (!options.videoUrl && !options.gcsUri && !options.filePath) {
            throw new VidSentryError(
                'One of videoUrl, gcsUri, or filePath is required',
                'VALIDATION_ERROR'
            );
        }

        const response = await this.request<ModerateResult>(
            '/functions/v1/unified-moderate',
            {
                method: 'POST',
                body: {
                    title: options.title || 'SDK Upload',
                    videoUrl: options.videoUrl,
                    gcsUri: options.gcsUri,
                    filePath: options.filePath,
                    tier: options.tier || 'standard',
                    settings: options.settings || { blur: true, mute: true },
                },
            }
        );

        return response;
    }

    /**
     * Get the status of a moderation job
     * 
     * @param jobId - The job ID returned from moderate()
     * @returns Job details including status and results
     */
    async getJobStatus(jobId: string): Promise<JobDetails> {
        const response = await this.request<JobDetails[]>(
            `/rest/v1/moderation_jobs?id=eq.${jobId}&select=*`,
            { method: 'GET' }
        );

        if (!response || response.length === 0) {
            throw new NotFoundError('Job', jobId);
        }

        const job = response[0];

        return {
            id: job.id,
            videoId: (job as any).video_id,
            status: job.status,
            originalUrl: (job as any).original_url,
            moderatedUrl: (job as any).moderated_url,
            detections: (job as any).detections,
            geminiAnalysis: (job as any).gemini_analysis,
            errorMessage: (job as any).error_msg,
            processingStartedAt: (job as any).processing_started_at,
            processingCompletedAt: (job as any).processing_completed_at,
            createdAt: (job as any).created_at,
        };
    }

    /**
     * Poll for job completion
     * 
     * @param jobId - The job ID to poll
     * @param options - Polling options
     * @returns Completed job details
     */
    async waitForCompletion(
        jobId: string,
        options: { maxWait?: number; pollInterval?: number } = {}
    ): Promise<JobDetails> {
        const maxWait = options.maxWait || 300000; // 5 minutes
        const pollInterval = options.pollInterval || 5000; // 5 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            const job = await this.getJobStatus(jobId);

            if (['moderated', 'blurred', 'error', 'cancelled'].includes(job.status)) {
                return job;
            }

            await this.sleep(pollInterval);
        }

        throw new TimeoutError(`Job ${jobId} did not complete within ${maxWait / 1000} seconds`);
    }

    /**
     * Get a signed URL for a video
     * 
     * @param videoId - The video ID
     * @returns Signed URL with expiration
     */
    async getSignedUrl(videoId: string): Promise<SignedUrlResult> {
        const response = await this.request<{ signedUrl: string; expiresAt: string }>(
            '/functions/v1/get-signed-video-url',
            {
                method: 'POST',
                body: { videoId },
            }
        );

        return {
            url: response.signedUrl,
            expiresAt: response.expiresAt,
        };
    }

    /**
     * Get public platform metrics
     * 
     * @returns Platform performance metrics
     */
    async getMetrics(): Promise<Record<string, unknown>> {
        return this.request('/functions/v1/public-metrics', { method: 'GET' });
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private async request<T>(
        path: string,
        options: { method: string; body?: Record<string, unknown> }
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            if (this.debug) {
                console.log(`[VidSentry] ${options.method} ${path}`);
            }

            const response = await fetch(url, {
                method: options.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'apikey': this.apiKey, // Supabase also accepts this header
                },
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Handle errors
            if (!response.ok) {
                await this.handleErrorResponse(response);
            }

            return await response.json() as T;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof VidSentryError) {
                throw error;
            }

            if ((error as Error).name === 'AbortError') {
                throw new TimeoutError();
            }

            throw new NetworkError((error as Error).message);
        }
    }

    private async handleErrorResponse(response: Response): Promise<never> {
        let errorData: Record<string, unknown> = {};

        try {
            errorData = await response.json();
        } catch {
            // Response body not JSON
        }

        const message = (errorData.error as string) || response.statusText;

        switch (response.status) {
            case 401:
                throw new AuthenticationError(message);
            case 403:
                throw new AuthenticationError('API key does not have permission for this action');
            case 404:
                throw new NotFoundError('Resource', 'unknown');
            case 429:
                const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
                throw new RateLimitError(message, retryAfter);
            case 402:
                // Payment required - insufficient funds
                const required = (errorData.required as number) || 0;
                const available = (errorData.available as number) || 0;
                throw new InsufficientFundsError(required, available);
            default:
                throw new VidSentryError(message, `HTTP_${response.status}`, errorData);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

