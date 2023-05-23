import { SlashSubcommand } from '@commands/command.js'
import { BotEmoji, Color } from '@config/config.js'
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js'

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'unmute',
        description: 'Unmutes/untimes out a certain user.',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                description: 'Who to unmute.',
                required: true,
                name: 'user',
            },
            {
                type: ApplicationCommandOptionType.Boolean,
                description:
                    'Should the unmute message not be public? (Default: False)',
                required: false,
                name: 'silent',
            },
        ],
    },

    async execute({ interaction }) {
        if (!interaction.guild) return false

        const user = interaction.options.getUser('user')!
        const silent = interaction.options.getBoolean('silent') || false

        const member = await interaction.guild.members.fetch({
            user,
        })

        await interaction.deferReply({
            ephemeral: silent,
        })

        member.timeout(null)

        const embed = new EmbedBuilder()
            .setTitle('Unmute')
            .setDescription(`${BotEmoji.success} <@${member.id}> was unmuted.`)
            .setColor(Color.success)

        await interaction.editReply({
            embeds: [embed],
        })
    },
} as SlashSubcommand
