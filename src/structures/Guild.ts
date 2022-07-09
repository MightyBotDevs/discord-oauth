import { Oauth } from '@classes/Oauth';
import { Permissions } from '@bitfields/Permissions';
import { CDNOptions } from '../types/CDNOptions';
import { OAuthGuild } from '../types/OAuthGuild';

export class Guild {
	#client: Oauth;
	id: string;
	name: string;
	icon: string;
	owner: boolean;
	features: string[];
	permissions: string[];
	constructor(client: Oauth, data: OAuthGuild) {
		this.#client = client;
		this.id = data.id;
		this.name = data.name;
		this.icon = data.icon;
		this.owner = data.owner;
		this.features = data.features;
		this.permissions = new Permissions(Number(data.permissions)).toArray();
	}

	iconURL(options?: CDNOptions): string {
		return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.${options?.format || 'png'}?size=${options?.size || 512}`;
	}
}