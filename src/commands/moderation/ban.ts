import { SlashSubcommand } from '@commands/command.js'
import { BotEmoji, Color } from '@config/config.js'
import {
    ApplicationCommandOptionType,
    ButtonStyle,
    EmbedBuilder,
    GuildMember,
    PermissionsBitField,
} from 'discord.js'
import ms from 'ms'
import { asDisabled, awaitInteraction, makeRow } from 'util/component.js'
import { log, sendError } from 'util/messaging.js'

export default {
    metadata: {
        name: 'ban',
        description: 'Bans a user.',
        options: [
            {
                name: 'user',
                description: 'The member to ban.',
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'reason',
                description: 'Why are you banning that user?',
                type: ApplicationCommandOptionType.String,
                required: false,
            },
            {
                name: 'delete_time',
                description:
                    'How far back should their messages be deleted? (Example: 10m, 14d, 1h) (Max: 14d)',
                type: ApplicationCommandOptionType.String,
                required: false,
            },
            {
                name: 'silent',
                description: 'Whether only you can see the ban message.',
                type: ApplicationCommandOptionType.Boolean,
                required: false,
            },
        ],
        type: ApplicationCommandOptionType.Subcommand,
    },

    permission: PermissionsBitField.Flags.BanMembers,
    botpermission: PermissionsBitField.Flags.BanMembers,

    async execute({ interaction }) {
        const user = interaction.options.getMember('user') as GuildMember
        const delete_time = interaction.options.getString('delete_time')
        const reason = interaction.options.getString('reason')
        const silent = interaction.options.getBoolean('silent') ?? false

        if (!user.moderatable) {
            await interaction.reply({
                embeds: [
                    sendError(`That user has a higher permission than Xylo.`),
                ],
                ephemeral: true,
            })
            return
        }

        let deleteTime = 0

        if (delete_time) {
            try {
                const millis = ms(delete_time)

                if (millis == 0 || !millis) throw Error('Invalid time')

                deleteTime = Math.floor(millis / 1000)
            } catch (error) {
                await interaction.reply({
                    embeds: [
                        sendError(
                            'Invalid time for `delete_time` passed. (Example: `10m`, `2d`, `1h`)'
                        ),
                    ],
                    ephemeral: true,
                })
                return
            }
        }

        if (deleteTime > 14 * 24 * 60 * 60) {
            await interaction.reply({
                embeds: [
                    sendError(
                        'Invalid time for `delete_time` passed. Value must be less than 14 days.'
                    ),
                ],
            })
        }

        const row = makeRow({
            buttons: [
                {
                    label: 'Ban',
                    id: 'ban',
                    style: ButtonStyle.Danger,
                },
                {
                    label: 'Cancel',
                    id: 'cancel',
                    style: ButtonStyle.Secondary,
                },
            ],
        })

        const reply = await interaction.reply({
            ephemeral: silent,
            embeds: [
                new EmbedBuilder({
                    title: 'Confirmation',
                    description: `${BotEmoji.shield} Are you **really** sure you want to ban <@${user.id}>?`,
                    color: Color.error,
                }),
            ],
            components: [row],
        })

        const int = await awaitInteraction({
            message: reply,
            user: interaction.user,
        })

        int?.deferUpdate()

        if (!int || int?.customId == 'cancel') {
            await interaction.editReply({
                components: [asDisabled(row)],
            })

            return
        }

        try {
            await user.ban({
                reason: reason ?? undefined,
                deleteMessageSeconds: deleteTime,
            })

            const embed = new EmbedBuilder({
                color: Color.error,
                title: 'Ban',
                description: `${BotEmoji.shield} <@${user.id}> was banned.`,
                fields: [
                    {
                        name: 'Reason',
                        value: reason || 'No reason provided.',
                    },
                ],
            })

            await interaction.editReply({
                components: [],
                embeds: [embed],
            })

            log(interaction.guild!, embed)
        } catch (error) {
            await interaction.editReply({
                embeds: [
                    sendError(
                        'Failed to ban that user. Do they have a higher permission than Xylo?'
                    ),
                ],
            })

            return
        }
    },
} as SlashSubcommand
