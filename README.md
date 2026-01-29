# @vidsentry/sdk

Official VidSentry SDK for video content moderation with African cultural awareness.

## Installation

```bash
npm install @vidsentry/sdk
# or
yarn add @vidsentry/sdk
# or
pnpm add @vidsentry/sdk
```

## Quick Start

```typescript
import { VidSentry } from '@vidsentry/sdk';

// Initialize the client
const client = new VidSentry({
  apiKey: 'vs_live_your_api_key',
});

// Moderate a video
const result = await client.moderate({
  videoUrl: 'https://example.com/video.mp4',
  tier: 'premium', // 'standard' (visual only) or 'premium' (visual + audio)
  settings: {
    blur: true,
    mute: true,
  },
});

console.log('Job ID:', result.jobId);

// Wait for completion
const job = await client.waitForCompletion(result.jobId);

if (job.status === 'moderated') {
  console.log('Video is safe!');
} else if (job.status === 'blurred') {
  console.log('Moderated video:', job.moderatedUrl);
}
```

## API Reference

### `new VidSentry(config)`

Create a new VidSentry client.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | *required* | Your API key (starts with `vs_live_` or `vs_test_`) |
| `baseUrl` | `string` | Production URL | API base URL |
| `timeout` | `number` | `30000` | Request timeout in ms |
| `debug` | `boolean` | `false` | Enable debug logging |

### `client.moderate(options)`

Submit a video for moderation.

```typescript
const result = await client.moderate({
  videoUrl: 'https://...',     // Direct video URL
  // OR
  gcsUri: 'gs://bucket/path',  // Google Cloud Storage URI
  // OR
  filePath: 'uploads/video.mp4', // Path in VidSentry storage
  
  title: 'My Video',            // Optional title
  tier: 'premium',              // 'standard' or 'premium'
  settings: {
    blur: true,                 // Blur detected content
    mute: true,                 // Mute hate speech
    visualSensitivity: 70,      // 0-100
    audioSensitivity: 70,
  },
});
```

Returns:
```typescript
{
  success: true,
  videoId: 'uuid',
  jobId: 'uuid',
  tier: 'premium',
  estimatedCost: 3.50,
}
```

### `client.getJobStatus(jobId)`

Get the current status of a moderation job.

```typescript
const job = await client.getJobStatus('job-uuid');

console.log(job.status); // 'pending' | 'processing' | 'moderated' | 'blurred' | 'error'
```

### `client.waitForCompletion(jobId, options?)`

Poll until a job completes.

```typescript
const job = await client.waitForCompletion('job-uuid', {
  maxWait: 300000,      // Max 5 minutes
  pollInterval: 5000,   // Check every 5 seconds
});
```

### `client.getSignedUrl(videoId)`

Get a signed URL for a video.

```typescript
const { url, expiresAt } = await client.getSignedUrl('video-uuid');
```

## Error Handling

```typescript
import { 
  VidSentry, 
  AuthenticationError, 
  InsufficientFundsError,
  RateLimitError 
} from '@vidsentry/sdk';

try {
  await client.moderate({ videoUrl: '...' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof InsufficientFundsError) {
    console.error(`Need R${error.required}, have R${error.available}`);
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited, retry after ${error.retryAfter}s`);
  }
}
```

## Tiers

| Tier | Features | Best For |
|------|----------|----------|
| **Standard** | Visual blur only | Quick checks, low cost |
| **Premium** | Visual + Audio analysis | Full hate speech detection |

## Support

- 📧 Email: support@vidsentry.com
- 📄 Docs: https://docs.vidsentry.com
- 🐛 Issues: https://github.com/vidsentry/sdk-js/issues

## License

MIT
