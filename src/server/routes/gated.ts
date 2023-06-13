import OAuth, { PartialGuild } from 'discord-oauth2'
import { NextFunction, Request, Response } from 'express'
import { fetchUser } from 'server/server.js'
/**
 * Routes that require authentication
 */

export interface AuthUser extends OAuth.User {
    guilds: PartialGuild[]
}

export default {
    middleware: async function (
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        const token = req.header('authorization')
        if (!token) {
            return res.sendStatus(403)
        }

        const user = await fetchUser(token)
        if (!user) {
            return res.sendStatus(403)
        }

        res.locals.user = user
        res.locals.token = token

        next()
    },
    gated: function (req: Request, res: Response) {
        const user: AuthUser = res.locals.user

        return res.status(200).json({
            message: `Hello, ${user.username}`,
        })
    },
    me: function (req: Request, res: Response) {
        const user: AuthUser = res.locals.user

        return res.status(200).json({
            data: {
                username: user.username,
                guilds: user.guilds.filter((guild) => guild.owner),
            },
        })
    },
}
