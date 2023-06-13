import { Request, Response } from 'express'
import { AuthUser } from 'server/routes/gated.js'

export default {
    guild: function (req: Request, res: Response) {
        const guildId = req.params.guildId
        const user: AuthUser = res.locals.user

        const guild = user.guilds.find(
            (guild) => guild.id == guildId && guild.owner
        )

        if (!guild) res.sendStatus(404)

        return res.status(200).json(guild)
    },
}
