import express from 'express'
import OAuth from 'discord-oauth2'
import { caching } from 'cache-manager'
import chalk from 'chalk'
import { AuthUser } from 'server/routes/gated.js'
import gated from 'server/routes/gated.js'
import guild from 'server/routes/guild.js'
import cors from 'cors'

const oauth = new OAuth({})
const userCache = await caching('memory', {
    ttl: 10 * 60 * 1000,
    max: 300,
})

export async function fetchUser(token: string): Promise<AuthUser | undefined> {
    return await userCache
        .wrap(token, async () => {
            const start = Date.now()
            const user = await oauth.getUser(token)
            const guilds = await oauth.getUserGuilds(token)
            console.log(
                chalk.blue(
                    `☁️ Fetched user ${chalk.bold(
                        user.username
                    )} in ${chalk.bold(
                        ((Date.now() - start) / 1000).toFixed(2)
                    )}s`
                )
            )
            return { guilds: guilds, ...user }
        })
        .catch((_) => undefined)
}

export async function refreshUser(
    token: string
): Promise<AuthUser | undefined> {
    const start = Date.now()
    const user = await oauth.getUser(token)
    const guilds = await oauth.getUserGuilds(token)

    console.log(
        chalk.blue(
            `🔄 Refreshed user ${chalk.bold(user.username)} in ${chalk.bold(
                ((Date.now() - start) / 1000).toFixed(2)
            )}s`
        )
    )

    return { guilds, ...user }
}

export const server = express()

server.use(express.json())
server.use(cors())
server.use('/gated*', gated.middleware)

server.get('/gated', gated.gated)
server.get('/gated/me', gated.me)
server.post('/gated/me/refresh', async function (req, res) {
    const user = await refreshUser(res.locals.token)
    if (!user) {
        res.sendStatus(400)
        return
    }

    return res.status(200).json(user)
})

server.get('/gated/:guildId', guild.guild)
server.get('/ping', async function (req, res) {
    const token = req.header('authorization')

    let authorized = false

    if (token) {
        const user = await fetchUser(token)
        if (user) {
            authorized = true
        }
    }

    return res.status(200).json({
        message: 'Pong!',
        authenticated: authorized,
    })
})
