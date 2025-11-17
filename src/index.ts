// Main OAuth client
export { Oauth, OAuthOptions } from './classes/Oauth';

// Structure classes
export { User } from './structures/User';
export { Guild } from './structures/Guild';
export { Connection } from './structures/Connection';

// Manager classes
export { UserManager } from './managers/UserManager';
export { GuildManager } from './managers/GuildManager';
export { ConnectionManager } from './managers/ConnectionManager';

// Bitfield classes
export { BitField } from './bitfields/BitField';
export { Permissions, PermissionFlagsBits, PermissionType } from './bitfields/Permissions';
export { UserFlags, UserFlagsBits, UserFlagsType } from './bitfields/UserFlags';

// Type definitions
export { CDNOptions } from './types/CDNOptions';
export { OAuthGuild } from './types/OAuthGuild';
export { OAuthUser } from './types/OAuthUser';

// Re-export commonly used types from discord-api-types
export { OAuth2Scopes, ConnectionVisibility } from 'discord-api-types/v10';