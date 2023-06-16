import { SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import { RatherGame } from '@prisma/client'
import { db } from 'app.js'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js'
import { asDisabled, awaitInteraction } from 'util/component.js'

interface ratherResponse {
    id: number
    option1: string
    option2: string
    option1Votes: number
    option2Votes: number
    fromDb?: boolean
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

async function fetchQuestion(
    fromDb = false
): Promise<ratherResponse | undefined> {
    if (fromDb) {
        // Prisma doesn't support getting random, so I guess this'll have to do.
        const question = await db.$queryRaw<RatherGame[] | undefined>`SELECT *
        FROM RatherGame
        WHERE public = true
        ORDER BY RAND()
        LIMIT 1;`

        if (question && question[0]) {
            return {
                id: question[0].id,
                option1: question[0].option1,
                option1Votes: question[0].option1votes,
                option2: question[0].option2,
                option2Votes: question[0].option2votes,
                fromDb: true,
            }
        }
    }

    return await retryFetch(
        `https://wouldurather.io/question?id=${Math.floor(
            Math.random() * 350
        )}`,
        50
    )
}

export default {
    metadata: {
        name: 'play',
        description: 'Play a game of would you rather',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                name: 'source',
                description: 'Whether to get the questions from Xylo or an API',
                choices: [
                    {
                        name: 'Xylo (User-submitted)',
                        value: 'true',
                    },
                    {
                        name: 'wouldurather.io (Random)',
                        value: 'false',
                    },
                ],
                type: ApplicationCommandOptionType.String,
                required: false,
            },
        ],
    },

    cooldown: 15 * 1000,

    async execute({ interaction }) {
        const fromDb =
            (interaction.options.getString('source') || 'true') == 'true'

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

            const res: ratherResponse | undefined = await fetchQuestion(fromDb)

            if (!res) {
                break
            }

            const embed = new EmbedBuilder({
                description: 'Would you rather...',
                fields: [
                    {
                        name: 'Option 1',
                        value: ` **${res.option1}**`,
                    },
                    {
                        name: 'Option 2',
                        value: `**${res.option2}**`,
                    },
                ],
                color: Color.primary,
            })

            const buttons = makeRow(option1, option2)

            const reply = await interaction.editReply({
                embeds: [embed],
                components: [buttons],
            })

            const int = await awaitInteraction({
                message: reply,
                user: interaction.user,
            })

            if (!int || int.customId == 'report') {
                playing = false
                break
            }

            int.deferUpdate()

            option1.setLabel(
                `Option 1: ${
                    Math.floor(
                        (res.option1Votes /
                            (res.option1Votes + res.option2Votes)) *
                            100
                    ) || 0
                }%`
            )
            option2.setLabel(
                `Option 2: ${
                    Math.floor(
                        (res.option2Votes /
                            (res.option1Votes + res.option2Votes)) *
                            100
                    ) || 0
                }%`
            )

            if (int.customId == 'option1') option2.setDisabled(true)
            else option1.setDisabled(true)

            const row = makeRow(
                option1,
                option2,
                new ButtonBuilder({
                    customId: 'Next',
                    label: 'Next',
                    style: ButtonStyle.Secondary,
                })
            )

            await interaction.editReply({
                components: [row],
                embeds: [
                    embed.setColor(
                        int.customId == 'option1' ? 0x5865f2 : 0xda373c
                    ),
                ],
            })

            if (int.customId == 'option1' && res.fromDb) {
                await db.ratherGame
                    .update({
                        where: {
                            id: res.id,
                        },
                        data: {
                            option1votes: res.option1Votes + 1,
                        },
                    })
                    .catch((_) => undefined)
            } else if (int.customId == 'option2' && res.fromDb) {
                await db.ratherGame
                    .update({
                        where: {
                            id: res.id,
                        },
                        data: {
                            option2votes: res.option2Votes + 1,
                        },
                    })
                    .catch((_) => undefined)
            }

            const next = await awaitInteraction({
                message: reply,
                user: interaction.user,
            })
            if (!next || next?.customId == 'report') {
                playing = false
                break
            }

            next.deferUpdate()
        }

        await interaction
            .editReply({
                components: [asDisabled(makeRow(option1, option2))],
            })
            .catch((_) => undefined)
    },
} as SlashSubcommand
