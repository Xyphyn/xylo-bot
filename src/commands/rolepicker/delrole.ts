import { SlashSubcommand } from '@commands/command.js'
import { refreshRolepicker } from '@commands/rolepicker/rolepicker.js'
import { db } from 'app.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { errorEmbed, successEmbed } from 'util/embed.js'

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'delrole',
        description: 'Removes a role from a role picker.',
        options: [
            {
                type: ApplicationCommandOptionType.Integer,
                name: 'id',
                description:
                    'The ID of the role picker. This is visible on the embed.',
                required: true,
            },
            {
                type: ApplicationCommandOptionType.Role,
                name: 'role',
                description: 'The role to remove.',
                required: true,
            },
        ],
    },

    async execute({ interaction, client }) {
        await interaction.deferReply({ ephemeral: true })

        const id = interaction.options.getInteger('id')!
        const role = interaction.options.getRole('role')!

        const rolepicker = await db.roleSelector.findUnique({
            where: {
                id: id,
            },
            include: {
                values: true,
            },
        })

        if (!rolepicker || rolepicker.guild_id != interaction.guildId) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        `That role picker does not belong to this guild.`
                    ),
                ],
            })

            return false
        }

        const selectorValue = await db.roleSelectorValues.findFirst({
            where: {
                role_id: role.id,
            },
        })

        if (!selectorValue) {
            await interaction.editReply({
                embeds: [errorEmbed(`That role is not in the role picker.`)],
            })

            return false
        }

        await db.roleSelectorValues.delete({
            where: {
                id: selectorValue?.id,
            },
        })

        await refreshRolepicker(
            rolepicker.message_id,
            rolepicker.channel_id,
            client
        )

        await interaction.editReply({
            embeds: [
                successEmbed(`That role was removed from the role picker.`),
            ],
        })
    },
} as SlashSubcommand
