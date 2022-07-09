import express from 'express';
const router = express.Router();
import { Oauth } from 'discord-oauth';

const Discord = new Oauth({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    token: process.env.TOKEN
});

// @ts-ignore
Discord.setScopes(['identify', 'guilds', 'guilds.join']);
Discord.setRedirectUri(process.env.URL + '/login/callback');

router.get(`/login/callback`, async function (req, res) {
    const query = req.query.code;

    if (!query) {
        return res.redirect(Discord.getAuthorizationURL())
    }

    const auth: string = await Discord.getAccess(query).catch(e => {
        console.error(e);
        return null;
    })

    if(!auth) return res.redirect(Discord.getAuthorizationURL())

    const user = await Discord.getUser(auth).catch(e => {
        console.error(e);
        return null;
    });

    const guilds = await Discord.getGuilds(auth).catch(e => {
        console.error(e);
        return null;
    });

    if(!user || !guilds) return res.redirect(Discord.getAuthorizationURL())

    req.cookies.set('token', auth)

    res.redirect(process.env.URL)
})

router.get('/', async function(req, res) {

    const key = req.cookies.get("token");
    if (!key) {
        return res.redirect(Discord.getAuthorizationURL())
    }

    const user = await Discord.getUser(key).catch(e => {
        console.error(e);
        return null;
    });

    const guilds = await Discord.getGuilds(key).catch(e => {
        console.error(e);
        return null;
    });

    if(!user || !guilds) return res.redirect(Discord.getAuthorizationURL())

    await user.joinServer(process.env.GUILD_ID).catch(e => e);

    res.json({user, guilds})
});

export = router;
