import {
	RESTPostOAuth2AccessTokenResult,
	OAuth2Scopes,
	Routes,
} from 'discord-api-types/v10';
import { sign, verify } from 'jsonwebtoken';
import { fetch } from 'undici';
import { User } from '@structures/User';
import { REST, DiscordAPIError, DiscordErrorData, OAuthErrorData } from '@discordjs/rest';
import { Guild } from '@structures/Guild';
import { GuildManager } from '@managers/GuildManager';
import { OAuthGuild } from '../types/OAuthGuild';
import { UserManagers } from '@managers/UserManager';
import { OAuthUser } from '../types/OAuthUser';

interface OAuth2Options {
	clientId: string;
	clientSecret: string;
	token: string;
	apiVersion?: string;
}

/**
 * Main library class
 * @param {options} options - Options object
 * @property {string} #clientSecret - Client Secret
 * @property {string} #token - Bot access token
 * @property {string} clientId - Client ID
 * @property {string[]} scopes - Scopes to request
 * @property {string} redirectUri - Redirect URI
 * @property {object} cache - Cache object
 * @property {string} apiVersion - API version
 * @property {string} baseURL - Discord API URL
 * @property {REST} rest - REST client
 * @property {UserManagers} users - User managers
 * @property {GuildManager} guilds - Guild manager
 * @class
 */
export class Oauth {
	#clientSecret: string;
	#token: string;
	clientId: string;
	scopes: string[];
	redirectUri: string | null;

	cache: {
		guilds: Map<string, Guild[]>,
		users: Map<string, User>,
	};

	apiVersion: string;
	baseURL: string;
	rest: REST;

	guilds: GuildManager;
	users: UserManagers;
	constructor(options: OAuth2Options) {
		this.#clientSecret = options.clientSecret;
		this.#token = options.token;
		this.clientId = options.clientId;
		this.scopes = [];
		this.redirectUri = null;

		this.cache = {
			guilds: new Map(),
			users: new Map(),
		};

		this.apiVersion = options.apiVersion || '10';
		this.baseURL = 'https://discord.com/api/v' + this.apiVersion;
		this.rest = new REST({
			api: 'https://discord.com/api',
			version: this.apiVersion,
		});
		this.rest.setToken(this.#token);

		this.guilds = new GuildManager(this);
		this.users = new UserManagers(this);
	}

	/**
	 * Set the redirect URI
	 * @param {string} uri - Redirect URI
	 * @returns {string} Redirect URI
	 */
	setRedirectUri(uri: string): string {
		return this.redirectUri = uri;
	}

	/**
	 * Set the scopes
	 * @returns {string} Oauth scopes
	 * @param {string[]} scopes - OAuth scopes
	 */
	setScopes(scopes: string[]): string[] {
		return this.scopes = (scopes as OAuth2Scopes[]).filter(scope => Object.values(OAuth2Scopes).includes(scope));
	}

	/**
	 * Get autorization URL
	 * @return {string} - Authorization URL
	 */
	getAuthorizationURL(): string {
		if(!this.redirectUri) throw new Error('Missing or invalid redirectUri');
		return `${this.baseURL}/oauth2/authorize?client_id=${this.clientId}&scope=${this.scopes.join('%20')}&response_type=code&redirect_uri=${this.redirectUri}`;
	}

	/**
	 * OAuth Exchange Code for Access Token
	 * @param {string} key - Access code from Discord
	 * @return {Promise<RESTPostOAuth2AccessTokenResult>} - Access token
	 */
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
			// @ts-expect-error
			return new DiscordAPIError(json, json?.code, request.status, 'POST', `${this.baseURL}/oauth2/token`, { files: undefined, body });
		}

		const token: string = sign(json, this.#clientSecret);

		// @ts-expect-error
		const scopes: string[] = json?.scope.split(' ');

		if (scopes.includes('identify') || scopes.includes('email')) await this.users.get(token, false);
		if (scopes.includes('guilds')) await this.guilds.get(token, false);

		return token;

	}

	/**
	 * Get User from cache
	 * @param {string} key - Access token
	 * @param {boolean} [cache=true] - Use cache
	 * @return {Promise<User>} - User object
	 */
	async getUser(key: string, cache?: boolean): Promise<User> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		return await this.users.get(key, cache).catch(e => {
			throw new Error(e);
		});
	}

	/**
	 * Fetch user from API
	 * @param {string} key - Access token
	 * @return {Promise<OAuthUser>} - User object
	 */
	async fetchUser(key: string): Promise<OAuthUser> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		const access: RESTPostOAuth2AccessTokenResult = verify(key, this.#clientSecret);

		const res = await fetch(`${this.baseURL}/users/@me`, {
			headers: {
				Authorization: `${access.token_type} ${access.access_token}`,
			},
		});

		let json = (await res.json() as DiscordErrorData | OAuthUser);

		if(!res.ok) {
			// @ts-expect-error
			new Error(new DiscordAPIError(json, json?.code, res.status, 'GET', `${this.baseURL}/users/@me`, { files: undefined, body: undefined }));
		}

		json = json as OAuthUser;

		json.access_token = access;

		return json;
	}

	/**
	 * Get guilds from cache
	 * @param {string} key - Access token
	 * @param {boolean} [cache=true] - Use cache
	 * @return {Promise<Guild[]>} - User object
	 */
	async getGuilds(key: string, cache?: boolean): Promise<Guild[]> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		return await this.guilds.get(key, cache).catch(e => {
			throw new Error(e);
		});
	}

	/**
	 * Fetch guild from API
	 * @param {string} key - Access token
	 * @return {Promise<OAuthGuild[]>} - User object
	 */
	async fetchGuilds(key: string): Promise<OAuthGuild[]> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		const access: RESTPostOAuth2AccessTokenResult = verify(key, this.#clientSecret);

		const res = await fetch(`${this.baseURL}/users/@me/guilds`, {
			headers: {
				Authorization: `${access.token_type} ${access.access_token}`,
			},
		});

		const json = (await res.json() as DiscordErrorData | OAuthGuild[]);

		if(!res.ok) {
			// @ts-expect-error
			throw new Error(new DiscordAPIError(json, json?.code, res.status, 'GET', `${this.baseURL}/users/@me/guilds`, { files: undefined, body: undefined }));
		}

		// @ts-expect-error
		return json;
	}
}