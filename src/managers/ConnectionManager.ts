import { Oauth } from '@classes/Oauth';
import { Connection } from '@structures/Connection';
import { DiscordAPIError } from '@discordjs/rest';

/**
 * Connection manager class
 * @param {Oauth} client - Client instance
 * @class
 * @property {Oauth} #client - Client instance
 */
export class ConnectionManager {
	client: Oauth;
	constructor(client: Oauth) {
		this.client = client;
	}

	/**
	 * Get a user connections
	 * @param {string} key User Access Token
	 * @param {boolean} cache whether to get from cache or force fetch
	 * @returns {Promise<Connection[]>}
	 */
	async get(key, cache = true): Promise<Connection[]> {
		const mapData = this.client.cache.connections.get(key);

		if (mapData && cache) return mapData;

		const fetched = await this.client.fetchUserConnections(key);

		const connections = fetched.map(c => new Connection(this.client, c));
		this.client.cache.connections.set(key, connections);
		return connections;
	}
}