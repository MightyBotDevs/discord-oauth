import { Oauth } from '@classes/Oauth';
import { Guild } from '@structures/Guild';

export class GuildManager {
	client: Oauth;
	constructor(client) {
		this.client = client;
	}

	async get(key, cache = true) {
		const mapData = this.client.cache.guilds.get(key);

		if (mapData && cache) return mapData;

		const fetched = await this.client.fetchGuilds(key).catch(e => {
			throw new Error(e);
		});
		const guilds = fetched.map(g => new Guild(this.client, g));
		this.client.cache.guilds.set(key, guilds);
		return guilds;
	}
}