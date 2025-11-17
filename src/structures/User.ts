import { Snowflake } from 'discord-api-types/globals';
import { APIGuildMember, RESTPostOAuth2AccessTokenResult, Routes } from 'discord-api-types/v10';
import { Oauth } from '@classes/Oauth';
import { OAuthUser } from '../types/OAuthUser';
import { CDNOptions } from '../types/CDNOptions';
import { UserFlags } from '@bitfields/UserFlags';

/**
 * Represents a Discord user from OAuth2
 */
export class User {
	/** OAuth client instance */
	readonly #client: Oauth;
	/** Access token data */
	readonly #accessToken: RESTPostOAuth2AccessTokenResult;

	/** User's unique ID */
	readonly id: Snowflake;
	/** User's username */
	readonly username: string;
	/** User's discriminator */
	readonly discriminator: string;
	/** User's tag (username#discriminator) */
	readonly tag: string;
	/** User's email (if available with email scope) */
	readonly email?: string | null;
	/** User's avatar hash */
	readonly avatarHash: string | null;
	/** User's banner hash */
	readonly bannerHash: string | null;
	/** User's banner color as hex string */
	readonly bannerColor: string | null;
	/** User's accent color as integer */
	readonly accentColor: number | null;
	/** User's avatar decoration hash */
	readonly avatarDecoration: string | null;
	/** User's locale */
	readonly locale: string;
	/** Whether user has MFA enabled */
	readonly mfaEnabled: boolean;
	/** User's Nitro subscription type */
	readonly premiumType?: number | null;
	/** User's public flags as array of flag names */
	readonly publicFlags: string[];

	/**
	 * Creates a new User instance
	 * @param client - OAuth client instance
	 * @param data - Raw user data from Discord API
	 */
	constructor(client: Oauth, data: OAuthUser) {
		this.#client = client;
		this.#accessToken = data.access_token;

		this.id = data.id;
		this.username = data.username;
		this.discriminator = data.discriminator;
		this.tag = `${data.username}#${data.discriminator}`;
		this.email = data.email ?? null;
		this.avatarHash = data.avatar;
		this.bannerHash = data.banner;
		this.bannerColor = data.banner_color;
		this.accentColor = data.accent_color;
		this.avatarDecoration = data.avatar_decoration;
		this.locale = data.locale;
		this.mfaEnabled = data.mfa_enabled;
		this.premiumType = data.premium_type;
		this.publicFlags = new UserFlags(data.public_flags).toArray();
	}

	/**
	 * Gets the user's avatar URL
	 * @param options - CDN options for the URL
	 * @returns The avatar URL or default avatar URL if none exists
	 */
	avatarURL(options?: CDNOptions): string {
		if (!this.avatarHash) {
			return this.defaultAvatarURL(options);
		}
		const format = options?.format ?? 'png';
		const size = options?.size ?? 512;
		return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatarHash}.${format}?size=${size}`;
	}

	/**
	 * Gets the user's banner URL
	 * @param options - CDN options for the URL
	 * @returns The banner URL or null if none exists
	 */
	bannerURL(options?: CDNOptions): string | null {
		if (!this.bannerHash) {
			return null;
		}
		const format = options?.format ?? 'png';
		const size = options?.size ?? 512;
		return `https://cdn.discordapp.com/banners/${this.id}/${this.bannerHash}.${format}?size=${size}`;
	}

	/**
	 * Gets the user's default avatar URL
	 * @param options - CDN options for the URL
	 * @returns The default avatar URL
	 */
	defaultAvatarURL(options?: CDNOptions): string {
		const index = Number(this.discriminator) % 5;
		const size = options?.size ?? 512;
		return `https://cdn.discordapp.com/embed/avatars/${index}.png?size=${size}`;
	}

	/**
	 * Adds the user to a guild
	 * Requires the guilds.join scope
	 * @param guildId - The guild ID to join
	 * @returns The guild member object or null if already in guild
	 * @throws Error if access token is missing or guilds.join scope is not present
	 */
	async joinServer(guildId: string): Promise<APIGuildMember | null> {
		if (!this.#accessToken) {
			throw new Error('Missing access token');
		}

		const scopes = this.#accessToken.scope.split(' ');
		if (!scopes.includes('guilds.join')) {
			throw new Error('User does not have the "guilds.join" scope');
		}

		return (await this.#client.rest.put(Routes.guildMember(guildId, this.id), {
			body: {
				access_token: this.#accessToken.access_token,
			},
		})) as APIGuildMember | null;
	}

	/**
	 * Gets the access token type and value
	 * @returns Object with token type and access token
	 */
	getAccessToken(): { type: string; token: string } {
		return {
			type: this.#accessToken.token_type,
			token: this.#accessToken.access_token,
		};
	}

	/**
	 * Converts the user to a JSON object
	 * @returns Plain object representation
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.id,
			username: this.username,
			discriminator: this.discriminator,
			tag: this.tag,
			email: this.email,
			avatarHash: this.avatarHash,
			bannerHash: this.bannerHash,
			bannerColor: this.bannerColor,
			accentColor: this.accentColor,
			avatarDecoration: this.avatarDecoration,
			locale: this.locale,
			mfaEnabled: this.mfaEnabled,
			premiumType: this.premiumType,
			publicFlags: this.publicFlags,
		};
	}

	/**
	 * String representation of the user
	 * @returns The user's tag
	 */
	toString(): string {
		return this.tag;
	}
}