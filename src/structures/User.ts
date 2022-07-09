import { Snowflake } from 'discord-api-types/globals';
import { Oauth } from '@classes/Oauth';
import { OAuthUser } from '../types/OAuthUser';
import { CDNOptions } from '../types/CDNOptions';
import { RESTPostOAuth2AccessTokenResult, Routes } from 'discord-api-types/v10';
import { UserFlags } from '@bitfields/UserFlags';

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
	constructor(client, data: OAuthUser) {
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
		console.log(data.public_flags);
		this.publicFlags = new UserFlags(data.public_flags).toArray();

		this.#accessToken = data.access_token;
	}

	avatarURL(options?: CDNOptions): string {
		return `https://cdn.discordapp.com/avatars/${this.id}/${this.avatarHash}.${options?.format || 'png'}?size=${options?.size || 512}`;
	}

	bannerURL(options?: CDNOptions): string {
		return `https://cdn.discordapp.com/banners/${this.id}/${this.bannerHash}.${options?.format || 'png'}?size=${options?.size || 512}`;
	}

	defaultAvatarURL(options?: CDNOptions): string {
		return `https://cdn.discordapp.com/embed/avatars/${Number(this.discriminator) % 5}.png?size=${options?.size || 512}`;
	}

	async joinServer(guild_id: string) {
		if(!this.#accessToken) throw new Error('Invalid access code');
		if(!this.#accessToken.scope.split(' ').includes('guilds.join')) throw new Error('User does not have the `guilds.join` scope.');

		return await this.#client.rest.put(Routes.guildMember(guild_id, this.id), {
			body: {
				access_token: this.#accessToken.access_token,
			},
		});
	}
}