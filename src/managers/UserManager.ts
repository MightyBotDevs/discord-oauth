import { Oauth } from '@classes/Oauth';
import { User } from '@structures/User';

/**
 * Manages user data and caching
 */
export class UserManager {
	/** OAuth client instance */
	readonly #client: Oauth;

	/**
	 * Creates a new UserManager instance
	 * @param client - OAuth client instance
	 */
	constructor(client: Oauth) {
		this.#client = client;
	}

	/**
	 * Gets a user, either from cache or by fetching from the API
	 * @param key - User access token
	 * @param useCache - Whether to use cached data if available
	 * @returns The user object
	 */
	async get(key: string, useCache: boolean = true): Promise<User> {
		if (useCache) {
			const cached = this.#client.cache.users.get(key);
			if (cached) {
				return cached;
			}
		}

		const data = await this.#client.fetchUser(key);
		const user = new User(this.#client, data);
		
		this.#client.cache.users.set(key, user);
		return user;
	}

	/**
	 * Removes a user from the cache
	 * @param key - User access token
	 * @returns Whether the user was removed
	 */
	delete(key: string): boolean {
		return this.#client.cache.users.delete(key);
	}

	/**
	 * Checks if a user is cached
	 * @param key - User access token
	 * @returns Whether the user is cached
	 */
	has(key: string): boolean {
		return this.#client.cache.users.has(key);
	}

	/**
	 * Clears all cached users
	 */
	clear(): void {
		this.#client.cache.users.clear();
	}
}