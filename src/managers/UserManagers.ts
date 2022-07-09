import { Oauth } from '@classes/Oauth';
import { User } from '@structures/User';

export class UserManagers {
	client: Oauth;
	constructor(client) {
		this.client = client;
	}

	async get(key, cache = true) {
		const mapData = this.client.cache.users.get(key);

		if (mapData && cache) return mapData;

		const fetched = await this.client.fetchUser(key).catch(e => {
			throw new Error(e);
		});

		this.client.cache.users.set(key, new User(this.client, fetched));
		return new User(this.client, fetched);
	}
}