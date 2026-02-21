// Per-endpoint rate limits tuned for abuse resistance and normal usage.
export const loginRateLimit = { max: 5, timeWindow: "1 minute" };
export const inviteRateLimit = { max: 3, timeWindow: "1 minute" };
export const shareRateLimit = { max: 30, timeWindow: "1 minute" };
