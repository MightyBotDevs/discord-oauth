import { Oauth } from '@classes/Oauth';
import { APIConnection, ConnectionVisibility } from 'discord-api-types/v10';

/**
 * Guild class
 *
 * @param {Client} client - Client instance
 * @param {APIConnection} data - Integration data
 * @class
 * @property {Client} #client - Client instance
 * @property {string} id - Integration ID
 * @property {string} name - Integration name
 * @property {string} type - Integration type
 * @property {boolean} revoked? - Has this integration been revoked
 * @property {boolean} verified - Connection is verified
 * @property {boolean} showActivity - Integration show in presence
 * @property {ConnectionVisibility} visibility - Integration visibility
 */
export class Connection {
	#client: Oauth;
	id: string;
	name: string;
	type: string;
	revoked?: boolean;
	verified: boolean;
	friendSync: boolean;
	showActivity: boolean;
	visibility: ConnectionVisibility;
	toWayLink: boolean;
	constructor(client: Oauth, data: APIConnection & { two_way_link: boolean; }) {
		this.#client = client;
		this.id = data.id;
		this.name = data.name;
		this.type = data.type;
		this.revoked = data.revoked;
		this.verified = data.verified;
		this.friendSync = data.friend_sync;
		this.showActivity = data.show_activity;
		this.visibility = data.visibility;
		this.toWayLink = data.two_way_link;
	}
}