import { Snowflake } from 'discord-api-types/globals';

export interface OAuthGuild {
    id: Snowflake;
    name: string;
    icon: string;
    owner: boolean;
    permissions: string;
    features: string[];
}