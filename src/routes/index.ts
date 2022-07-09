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
Discord.setRedirectUri('http://localhost:3000/login/callback');

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

    res.redirect("http://localhost:3000/")
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

    const guilds = await Discord.getGuilds(key);

    if(!user || !guilds) return res.redirect(Discord.getAuthorizationURL())

    await user.joinServer('742114424848122026').catch(e => e)

    res.json({user, guilds})
});

export = router;
