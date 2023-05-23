import { SlashSubcommand } from '@commands/command.js'
import { BotEmoji, Color } from '@config/config.js'
import { db } from 'app.js'
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js'

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'warn',
        description: 'Warns a certain user.',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                description: 'Who to warn.',
                required: true,
                name: 'user',
            },
            {
                type: ApplicationCommandOptionType.String,
                description: 'Why are they being warned?',
                required: false,
                name: 'reason',
            },
            {
                type: ApplicationCommandOptionType.Boolean,
                description:
                    'Should the warning message not be public? (Default: False)',
                required: false,
                name: 'silent',
            },
        ],
    },

    async execute({ interaction }) {
        if (!interaction.guild) return

        const silent = interaction.options.getBoolean('silent') || false
        const user = interaction.options.getUser('user')!
        const reason =
            interaction.options.getString('reason') || 'No reason provided.'

        await interaction.deferReply({
            ephemeral: silent,
        })

        await db.warning.create({
            data: {
                guild_id: interaction.guild.id,
                user_id: user.id,
                reason: reason,
                time: new Date(),
            },
        })

        const embed = new EmbedBuilder()
            .setTitle(`Warning`)
            .setColor(Color.warning)
            .setDescription(`${BotEmoji.warning} <@${user.id}> was warned`)
            .addFields([
                {
                    name: 'Reason',
                    value: reason,
                },
            ])

        await interaction.editReply({
            embeds: [embed],
        })
    },
} as SlashSubcommand
