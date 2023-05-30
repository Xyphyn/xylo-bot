import { SlashSubcommand } from '@commands/command.js'
import { refreshRolepicker } from '@commands/rolepicker/rolepicker.js'
import { db } from 'app.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { errorEmbed, successEmbed } from 'util/embed.js'

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'addrole',
        description: 'Adds a role to a role picker.',
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
                description: 'The role to add.',
                required: true,
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'label',
                description: 'The label for the role.',
                maxLength: 64,
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'description',
                description: 'The description of the role.',
                maxLength: 128,
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'emoji',
                description: 'The emoji for the role.',
            },
        ],
        dmPermission: false,
    },

    async execute({ interaction, client }) {
        await interaction.deferReply({ ephemeral: true })

        const id = interaction.options.getInteger('id')!
        const role = interaction.options.getRole('role')!
        const label = interaction.options.getString('label')
        const description = interaction.options.getString('description')
        const emoji = interaction.options.getString('emoji')

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

        if (
            rolepicker.values.find((role) => role.role_id == role.id.toString())
        ) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        `That role is already in the role picker. Use /rolepicker delrole to delete the role.`
                    ),
                ],
            })

            return false
        }

        await db.roleSelectorValues.create({
            data: {
                role_id: role.id,
                label: label ?? role.name,
                description: description,
                emoji: emoji,
                RoleSelector: {
                    connect: {
                        id: rolepicker.id,
                    },
                },
            },
        })

        try {
            await refreshRolepicker(
                rolepicker.message_id,
                rolepicker.channel_id,
                client
            )

            await interaction.editReply({
                embeds: [successEmbed(`The role was successfully added.`)],
            })
        } catch (error: any) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(`There was an error adding that role.`, error),
                ],
            })
        }
    },
} as SlashSubcommand
