import { SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js'
import { asDisabled, awaitInteraction } from 'util/component.js'

interface ratherResponse {
    option1: string
    option2: string
    option1Votes: number
    option2Votes: number
}

async function retryFetch(url: string, tries = 5) {
    while (tries > 0) {
        try {
            return await fetch(url).then((res) => res.json())
        } catch (error) {
            tries--
        }
    }
}

export default {
    metadata: {
        name: 'wouldyourather',
        description: 'Play a game of would you rather',
        type: ApplicationCommandOptionType.Subcommand,
    },

    async execute({ interaction }) {
        const makeRow = (...buttons: ButtonBuilder[]) =>
            new ActionRowBuilder<ButtonBuilder>().setComponents(buttons)

        let playing = true

        await interaction.deferReply()

        const option1 = new ButtonBuilder({
            label: 'Option 1',
            style: ButtonStyle.Primary,
            customId: 'option1',
        })

        const option2 = new ButtonBuilder({
            label: 'Option 2',
            style: ButtonStyle.Danger,
            customId: 'option2',
        })

        while (playing) {
            const option1 = new ButtonBuilder({
                label: 'Option 1',
                style: ButtonStyle.Primary,
                customId: 'option1',
            })

            const option2 = new ButtonBuilder({
                label: 'Option 2',
                style: ButtonStyle.Danger,
                customId: 'option2',
            })

            const res: ratherResponse = await retryFetch(
                `https://wouldurather.io/question?id=${Math.floor(
                    Math.random() * 350
                )}`,
                50
            )

            if (!res) {
                break
            }

            const embed = new EmbedBuilder({
                description: 'Would you rather...',
                fields: [
                    {
                        name: 'Option 1',
                        value: `**${res.option1}**`,
                    },
                    {
                        name: 'Option 2',
                        value: `**${res.option2}**`,
                    },
                ],
                color: Color.primary,
            })

            const reply = await interaction.editReply({
                embeds: [embed],
                components: [makeRow(option1, option2)],
            })

            const int = await awaitInteraction({
                message: reply,
                user: interaction.user,
            })

            if (!int) {
                playing = false
                break
            }

            int.deferUpdate()

            option1.setLabel(
                `Option 1: ${Math.floor(
                    (res.option1Votes / (res.option1Votes + res.option2Votes)) *
                        100
                )}%`
            )
            option2.setLabel(
                `Option 2: ${Math.floor(
                    (res.option2Votes / (res.option1Votes + res.option2Votes)) *
                        100
                )}%`
            )

            if (int.customId == 'option1') {
                option2.setDisabled(true)
            } else {
                option1.setDisabled(true)
            }

            await interaction.editReply({
                components: [
                    makeRow(
                        option1,
                        option2,
                        new ButtonBuilder({
                            customId: 'Next',
                            label: 'Next',
                            style: ButtonStyle.Secondary,
                        })
                    ),
                ],
                embeds: [
                    embed.setColor(
                        int.customId == 'option1' ? 0x5865f2 : 0xda373c
                    ),
                ],
            })

            const next = await awaitInteraction({
                message: reply,
                user: interaction.user,
            })
            if (!next) {
                playing = false
                break
            }

            next.deferUpdate()
        }

        await interaction.editReply({
            components: [asDisabled(makeRow(option1, option2))],
        })
    },
} as SlashSubcommand
