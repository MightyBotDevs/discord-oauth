import { Oauth } from '@classes/Oauth';
import { Guild } from '@structures/Guild';

/**
 * Manages guild data and caching
 */
export class GuildManager {
	/** OAuth client instance */
	readonly #client: Oauth;

	/**
	 * Creates a new GuildManager instance
	 * @param client - OAuth client instance
	 */
	constructor(client: Oauth) {
		this.#client = client;
	}

	/**
	 * Gets user's guilds, either from cache or by fetching from the API
	 * @param key - User access token
	 * @param useCache - Whether to use cached data if available
	 * @returns Array of guild objects
	 */
	async get(key: string, useCache: boolean = true): Promise<Guild[]> {
		if (useCache) {
			const cached = this.#client.cache.guilds.get(key);
			if (cached) {
				return cached;
			}
		}

		const data = await this.#client.fetchGuilds(key);
		const guilds = data.map(g => new Guild(this.#client, g));
		
		this.#client.cache.guilds.set(key, guilds);
		return guilds;
	}

	/**
	 * Removes guilds from the cache
	 * @param key - User access token
	 * @returns Whether the guilds were removed
	 */
	delete(key: string): boolean {
		return this.#client.cache.guilds.delete(key);
	}

	/**
	 * Checks if guilds are cached for a user
	 * @param key - User access token
	 * @returns Whether guilds are cached
	 */
	has(key: string): boolean {
		return this.#client.cache.guilds.has(key);
	}

	/**
	 * Clears all cached guilds
	 */
	clear(): void {
		this.#client.cache.guilds.clear();
	}
}