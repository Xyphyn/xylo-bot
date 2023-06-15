import { GuildConfigData, getConfig, refreshConfig } from '@config/config.js'
import { NextFunction, Request, Response } from 'express'
import { AuthUser } from 'server/routes/gated.js'
import t from 'io-ts'
import { isLeft } from 'fp-ts/lib/Either.js'
import { client, db } from 'app.js'
import { PartialGuild } from 'discord-oauth2'
import { ChannelType } from 'discord.js'

export default {
    middleware: async function (
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        const guildId = req.params.guildId
        const user: AuthUser = res.locals.user

        const guild = user.guilds.find(
            (guild) => guild.id == guildId && guild.owner
        )
        if (!guild) return res.sendStatus(404)

        res.locals.guild = guild

        next()
    },
    guild: async function (req: Request, res: Response) {
        const guild: PartialGuild = res.locals.guild

        const config = await getConfig(guild.id).catch((_) =>
            res.sendStatus(404)
        )
        if (res.statusCode == 404) return

        return res.status(200).json({ data: guild, config: config })
    },
    channels: async function (req: Request, res: Response) {
        const partial = res.locals.guild

        const guild = await client.guilds.fetch(partial.id).catch((_) => {
            res.status(404)
        })

        if (res.statusCode == 404 || !guild) return

        const channels = guild.channels.cache.filter(
            (channel) =>
                channel.type == ChannelType.GuildText ||
                channel.type == ChannelType.GuildAnnouncement
        )

        return res.status(200).json(channels.map((channel) => channel))
    },
    config: async function (req: Request, res: Response) {
        const guild: PartialGuild = res.locals.guild

        const data = req.body

        const GuildConfigData = t.type({
            embedColor: t.number,
            logging: t.type({
                enabled: t.boolean,
                channel: t.union([t.string, t.undefined]),
            }),
        })

        const decoded = GuildConfigData.decode(data)
        if (isLeft(decoded)) {
            return res.status(400).send({ message: 'invalid data' })
        } else {
            const decodedConfig: GuildConfigData = decoded.right
            await getConfig(guild.id)

            try {
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
            } catch (error) {
                return res.status(400).send({ message: 'invalid data' })
            }
        }
    },
}
