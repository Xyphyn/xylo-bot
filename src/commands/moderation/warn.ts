import { SlashSubcommand } from '@commands/command.js'
import { BotEmoji, Color } from '@config/config.js'
import { db } from 'app.js'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    GuildMember,
} from 'discord.js'
import { mute } from './mute.js'
import { deleteWarning } from '@commands/moderation/delwarn.js'
import { sendError } from 'util/embed.js'
import { asDisabled, awaitInteraction, makeRow } from 'util/component.js'

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
        dmPermission: false,
    },

    async execute({ interaction }) {
        if (!interaction.guild) return

        const silent = interaction.options.getBoolean('silent') || false
        const user = interaction.options.getMember('user')! as GuildMember
        const reason =
            interaction.options.getString('reason') || 'No reason provided.'

        const message = await interaction.deferReply({
            ephemeral: silent,
        })

        if (!user.moderatable) {
            await interaction.editReply({
                embeds: [
                    sendError(
                        "That user can't be moderated. Do they have a higher permission than the bot?"
                    ),
                ],
            })

            return false
        }

        const warning = await db.warning.create({
            data: {
                guild_id: interaction.guild.id,
                user_id: user.id,
                reason: reason,
                time: new Date(),
            },
        })

        const actionRow = makeRow({
            buttons: [
                {
                    id: 'undo',
                    label: 'Undo',
                    style: ButtonStyle.Danger,
                },
            ],
        })

        const embed = new EmbedBuilder({
            title: 'Warning',
            color: Color.warning,
            description: `${BotEmoji.warning} <@${user.id}> was warned`,
            fields: [
                {
                    name: 'Reason',
                    value: reason,
                },
            ],
            footer: { text: `Warning ID: ${warning.id}` },
        })

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow],
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
            // user probably has DMs disabled, no problem
        }

        const warnings = await db.warning.findMany({
            where: {
                guild_id: interaction.guild.id,
                user_id: user.id,
            },
        })

        if (
            warnings.filter(
                (result) =>
                    Date.now() - result.time.getTime() <= 3 * 60 * 60 * 1000
            ).length >= 3
        ) {
            const member = await interaction.guild.members.fetch({
                user,
            })

            const embed = await mute(member, 60 * 60 * 1000)

            if (!silent) {
                await interaction.channel?.send({
                    embeds: [embed],
                })
            }

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
                // same deal
            }
        }

        const int = await awaitInteraction({
            message: message,
            user: interaction.user,
        })

        if (!int) {
            await interaction.editReply({
                components: [asDisabled(actionRow)],
            })

            return
        }

        await int.deferReply({ ephemeral: silent })

        await int.editReply({
            embeds: [await deleteWarning(warning.id, warning.guild_id)],
        })

        await interaction.editReply({
            components: [asDisabled(actionRow)],
        })
    },
} as SlashSubcommand
