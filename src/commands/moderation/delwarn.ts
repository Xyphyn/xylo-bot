import { SlashSubcommand } from '@commands/command.js'
import { db } from 'app.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { sendError, sendSuccess } from 'util/embed.js'

export async function deleteWarning(id: number, guildId: string) {
    const warning = await db.warning.findFirst({
        where: {
            id: id,
        },
    })

    if (!warning || warning.guild_id != guildId) {
        return sendError(`That warning did not take place in this guild.`)
    }

    await db.warning.delete({
        where: {
            id: id,
        },
    })

    return sendSuccess(`Warning of ID \`${id}\` has been deleted.`)
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
            embeds: [await deleteWarning(id, interaction.guildId!)],
        })
    },
} as SlashSubcommand
