import { Snowflake } from 'discord-api-types/globals';
import { RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10';

/**
 * Represents a user object returned from OAuth2
 */
export interface OAuthUser {
	/** User's unique ID */
	id: Snowflake;
	/** User's username */
	username: string;
	/** User's discriminator */
	discriminator: string;
	/** User's email (requires email scope) */
	email?: string | null;
	/** User's avatar hash */
	avatar: string | null;
	/** User's banner hash */
	banner: string | null;
	/** User's banner color as hex string */
	banner_color: string | null;
	/** User's accent color as integer */
	accent_color: number | null;
	/** User's avatar decoration hash */
	avatar_decoration: string | null;
	/** User's chosen language option */
	locale: string;
	/** Whether the user has two-factor authentication enabled */
	mfa_enabled: boolean;
	/** The type of Nitro subscription */
	premium_type?: number | null;
	/** Public flags on the user's account */
	public_flags: number;
	/** Access token data (internal use) */
	access_token: RESTPostOAuth2AccessTokenResult;
}