/**
 * Options for Discord CDN URLs
 */
export interface CDNOptions {
	/** Image size (any power of two between 16 and 4096) */
	size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
	/** Image format */
	format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif';
}