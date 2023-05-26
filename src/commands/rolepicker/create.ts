import { SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import { db } from 'app.js'
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js'

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'create',
        description: 'Creates a role picker. (You can create values later.)',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'title',
                description: 'The title for the embed.',
                maxLength: 128,
                required: true,
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'description',
                description: 'The description for the embed.',
                maxLength: 512,
                required: true,
            },
        ],
        dmPermission: false,
    },

    async execute({ interaction }) {
        if (!interaction.guildId || !interaction.channel) return false
        const message = await (
            await interaction.deferReply({ ephemeral: false })
        ).fetch()

        const title = interaction.options.getString('title')!
        const description = interaction.options.getString('description')!

        const selector = await db.roleSelector.create({
            data: {
                guild_id: interaction.guildId,
                channel_id: interaction.channelId,
                message_id: message.id,
            },
        })

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(Color.primary)
            .setFooter({
                text: `Selector ID: ${selector.id} | Use /rolepicker addrole to add a role.`,
            })

        await interaction.editReply({
            embeds: [embed],
        })
    },
} as SlashSubcommand
