import { SlashSubcommand } from '@commands/command.js'
import { BotEmoji, Color } from '@config/config.js'
import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    GuildMember,
} from 'discord.js'
import { log } from 'util/messaging.js'

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
        dmPermission: false,
    },

    async execute({ interaction }) {
        if (!interaction.guild) return false

        const member = interaction.options.getMember('user')! as GuildMember
        const silent = interaction.options.getBoolean('silent') || false

        await interaction.deferReply({
            ephemeral: silent,
        })

        member.timeout(null)

        const embed = new EmbedBuilder()
            .setTitle('Unmute')
            .setDescription(`${BotEmoji.success} <@${member.id}> was unmuted.`)
            .setColor(Color.success)

        log(interaction.guild, embed)

        await interaction.editReply({
            embeds: [embed],
        })
    },
} as SlashSubcommand
