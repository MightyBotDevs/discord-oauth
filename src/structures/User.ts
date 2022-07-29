import { Snowflake } from 'discord-api-types/globals';
import { Oauth } from '@classes/Oauth';
import { OAuthUser } from '../types/OAuthUser';
import { CDNOptions } from '../types/CDNOptions';
import { APIGuildMember, RESTPostOAuth2AccessTokenResult, Routes } from 'discord-api-types/v10';
import { UserFlags } from '@bitfields/UserFlags';

/**
 * User class
 *
 * @param {Client} #client - Client instance
 * @param {OAuthUser} data - User data
 * @class
 * @param {string} id - User ID
 * @param {string} username - User username (username)
 * @param {string} discriminator - User discriminator (1234)
 * @param {string} tag - User tag (username#1234)
 * @param {string} avatarHash - User avatar hash
 * @param {string} bannerHash - User banner hash
 * @param {string} bannerColor - User baner color
 * @param {number} accentColor - User accent color
 * @param {string} avatarDecoration - User avatar decoration
 * @param {string} locale - User locale
 * @param {boolean} mfaEnabled - User MFA enabled
 * @param {number} premiumType - User premium type
 * @param {string[]} publicFlags - User public flags
 *
 * @param {RESTPostOAuth2AccessTokenResult} #accessToken - User access token
 */
export class User {
	#client: Oauth;
	id: Snowflake;
	username: string;
	discriminator: string;
	tag: string;
	avatarHash: string | null;
	bannerHash: string | null;
	bannerColor: string | null;
	accentColor: number;
	avatarDecoration: string | null;
	locale: string;
	mfaEnabled: boolean;
	premiumType: number;
	publicFlags: string[];

	#accessToken: RESTPostOAuth2AccessTokenResult;
	constructor(client: Oauth, data: OAuthUser) {
		this.#client = client;

		this.id = data.id;
		this.username = data.username;
		this.discriminator = data.discriminator;
		this.tag = `${data.username}#${data.discriminator}`;
		this.avatarHash = data.avatar_hash;
		this.bannerHash = data.banner_hash;
		this.bannerColor = data.banner_color;
		this.accentColor = data.accent_color;
		this.avatarDecoration = data.avatar_decoration;
		this.locale = data.locale;
		this.mfaEnabled = data.mfa_enabled;
		this.premiumType = data.premium_type;
		this.publicFlags = new UserFlags(data.public_flags).toArray();

		this.#accessToken = data.access_token;
	}

	/**
	 * Get the user's avatar URL
	 * @returns {string}
	 * @param {CDNOptions} options - Options for the link
	 */
	avatarURL(options?: CDNOptions): string {
		return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatarHash}.${options?.format || 'png'}?size=${options?.size || 512}`;
	}

	/**
	 * Get the user's banner URL
	 * @returns {string}
	 * @param {CDNOptions} options - Options for the link
	 */
	bannerURL(options?: CDNOptions): string {
		return `https://cdn.discordapp.com/banners/${this.id}/${this.bannerHash}.${options?.format || 'png'}?size=${options?.size || 512}`;
	}

	/**
	 * Get the user's default avatar URL
	 * @returns {string}
	 * @param {CDNOptions} options - Options for the link
	 */
	defaultAvatarURL(options?: CDNOptions): string {
		return `https://cdn.discordapp.com/embed/avatars/${Number(this.discriminator) % 5}.png?size=${options?.size || 512}`;
	}

	/**
	 * Add the user to a guild
	 * @return {Promise<APIGuildMember | null>}
	 * @param {string} guild_id - Guild ID
	 */
	async joinServer(guild_id: string): Promise<APIGuildMember | null> {
		if(!this.#accessToken) throw new Error('Invalid access code');
		if(!this.#accessToken.scope.split(' ').includes('guilds.join')) throw new Error('User does not have the `guilds.join` scope.');

		return (await this.#client.rest.put(Routes.guildMember(guild_id, this.id), {
			body: {
				access_token: this.#accessToken.access_token,
			},
		})) as APIGuildMember | null;
	}
}