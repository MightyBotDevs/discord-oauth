import { Snowflake } from 'discord-api-types/globals';
import { RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10';

export interface OAuthUser {
    id: Snowflake;
    username: string;
    discriminator: string;
    email?: string | null;
    avatar: string | null;
    banner: string | null;
    banner_color: string | null;
    accent_color: number;
    avatar_decoration: string | null;
    locale: string;
    mfa_enabled: boolean;
    premium_type: number;
    public_flags: number;

    access_token: RESTPostOAuth2AccessTokenResult;
}