import { APIUser } from 'discord-api-types/v10'
import jwt from 'jsonwebtoken'

export class Oauth {
    clientSecret: String;
    clientId: String;
    APIURL: String;
    constructor(id: String, secret: String) {
        this.clientSecret = secret
        this.clientId = id
        this.APIURL = 'https://discord.com/api/v10/'
    };

    async getUser(accessKey: String): Promise<APIUser | Number| Error> {
        try {
            const access = jwt.verify(accessKey, this.clientSecret);
    
            const res = await fetch(`${this.APIURL}/users/@me`, {
                method: "GET",
                headers: {
                    "Authorization": `${access["token_type"]} ${access["access_token"]}`
                }
            })
            if(res.status !== 200) return res.status;
            const user = await res.json();
    
            return user as APIUser;
        } catch (error) {
            return error;
        }
    }
}