import { GuildConfigData, getConfig, refreshConfig } from '@config/config.js'
import { Request, Response } from 'express'
import { AuthUser } from 'server/routes/gated.js'
import t from 'io-ts'
import { isLeft } from 'fp-ts/lib/Either.js'
import { db } from 'app.js'

export default {
    guild: async function (req: Request, res: Response) {
        const guildId = req.params.guildId
        const user: AuthUser = res.locals.user

        const guild = user.guilds.find(
            (guild) => guild.id == guildId && guild.owner
        )
        if (!guild) return res.sendStatus(404)

        const config = await getConfig(guild.id)

        return res.status(200).json({ data: guild, config: config })
    },
    config: async function (req: Request, res: Response) {
        const guildId = req.params.guildId
        const user: AuthUser = res.locals.user

        const guild = user.guilds.find(
            (guild) => guild.id == guildId && guild.owner
        )
        if (!guild) return res.sendStatus(404)

        const data = req.body

        const GuildConfigData = t.type({
            embedColor: t.number,
        })

        const decoded = GuildConfigData.decode(data)
        if (isLeft(decoded)) {
            return res.status(400).send({ message: 'invalid data' })
        } else {
            const decodedConfig: GuildConfigData = decoded.right
            await getConfig(guild.id)

            await db.guildConfig.update({
                where: {
                    id: guild.id,
                },
                data: {
                    config: JSON.stringify(decodedConfig),
                },
            })

            refreshConfig(guild.id)

            return res.status(201).send(decodedConfig)
        }
    },
}
