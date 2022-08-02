import { Oauth } from '@classes/Oauth';
import { Guild } from '@structures/Guild';

/**
 * Guild manager class
 * @param {Oauth} client - Client instance
 * @class
 * @property {Oauth} #client - Client instance
 */
export class GuildManager {
	client: Oauth;
	constructor(client: Oauth) {
		this.client = client;
	}

	/**
	 * Get a user guilds
	 * @param {string} key User Access Token
	 * @param {boolean} cache whether to get from cache or force fetch
	 * @returns {Promise<Guild[]>}
	 */
	async get(key, cache = true): Promise<Guild[]> {
		const mapData = this.client.cache.guilds.get(key);

		if (mapData && cache) return mapData;

		const fetched = await this.client.fetchGuilds(key);

		const guilds = fetched.map(g => new Guild(this.client, g));
		this.client.cache.guilds.set(key, guilds);
		return guilds;
	}
}