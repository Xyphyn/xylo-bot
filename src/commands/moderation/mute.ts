import { SlashSubcommand } from '@commands/command'
import { BotEmoji, Color } from '@config/config.js'
import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    GuildMember,
} from 'discord.js'
import ms from 'ms'
import { errorEmbed } from 'util/embed.js'

export async function mute(
    member: GuildMember,
    millis: number,
    reason?: string
) {
    if (member.moderatable) {
        await member.timeout(millis, reason)

        return new EmbedBuilder()
            .setTitle('Timeout')
            .setDescription(
                `${BotEmoji.warning} <@${member.id}> was timed out for ${ms(
                    millis,
                    { long: true }
                )}.`
            )
            .setColor(Color.warning)
            .addFields([
                {
                    name: 'Reason',
                    value: reason || 'No reason provided.',
                },
            ])
    }

    return new EmbedBuilder()
        .setTitle('Error')
        .setDescription(
            `${BotEmoji.error} <@${member.id}> cannot be timed out. Do they have a higher permission?`
        )
        .setColor(Color.error)
}

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'mute',
        description: 'Mutes/times out a certain user.',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                description: 'Who to mute.',
                required: true,
                name: 'user',
            },
            {
                type: ApplicationCommandOptionType.String,
                description:
                    'How long should they be muted? (3d, 4h, 10m, etc)',
                required: true,
                name: 'time',
            },
            {
                type: ApplicationCommandOptionType.String,
                description: 'Why are they being muted?',
                required: false,
                name: 'reason',
            },
            {
                type: ApplicationCommandOptionType.Boolean,
                description:
                    'Should the mute message not be public? (Default: False)',
                required: false,
                name: 'silent',
            },
        ],
        dmPermission: false,
    },

    async execute({ interaction }) {
        if (!interaction.guild) return

        const silent = interaction.options.getBoolean('silent') || false
        const user = interaction.options.getUser('user')!
        const reason =
            interaction.options.getString('reason') || 'No reason provided.'
        const time = interaction.options.getString('time')!

        const timeoutMs = ms(time)

        await interaction.deferReply({
            ephemeral: silent,
        })

        const member = await interaction.guild.members.fetch({
            user,
        })

        if (!member.moderatable) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        "That user can't be moderated. Do they have a higher permission than the bot?"
                    ),
                ],
            })

            return false
        }

        const embed = await mute(member, timeoutMs, reason)

        await interaction.editReply({
            embeds: [embed],
        })

        try {
            await user.send({
                embeds: [
                    embed.setFooter({
                        text: interaction.guild.name,
                        iconURL: interaction.guild.iconURL() || '',
                    }),
                ],
            })
        } catch (error) {
            // user has DMs disabled
        }
    },
} as SlashSubcommand
