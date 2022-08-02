# Discord Oauth
Simple library to interact with Discord's OAuth2 API.

For more information about OAuth2, see [the official documentation](https://discord.com/developers/docs/topics/oauth2).

### Example 
Example webserver using [express](https://expressjs.com/) and library can be found on [express branch](https://github.com/MightyBotDevs/discord-oauth/tree/express)


### Installing
```shell
npm install discord-auth2
```

### Usage
```javascript
import { OAuth } from 'discord-auth2';
const Discord = new OAuth({
    clientId: '123456789012345678',
    clientSecret: '123456789012345678',
    token: 'TOKEN'
});

Discord.setScopes(['identify', 'guilds', 'guilds.join', 'connections']);
Discord.setRedirectUri('http://localhost:3000/login/callback');
```

After authorize the application, you will be redirected to the redirect URI.
Using e.g. [Express](https://expressjs.com/en/), you can get the code from the query string.

```javascript
const query = req.query.code;
```

Then, you can use the code to get the access token.

```javascript
const token = await Discord.getAccessToken(query).catch(err => {
    console.log(err);
});
```

To get user information, you can use the access token.

```javascript
const user = await Discord.getUser(token).catch(err => {
    console.log(err);
});
```

For user guilds you can getGuilds function

```javascript
const guilds = await Discord.getGuilds(token).catch(err => {
    console.log(err);
});
```

For user connections you can getGuilds function

```javascript
const guilds = await Discord.getUserConnections(token).catch(err => {
    console.log(err);
});
```

To add user to guild (scope guilds.join) you can use the joinServer with guild_id parametr function for more information check [the official documentation](https://discord.com/developers/docs/resources/guild#add-guild-member)

```javascript
user.joinServer('123456789012345678').catch(err => {
    console.log(err);
});
```

<hr>

# Contributing

All contributions are welcome.

<hr>

For any questions, you can contact me on [Discord](https://discord.gg/EH7SgSCFSd).

