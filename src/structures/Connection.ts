import { APIConnection, ConnectionVisibility } from 'discord-api-types/v10';
import { Oauth } from '@classes/Oauth';

/**
 * Represents a user's connected account from OAuth2
 */
export class Connection {
	/** OAuth client instance */
	readonly #client: Oauth;

	/** Connection account ID */
	readonly id: string;
	/** Connection account name */
	readonly name: string;
	/** Service of the connection (e.g., 'twitch', 'youtube') */
	readonly type: string;
	/** Whether the connection is revoked */
	readonly revoked?: boolean;
	/** Whether the connection is verified */
	readonly verified: boolean;
	/** Whether friend sync is enabled for this connection */
	readonly friendSync: boolean;
	/** Whether activities related to this connection will be shown in presence */
	readonly showActivity: boolean;
	/** Visibility of this connection */
	readonly visibility: ConnectionVisibility;
	/** Whether this connection has a corresponding third party OAuth2 token */
	readonly twoWayLink: boolean;

	/**
	 * Creates a new Connection instance
	 * @param client - OAuth client instance
	 * @param data - Raw connection data from Discord API
	 */
	constructor(client: Oauth, data: APIConnection & { two_way_link: boolean }) {
		this.#client = client;
		this.id = data.id;
		this.name = data.name;
		this.type = data.type;
		this.revoked = data.revoked;
		this.verified = data.verified;
		this.friendSync = data.friend_sync;
		this.showActivity = data.show_activity;
		this.visibility = data.visibility;
		this.twoWayLink = data.two_way_link;
	}

	/**
	 * Checks if the connection is visible to everyone
	 * @returns Whether the connection is public
	 */
	isPublic(): boolean {
		return this.visibility === ConnectionVisibility.Everyone;
	}

	/**
	 * Converts the connection to a JSON object
	 * @returns Plain object representation
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			revoked: this.revoked,
			verified: this.verified,
			friendSync: this.friendSync,
			showActivity: this.showActivity,
			visibility: this.visibility,
			twoWayLink: this.twoWayLink,
		};
	}

	/**
	 * String representation of the connection
	 * @returns The connection name and type
	 */
	toString(): string {
		return `${this.name} (${this.type})`;
	}
}