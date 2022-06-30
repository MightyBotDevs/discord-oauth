import express from 'express';
const router = express.Router();

import { Oauth } from 'discord-oauth';

const Discord = new Oauth({
    clientId: '931224095402623047',
    clientSecret: 'Bpe5TKKS9IsxhlRjO1GZbtQ22pebrEf6',
    token: 'OTMxMjI0MDk1NDAyNjIzMDQ3.YeBUBQ.y30YG27wNQnzhM27Nq6i_I9Mb8U'
});

// @ts-ignore
Discord.setScopes(['identify', 'guilds']);
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
    })

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

    const guilds = await Discord.getGuilds(key).catch(e => {
        console.error(e);
        return null;
    });

    if(!user || !guilds) return res.redirect(Discord.getAuthorizationURL())

    res.json({user, guilds})
});

export = router;
