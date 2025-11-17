import {
	RESTPostOAuth2AccessTokenResult,
	OAuth2Scopes,
	Routes,
	APIConnection,
} from 'discord-api-types/v10';
import { sign, verify, JsonWebTokenError } from 'jsonwebtoken';
import { fetch } from 'undici';
import { REST, DiscordAPIError, DiscordErrorData } from '@discordjs/rest';
import { GuildManager } from '@managers/GuildManager';
import { OAuthGuild } from '../types/OAuthGuild';
import { Guild } from '@structures/Guild';
import { UserManager } from '@managers/UserManager';
import { OAuthUser } from '../types/OAuthUser';
import { User } from '@structures/User';
import { ConnectionManager } from '@managers/ConnectionManager';
import { Connection } from '@structures/Connection';

/**
 * Configuration options for the OAuth client
 */
export interface OAuthOptions {
	/** Discord application client ID */
	clientId: string;
	/** Discord application client secret */
	clientSecret: string;
	/** Bot token for API requests */
	token: string;
	/** Discord API version (default: '10') */
	apiVersion?: string;
}

/**
 * Main OAuth2 client for Discord
 */
export class Oauth {
	/** Client secret (private) */
	readonly #clientSecret: string;
	/** Bot token (private) */
	readonly #token: string;

	/** Discord application client ID */
	readonly clientId: string;
	/** OAuth2 scopes to request */
	scopes: OAuth2Scopes[];
	/** OAuth2 redirect URI */
	redirectUri: string | null;

	/** Cache for users, guilds, and connections */
	readonly cache: {
		guilds: Map<string, Guild[]>;
		users: Map<string, User>;
		connections: Map<string, Connection[]>;
	};

	/** Discord API version */
	readonly apiVersion: string;
	/** Base Discord API URL */
	readonly baseURL: string;
	/** REST client instance */
	readonly rest: REST;

	/** Guild manager */
	readonly guilds: GuildManager;
	/** User manager */
	readonly users: UserManager;
	/** Connection manager */
	readonly connections: ConnectionManager;

	/**
	 * Creates a new OAuth client instance
	 * @param options - Configuration options
	 */
	constructor(options: OAuthOptions) {
		// Validate required options
		if (!options.clientId) {
			throw new Error('Missing required option: clientId');
		}
		if (!options.clientSecret) {
			throw new Error('Missing required option: clientSecret');
		}
		if (!options.token) {
			throw new Error('Missing required option: token');
		}

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

		this.apiVersion = options.apiVersion ?? '10';
		this.baseURL = `https://discord.com/api/v${this.apiVersion}`;
		
		this.rest = new REST({
			api: 'https://discord.com/api',
			version: this.apiVersion,
		});
		this.rest.setToken(this.#token);

		this.guilds = new GuildManager(this);
		this.users = new UserManager(this);
		this.connections = new ConnectionManager(this);
	}

	/**
	 * Sets the OAuth2 redirect URI
	 * @param uri - Redirect URI
	 * @returns The redirect URI
	 */
	setRedirectUri(uri: string): string {
		if (!uri || typeof uri !== 'string') {
			throw new Error('Invalid redirect URI');
		}
		this.redirectUri = uri;
		return uri;
	}

	/**
	 * Sets the OAuth2 scopes to request
	 * @param scopes - Array of OAuth2 scopes
	 * @returns Array of valid scopes
	 */
	setScopes(scopes: string[]): OAuth2Scopes[] {
		if (!Array.isArray(scopes)) {
			throw new Error('Scopes must be an array');
		}
		
		const validScopes = scopes.filter(scope => 
			Object.values(OAuth2Scopes).includes(scope as OAuth2Scopes)
		) as OAuth2Scopes[];
		
		this.scopes = validScopes;
		return validScopes;
	}

	/**
	 * Generates the OAuth2 authorization URL
	 * @returns Authorization URL
	 * @throws Error if redirect URI is not set
	 */
	getAuthorizationURL(): string {
		if (!this.redirectUri) {
			throw new Error('Redirect URI must be set before generating authorization URL');
		}
		if (this.scopes.length === 0) {
			throw new Error('At least one scope must be set');
		}

		const params = new URLSearchParams({
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			scope: this.scopes.join(' '),
		});

		return `${this.baseURL}/oauth2/authorize?${params.toString()}`;
	}

	/**
	 * Internal method to handle token exchange endpoint
	 * @param body - URLSearchParams body for the request
	 * @returns Signed JWT token containing access token data
	 */
	private async tokenExchangeEndpoint(body: URLSearchParams): Promise<string> {
		const response = await fetch(this.baseURL + Routes.oauth2TokenExchange(), {
			method: 'POST',
			body,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		const json = await response.json() as RESTPostOAuth2AccessTokenResult | DiscordErrorData;

		if (!response.ok) {
			const errorData = json as DiscordErrorData;
			throw new DiscordAPIError(
				errorData,
				errorData?.code,
				response.status,
				'POST',
				`${this.baseURL}/oauth2/token`,
				{ files: undefined, body: body.toString() }
			);
		}

		const tokenData = json as RESTPostOAuth2AccessTokenResult;
		const token = sign(tokenData, this.#clientSecret);
		const scopes = tokenData.scope.split(' ');

		// Pre-cache data based on scopes
		if (scopes.includes('identify') || scopes.includes('email')) {
			await this.users.get(token, false);
		}
		if (scopes.includes('guilds')) {
			await this.guilds.get(token, false);
		}
		if (scopes.includes('connections')) {
			await this.connections.get(token, false);
		}

		return token;
	}

	/**
	 * Exchanges an authorization code for an access token
	 * @param code - Authorization code from Discord
	 * @returns Signed JWT token containing access token data
	 * @throws Error if code is invalid
	 */
	async getAccess(code: string): Promise<string> {
		if (!code || typeof code !== 'string') {
			throw new Error('Invalid authorization code');
		}
		if (!this.redirectUri) {
			throw new Error('Redirect URI must be set');
		}

		const body = new URLSearchParams({
			client_id: this.clientId,
			client_secret: this.#clientSecret,
			grant_type: 'authorization_code',
			redirect_uri: this.redirectUri,
			code: code,
			scope: this.scopes.join(' '),
		});

		return await this.tokenExchangeEndpoint(body);
	}

	/**
	 * Refreshes an access token using a refresh token
	 * @param key - Signed JWT token
	 * @returns New signed JWT token
	 * @throws Error if token is invalid
	 */
	async refreshToken(key: string): Promise<string> {
		if (!key || typeof key !== 'string') {
			throw new Error('Invalid access token');
		}

		let tokenData: RESTPostOAuth2AccessTokenResult;
		try {
			tokenData = verify(key, this.#clientSecret) as RESTPostOAuth2AccessTokenResult;
		} catch (error) {
			if (error instanceof JsonWebTokenError) {
				throw new Error('Invalid or expired token');
			}
			throw error;
		}

		const body = new URLSearchParams({
			client_id: this.clientId,
			client_secret: this.#clientSecret,
			grant_type: 'refresh_token',
			refresh_token: tokenData.refresh_token,
		});

		return await this.tokenExchangeEndpoint(body);
	}

	/**
	 * Revokes a user's access token
	 * @param key - Signed JWT token
	 * @returns Object indicating success
	 * @throws Error if token is invalid
	 */
	async revokeToken(key: string): Promise<{ revoked: boolean }> {
		if (!key || typeof key !== 'string') {
			throw new Error('Invalid access token');
		}

		let tokenData: RESTPostOAuth2AccessTokenResult;
		try {
			tokenData = verify(key, this.#clientSecret) as RESTPostOAuth2AccessTokenResult;
		} catch (error) {
			if (error instanceof JsonWebTokenError) {
				throw new Error('Invalid or expired token');
			}
			throw error;
		}

		const response = await fetch(this.baseURL + Routes.oauth2TokenRevocation(), {
			method: 'POST',
			body: new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.#clientSecret,
				token: tokenData.access_token,
			}),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		if (!response.ok) {
			const json = await response.json() as DiscordErrorData;
			throw new DiscordAPIError(
				json,
				json?.code,
				response.status,
				'POST',
				`${this.baseURL}/oauth2/token/revoke`,
				{ files: undefined, body: undefined }
			);
		}

		// Clear cached data for this user
		this.cache.users.delete(key);
		this.cache.guilds.delete(key);
		this.cache.connections.delete(key);

		return { revoked: true };
	}

	/**
	 * Gets a user from cache or fetches from API
	 * @param key - Signed JWT token
	 * @param cache - Whether to use cache
	 * @returns User object
	 */
	async getUser(key: string, cache: boolean = true): Promise<User> {
		if (!key || typeof key !== 'string') {
			throw new Error('Invalid access token');
		}
		return await this.users.get(key, cache);
	}

	/**
	 * Fetches user data from Discord API
	 * @param key - Signed JWT token
	 * @returns Raw user data
	 */
	async fetchUser(key: string): Promise<OAuthUser> {
		if (!key || typeof key !== 'string') {
			throw new Error('Invalid access token');
		}

		let tokenData: RESTPostOAuth2AccessTokenResult;
		try {
			tokenData = verify(key, this.#clientSecret) as RESTPostOAuth2AccessTokenResult;
		} catch (error) {
			if (error instanceof JsonWebTokenError) {
				throw new Error('Invalid or expired token');
			}
			throw error;
		}

		const response = await fetch(`${this.baseURL}/users/@me`, {
			headers: {
				Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
			},
		});

		const json = await response.json() as OAuthUser | DiscordErrorData;

		if (!response.ok) {
			const errorData = json as DiscordErrorData;
			throw new DiscordAPIError(
				errorData,
				errorData?.code,
				response.status,
				'GET',
				`${this.baseURL}/users/@me`,
				{ files: undefined, body: undefined }
			);
		}

		const userData = json as OAuthUser;
		userData.access_token = tokenData;

		return userData;
	}

	/**
	 * Gets user's guilds from cache or fetches from API
	 * @param key - Signed JWT token
	 * @param cache - Whether to use cache
	 * @returns Array of guild objects
	 */
	async getGuilds(key: string, cache: boolean = true): Promise<Guild[]> {
		if (!key || typeof key !== 'string') {
			throw new Error('Invalid access token');
		}
		return await this.guilds.get(key, cache);
	}

	/**
	 * Fetches guild data from Discord API
	 * @param key - Signed JWT token
	 * @returns Raw guild data array
	 */
	async fetchGuilds(key: string): Promise<OAuthGuild[]> {
		if (!key || typeof key !== 'string') {
			throw new Error('Invalid access token');
		}

		let tokenData: RESTPostOAuth2AccessTokenResult;
		try {
			tokenData = verify(key, this.#clientSecret) as RESTPostOAuth2AccessTokenResult;
		} catch (error) {
			if (error instanceof JsonWebTokenError) {
				throw new Error('Invalid or expired token');
			}
			throw error;
		}

		const response = await fetch(`${this.baseURL}/users/@me/guilds`, {
			headers: {
				Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
			},
		});

		const json = await response.json() as OAuthGuild[] | DiscordErrorData;

		if (!response.ok) {
			const errorData = json as DiscordErrorData;
			throw new DiscordAPIError(
				errorData,
				errorData?.code,
				response.status,
				'GET',
				`${this.baseURL}/users/@me/guilds`,
				{ files: undefined, body: undefined }
			);
		}

		return json as OAuthGuild[];
	}

	/**
	 * Gets user's connections from cache or fetches from API
	 * @param key - Signed JWT token
	 * @param cache - Whether to use cache
	 * @returns Array of connection objects
	 */
	async getUserConnections(key: string, cache: boolean = true): Promise<Connection[]> {
		if (!key || typeof key !== 'string') {
			throw new Error('Invalid access token');
		}
		return await this.connections.get(key, cache);
	}

	/**
	 * Fetches connection data from Discord API
	 * @param key - Signed JWT token
	 * @returns Raw connection data array
	 */
	async fetchUserConnections(key: string): Promise<(APIConnection & { two_way_link: boolean })[]> {
		if (!key || typeof key !== 'string') {
			throw new Error('Invalid access token');
		}

		let tokenData: RESTPostOAuth2AccessTokenResult;
		try {
			tokenData = verify(key, this.#clientSecret) as RESTPostOAuth2AccessTokenResult;
		} catch (error) {
			if (error instanceof JsonWebTokenError) {
				throw new Error('Invalid or expired token');
			}
			throw error;
		}

		const response = await fetch(`${this.baseURL}/users/@me/connections`, {
			headers: {
				Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
			},
		});

		const json = await response.json() as (APIConnection & { two_way_link: boolean })[] | DiscordErrorData;

		if (!response.ok) {
			const errorData = json as DiscordErrorData;
			throw new DiscordAPIError(
				errorData,
				errorData?.code,
				response.status,
				'GET',
				`${this.baseURL}/users/@me/connections`,
				{ files: undefined, body: undefined }
			);
		}

		return json as (APIConnection & { two_way_link: boolean })[];
	}

	/**
	 * Clears all cached data
	 */
	clearCache(): void {
		this.cache.users.clear();
		this.cache.guilds.clear();
		this.cache.connections.clear();
	}
}