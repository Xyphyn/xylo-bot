import { getConfig } from '@config/config.js'
import { Request, Response } from 'express'
import { AuthUser } from 'server/routes/gated.js'

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
}
