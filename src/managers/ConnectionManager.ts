import { Oauth } from '@classes/Oauth';
import { Connection } from '@structures/Connection';

/**
 * Manages connection data and caching
 */
export class ConnectionManager {
	/** OAuth client instance */
	readonly #client: Oauth;

	/**
	 * Creates a new ConnectionManager instance
	 * @param client - OAuth client instance
	 */
	constructor(client: Oauth) {
		this.#client = client;
	}

	/**
	 * Gets user's connections, either from cache or by fetching from the API
	 * @param key - User access token
	 * @param useCache - Whether to use cached data if available
	 * @returns Array of connection objects
	 */
	async get(key: string, useCache: boolean = true): Promise<Connection[]> {
		if (useCache) {
			const cached = this.#client.cache.connections.get(key);
			if (cached) {
				return cached;
			}
		}

		const data = await this.#client.fetchUserConnections(key);
		const connections = data.map(c => new Connection(this.#client, c));
		
		this.#client.cache.connections.set(key, connections);
		return connections;
	}

	/**
	 * Removes connections from the cache
	 * @param key - User access token
	 * @returns Whether the connections were removed
	 */
	delete(key: string): boolean {
		return this.#client.cache.connections.delete(key);
	}

	/**
	 * Checks if connections are cached for a user
	 * @param key - User access token
	 * @returns Whether connections are cached
	 */
	has(key: string): boolean {
		return this.#client.cache.connections.has(key);
	}

	/**
	 * Clears all cached connections
	 */
	clear(): void {
		this.#client.cache.connections.clear();
	}
}