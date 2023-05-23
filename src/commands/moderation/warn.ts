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
} from 'discord.js'
import { mute } from './mute.js'
import { deleteWarning } from '@commands/moderation/delwarn.js'

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

        const message = await interaction.deferReply({
            ephemeral: silent,
        })

        const warning = await db.warning.create({
            data: {
                guild_id: interaction.guild.id,
                user_id: user.id,
                reason: reason,
                time: new Date(),
            },
        })

        const buttonId = `xylo:moderation:warn:undo:${interaction.id}`

        const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel('Delete')
                .setCustomId(buttonId)
        )

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
            .setFooter({
                text: `Warning ID: ${warning.id}`,
            })

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow],
        })

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

            await user.send({
                embeds: [
                    embed.setFooter({
                        text: interaction.guild.name,
                        iconURL: interaction.guild.iconURL() || '',
                    }),
                ],
            })
        }

        message
            .awaitMessageComponent({
                dispose: true,
                interactionResponse: message,
                time: 30 * 1000,
            })
            .then(async (int) => {
                await int.deferReply({ ephemeral: silent })

                const embed = await deleteWarning(warning.id, warning.guild_id)

                await int.editReply({
                    embeds: [embed],
                })

                await interaction.editReply({
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().setComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Danger)
                                .setLabel('Delete')
                                .setCustomId('disabled')
                                .setDisabled(true)
                        ),
                    ],
                })
            })
            .catch()
    },
} as SlashSubcommand
