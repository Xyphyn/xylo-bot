import { SlashSubcommand } from '@commands/command.js'
import { db } from 'app.js'
import { ApplicationCommandOptionType, Guild } from 'discord.js'
import { log, sendError, sendSuccess } from 'util/messaging.js'

export async function deleteWarning(id: number, guild: Guild) {
    const warning = await db.warning.findFirst({
        where: {
            id: id,
        },
    })

    if (!warning || warning.guild_id != guild.id) {
        return sendError(`That warning did not take place in this guild.`)
    }

    await db.warning.delete({
        where: {
            id: id,
        },
    })

    const embed = sendSuccess(`Warning of ID \`${id}\` has been deleted.`)

    log(guild, embed)

    return embed
}

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'delwarn',
        description: 'Deletes a warning of a certain ID.',
        options: [
            {
                type: ApplicationCommandOptionType.Integer,
                description:
                    'The ID of the warning. Use /warnings to find this.',
                required: true,
                name: 'id',
            },
            {
                type: ApplicationCommandOptionType.Boolean,
                description:
                    'Should the warning deletion message not be public? (Default: False)',
                required: false,
                name: 'silent',
            },
        ],
        dmPermission: false,
    },

    async execute({ interaction }) {
        if (!interaction.guildId) return false

        const id = interaction.options.getInteger('id')!
        const silent = interaction.options.getBoolean('silent') || false

        await interaction.deferReply({ ephemeral: silent })

        await interaction.editReply({
            embeds: [await deleteWarning(id, interaction.guild!)],
        })
    },
} as SlashSubcommand
