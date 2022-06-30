import {
	RESTPostOAuth2AccessTokenResult,
	OAuth2Scopes,
	APIUser,
	APIGuild,
	Routes,
} from 'discord-api-types/v10';
import { sign, verify } from 'jsonwebtoken';
import { fetch } from 'undici';
import { User } from '@structures/User';
import { GuildsCollection, UserCollection } from '@structures/Collections';
import { Permissions } from '@bitfields/Permissions';
import { REST, DiscordAPIError, DiscordErrorData, OAuthErrorData } from '@discordjs/rest';

interface OAuth2Options {
	clientId: string;
	clientSecret: string;
	token: string;
	apiVersion?: string;
}

export class Oauth {
	#clientSecret: string;
	#token: string;
	clientId: string;
	scopes: string[];
	redirectUri: string | null;

	apiVersion: string;
	baseURL: string;
	rest: REST;

	guilds: GuildsCollection;
	users: UserCollection;
	constructor(options: OAuth2Options) {
		this.#clientSecret = options.clientSecret;
		this.#token = options.token;
		this.clientId = options.clientId;
		this.scopes = [];
		this.redirectUri = null;

		this.apiVersion = options.apiVersion || '10';
		this.baseURL = 'https://discord.com/api/v' + this.apiVersion;
		this.rest = new REST({
			api: 'https://discord.com/api',
			version: this.apiVersion,
		});
		this.rest.setToken(this.#token);

		this.guilds = new GuildsCollection(this);
		this.users = new UserCollection(this);
	}

	public setRedirectUri(uri: string): string {
		return this.redirectUri = uri;
	}

	public setScopes(scopes: string[]): string[] {
		return this.scopes = (scopes as OAuth2Scopes[]).filter(scope => Object.values(OAuth2Scopes).includes(scope));
	}

	public getAuthorizationURL(): string {
		if(!this.redirectUri) throw new Error('Missing or invalid redirectUri');
		return `${this.baseURL}/oauth2/authorize?client_id=${this.clientId}&scope=${this.scopes.join('%20')}&response_type=code&redirect_uri=${this.redirectUri}`;
	}

	public async getAccess(key): Promise<string | Error> {

		if(typeof key !== 'string') return new Error('Invalid authorization code');
		// TODO Change fetch method to @discord.js/rest

		const request = await fetch(this.baseURL + Routes.oauth2TokenExchange(), {
			method: 'POST',
			body: new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.#clientSecret,
				grant_type: 'authorization_code',
				redirect_uri: this.redirectUri,
				code: key,
				scope: this.scopes.join(' '),
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		const json = (await request.json()) as (DiscordAPIError & OAuthErrorData) | RESTPostOAuth2AccessTokenResult;

		if(!request.ok) {
			// @ts-ignore
			return new DiscordAPIError(json, json?.code, res.status, 'POST', `${this.baseURL}/oauth2/token`, { files: undefined, body });
		}

		const token = sign(json, this.#clientSecret);

		// @ts-ignore
		const scopes: string[] = json?.scope.split(' ');

		if (scopes.includes('identify') || this.scopes.includes('email')) await this.users.fetch(token);
		if (scopes.includes('guilds')) await this.guilds.fetch(token);

		return token;

	}

	async getUser(key: string): Promise<User> {
		if(typeof key !== 'string') throw new Error('Invalid access code');

		try {
			const access: RESTPostOAuth2AccessTokenResult = verify(key, this.#clientSecret);

			const res = await fetch(`${this.baseURL}/users/@me`, {
				headers: {
					Authorization: `${access.token_type} ${access.access_token}`,
				},
			});

			const json = (await res.json() as DiscordErrorData | APIUser);

			if(!res.ok) {
				// @ts-ignore
				new Error(new DiscordAPIError(json, json?.code, res.status, 'GET', `${this.baseURL}/users/@me`, { files: undefined, body: undefined }));
			}
			console.log(json);
			// @ts-ignore
			return new User(json);
		}
		catch(e) {
			throw new Error(e);
		}
	}

	async getGuilds(key: string): Promise<APIGuild[]> {
		if(typeof key !== 'string') throw new Error('Invalid access code');

		try {
			const access: RESTPostOAuth2AccessTokenResult = verify(key, this.#clientSecret);

			const res = await fetch(`${this.baseURL}/users/@me/guilds`, {
				headers: {
					Authorization: `${access.token_type} ${access.access_token}`,
				},
			});

			const json = (await res.json() as DiscordErrorData | APIGuild[]);

			if(!res.ok) {
				// @ts-ignore
				return reject(new DiscordAPIError(json, json?.code, res.status, 'GET', `${this.baseURL}/users/@me/guilds`, { files: undefined, body: undefined }));
			}

			// @ts-ignore
			(json as APIGuild[]).forEach(g => g.permissions = new Permissions(g.permissions).toArray());

			// @ts-ignore
			return json;
		}
		catch(e) {
			throw new Error(e);
		}
	}
}