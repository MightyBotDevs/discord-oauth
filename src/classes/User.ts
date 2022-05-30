import { APIUser } from 'discord-api-types/v10';

interface ImageURLOptions {
    size?: number;
    format?: string;
}

export class User {
	apiUser: APIUser;
	scopes: string[];
	constructor(user, scopes) {
		this.apiUser = user;
		this.scopes = scopes;
	}

	get id() {
		return this.apiUser.id;
	}

	get username() {
		return this.apiUser.username;
	}

	get discriminator() {
		return this.apiUser.discriminator;
	}

	get avatar() {
		return this.apiUser.avatar;
	}

	avatarURL(options: ImageURLOptions = {}) {
		return this.apiUser.avatar ?? `https://cdn.discordapp.com/avatars/${this.apiUser.id}/${this.apiUser.avatar}.${options?.format || 'webp'}${options?.size ? `?size=${options.size}` : ''}`;
	}

	get bot() {
		return this.apiUser.bot;
	}

	get mfaEnabled() {
		return this.apiUser.mfa_enabled;
	}

	get locale() {
		return this.apiUser.locale;
	}


}