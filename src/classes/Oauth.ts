import {
	RESTPostOAuth2AccessTokenResult,
	OAuth2Scopes,
	Routes,
	APIConnection,
} from 'discord-api-types/v10';
import { sign, verify } from 'jsonwebtoken';
import { fetch } from 'undici';
import { REST, DiscordAPIError, DiscordErrorData } from '@discordjs/rest';
import { GuildManager } from '@managers/GuildManager';
import { OAuthGuild } from '../types/OAuthGuild';
import { Guild } from '@structures/Guild';
import { UserManagers } from '@managers/UserManager';
import { OAuthUser } from '../types/OAuthUser';
import { User } from '@structures/User';
import { ConnectionManager } from '@managers/ConnectionManager';
import { Connection } from '@structures/Connection';

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
		connections: Map<string, Connection[]>,
	};

	apiVersion: string;
	baseURL: string;
	rest: REST;

	guilds: GuildManager;
	users: UserManagers;
	connections: ConnectionManager;
	constructor(options: OAuth2Options) {
		this.#clientSecret = options.clientSecret;
		this.#token = options.token;
		this.clientId = options.clientId;
		this.scopes = [];
		this.redirectUri = null;

		this.cache = {
			guilds: new Map(),
			users: new Map(),
			connections: new Map(),
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
		this.connections = new ConnectionManager(this);
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

	private async tokenExchangeEndpoint(body): Promise<DiscordAPIError | string> {
		const request = await fetch(this.baseURL + Routes.oauth2TokenExchange(), {
			method: 'POST',
			body,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		let json = (await request.json()) as RESTPostOAuth2AccessTokenResult | DiscordErrorData;

		if(!request.ok) {
			json = (json as DiscordErrorData);
			throw new DiscordAPIError(json, json?.code, request.status, 'POST', `${this.baseURL}/oauth2/token`, { files: undefined, body });
		}

		const token: string = sign(json, this.#clientSecret);

		const scopes: string[] = (json as RESTPostOAuth2AccessTokenResult)?.scope.split(' ');

		if (scopes.includes('identify') || scopes.includes('email')) await this.users.get(token, false);
		if (scopes.includes('guilds')) await this.guilds.get(token, false);
		if (scopes.includes('connections')) await this.connections.get(token, false);

		return token;
	}

	/**
	 * OAuth Exchange Code for Access Token
	 * @param {string} key - Access code from Discord
	 * @return {Promise<RESTPostOAuth2AccessTokenResult>} - Access token
	 */
	public async getAccess(key): Promise<string | Error> {
		if(typeof key !== 'string') return new Error('Invalid authorization code');
		// TODO Change fetch method to @discord.js/rest

		const body = new URLSearchParams({
			client_id: this.clientId,
			client_secret: this.#clientSecret,
			grant_type: 'authorization_code',
			redirect_uri: this.redirectUri,
			code: key,
			scope: this.scopes.join(' '),
		});

		return await this.tokenExchangeEndpoint(body);
	}

	/**
	 * Refresh user OAuth tokens
	 * @param {string} key - Access token
	 * @return {Promise<RESTPostOAuth2AccessTokenResult>} - User object
	 */
	public async refreshToken(key): Promise<string | Error> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		const access: RESTPostOAuth2AccessTokenResult = verify(key, this.#clientSecret);

		const body = new URLSearchParams({
			client_id: this.clientId,
			client_secret: this.#clientSecret,
			grant_type: 'refresh_token',
			refresh_token: access.refresh_token,
		});

		return await this.tokenExchangeEndpoint(body);
	}


	/**
	 * Revoke User token
	 * @param {string} key - Access token
	 * @return {Promise<Record<string, boolean>>} - JSON object
	 */
	public async revokeToken(key): Promise<Record<string, boolean> | Error> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		const access: RESTPostOAuth2AccessTokenResult = verify(key, this.#clientSecret);

		const request = await fetch(this.baseURL + Routes.oauth2TokenRevocation(), {
			method: 'POST',
			body: new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.#clientSecret,
				token: access.refresh_token,
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		let json = await request.json() as DiscordErrorData;

		if(!request.ok) {
			json = json as DiscordErrorData;
			throw new DiscordAPIError(json, json?.code, request.status, 'GET', `${this.baseURL}/users/@me/guilds`, { files: undefined, body: undefined });
		}

		this.cache.users.delete(key);
		this.cache.guilds.delete(key);
		this.cache.connections.delete(key);

		return {
			revoked: true,
		};
	}

	/**
	 * Get User from cache
	 * @param {string} key - Access token
	 * @param {boolean} [cache=true] - Use cache
	 * @return {Promise<User>} - User object
	 */
	async getUser(key: string, cache?: boolean): Promise<User> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		return await this.users.get(key, cache);
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

		if(res.status !== 200) {
			json = (json as DiscordErrorData);
			throw new DiscordAPIError(json, json?.code, res.status, 'GET', `${this.baseURL}/users/@me`, { files: undefined, body: undefined });
		}

		json = json as OAuthUser;

		json.access_token = access;

		return json;
	}

	/**
	 * Get guilds from cache
	 * @param {string} key - Access token
	 * @param {boolean} [cache=true] - Use cache
	 * @return {Promise<Guild[]>} - Guilds object
	 */
	async getGuilds(key: string, cache?: boolean): Promise<Guild[]> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		return await this.guilds.get(key, cache);
	}

	/**
	 * Fetch guild from API
	 * @param {string} key - Access token
	 * @return {Promise<OAuthGuild[]>} - Guilds object
	 */
	async fetchGuilds(key: string): Promise<OAuthGuild[]> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		const access: RESTPostOAuth2AccessTokenResult = verify(key, this.#clientSecret);

		const res = await fetch(`${this.baseURL}/users/@me/guilds`, {
			headers: {
				Authorization: `${access.token_type} ${access.access_token}`,
			},
		});

		let json = (await res.json() as DiscordErrorData | OAuthGuild[]);

		if(res.status !== 200) {
			json = json as DiscordErrorData;
			throw new DiscordAPIError(json, json?.code, res.status, 'GET', `${this.baseURL}/users/@me/guilds`, { files: undefined, body: undefined });
		}

		return json as OAuthGuild[];
	}

	/**
	 * Get connections from cache
	 * @param {string} key - Access token
	 * @param {boolean} [cache=true] - Use cache
	 * @return {Promise<Connection[]>} - Connections object
	 */
	async getUserConnections(key: string, cache?: boolean): Promise<Connection[]> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		return await this.connections.get(key, cache);
	}

	/**
	 * Fetch connections from API
	 * @param {string} key - Access token
	 * @return {Promise<APIConnection[]>} - User object
	 */
	async fetchUserConnections(key: string): Promise<(APIConnection & { two_way_link: boolean; })[]> {
		if(typeof key !== 'string') throw new Error('Invalid access code');
		const access: RESTPostOAuth2AccessTokenResult = verify(key, this.#clientSecret);

		const res = await fetch(`${this.baseURL}/users/@me/connections`, {
			headers: {
				Authorization: `${access.token_type} ${access.access_token}`,
			},
		});

		let json = (await res.json() as DiscordErrorData | (APIConnection & { two_way_link: boolean; })[]);

		if(res.status !== 200) {
			json = json as DiscordErrorData;
			throw new DiscordAPIError(json, json?.code, res.status, 'GET', `${this.baseURL}/users/@me/connections`, { files: undefined, body: undefined });
		}

		return json as (APIConnection & { two_way_link: boolean; })[];
	}
}