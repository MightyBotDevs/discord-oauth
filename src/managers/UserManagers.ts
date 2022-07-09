import { Oauth } from '@classes/Oauth';
import { User } from '@structures/User';

/**
 * User manager class
 * @param {Oauth} client - Client instance
 * @class
 * @property {Oauth} #client - Client instance
 */
export class UserManagers {
	client: Oauth;
	constructor(client) {
		this.client = client;
	}

	/**
	 * Get a user
	 * @param {string} key User Access Token
	 * @param {boolean} cache whether to get from cache or force fetch
	 * @returns {Promise<User[]>}
	 */
	async get(key, cache = true): Promise<User> {
		const mapData = this.client.cache.users.get(key);

		if (mapData && cache) return mapData;

		const fetched = await this.client.fetchUser(key).catch(e => {
			throw new Error(e);
		});

		this.client.cache.users.set(key, new User(this.client, fetched));
		return new User(this.client, fetched);
	}
}