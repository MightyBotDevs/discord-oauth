import { APIGuild } from 'discord-api-types/v10';

export class Guild {
	guild: APIGuild;
	constructor(guild: APIGuild) {
		this.guild = guild;
	}

	get id() {
		return this.guild.id;
	}

	get name() {
		return this.guild.name;
	}

}