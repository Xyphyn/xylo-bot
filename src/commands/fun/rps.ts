import { SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import {
    ApplicationCommandOptionType,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
} from 'discord.js'
import { asDisabled, makeRow } from 'util/component.js'

type RPSChoice = 'rock' | 'paper' | 'scissors'

enum RPSEmoji {
    rock = '🪨',
    paper = '📜',
    scissors = '✂️',
}

function getRandomChoice(): RPSChoice {
    const choices: RPSChoice[] = ['rock', 'paper', 'scissors']
    const randomIndex = Math.floor(Math.random() * choices.length)
    return choices[randomIndex]
}

function beats(choice1: RPSChoice, choice2: RPSChoice): boolean {
    return (
        (choice1 === 'rock' && choice2 === 'scissors') ||
        (choice1 === 'paper' && choice2 === 'rock') ||
        (choice1 === 'scissors' && choice2 === 'paper')
    )
}

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'rockpaperscissors',
        description: 'Play a rock paper scissors match with someone or the bot',
        options: [
            {
                name: 'opponent',
                type: ApplicationCommandOptionType.User,
                description:
                    'Who you want to play with. If empty, will play with the bot.',
                required: false,
            },
        ],
    },

    async execute({ interaction, client }) {
        const opponent = interaction.options.getUser('opponent')

        const gameButtons = makeRow({
            buttons: [
                {
                    id: 'rock',
                    label: 'Rock',
                    style: ButtonStyle.Secondary,
                    emoji: '🪨',
                },
                {
                    id: 'paper',
                    label: 'Paper',
                    style: ButtonStyle.Secondary,
                    emoji: '📜',
                },
                {
                    id: 'scissors',
                    label: 'Scissors',
                    style: ButtonStyle.Secondary,
                    emoji: '✂️',
                },
            ],
        })

        const rematch = makeRow({
            buttons: [
                {
                    id: 'rematch',
                    label: 'Rematch',
                    style: ButtonStyle.Secondary,
                },
            ],
        })

        const embed = new EmbedBuilder({
            title: 'Rock paper scissors',
            description: 'Choose one wisely...',
            color: Color.primary,
        })

        await interaction.deferReply()

        let row = gameButtons
        let playing = true

        let playerScore = 0
        let opponentScore = 0

        while (playing) {
            row = gameButtons

            embed.setFields(
                {
                    name: `${interaction.user.username}`,
                    value: `${playerScore}`,
                    inline: true,
                },
                {
                    name: `${opponent?.username ?? client.user?.username}`,
                    value: `${opponentScore}`,
                    inline: true,
                }
            )

            const reply = await interaction.editReply({
                embeds: [embed],
                components: [row],
            })

            let playerChoice: RPSChoice | undefined
            let opponentChoice: RPSChoice | undefined

            if (!opponent) {
                opponentChoice = getRandomChoice()
            }

            let waiting = true
            while (waiting) {
                const int = await reply
                    .awaitMessageComponent({
                        time: 30 * 1000,
                        dispose: true,
                        filter: (int) =>
                            int.user.id == interaction.user.id ||
                            int.user.id == opponent?.id,
                        componentType: ComponentType.Button,
                    })
                    .catch((_) => {
                        waiting = false
                    })

                if (!waiting || !int) break

                int.deferUpdate()

                const choice = int.customId as RPSChoice

                if (int.user.id == interaction.user.id) playerChoice = choice
                else if (int.user.id == opponent?.id) opponentChoice = choice

                if (playerChoice && opponentChoice) break

                if (opponent) {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder({
                                title: 'Rock paper scissors',
                                description: `Waiting for ${
                                    playerChoice && !opponentChoice
                                        ? `<@${opponent.id}>`
                                        : `<@${interaction.user.id}>`
                                }`,
                                color: Color.primary,
                                fields: [
                                    {
                                        name: `${interaction.user.username}`,
                                        value: `${playerScore}`,
                                        inline: true,
                                    },
                                    {
                                        name: `${
                                            opponent?.username ??
                                            client.user?.username
                                        }`,
                                        value: `${opponentScore}`,
                                        inline: true,
                                    },
                                ],
                            }),
                        ],
                    })
                }
            }

            if (!playing || !(playerChoice && opponentChoice)) break

            const resultsEmbed = new EmbedBuilder({
                title: 'Rock paper scissors',
                fields: [
                    {
                        name: `${interaction.user.username}`,
                        value: `${RPSEmoji[playerChoice]}`,
                        inline: true,
                    },
                    {
                        name: `${opponent?.username ?? client.user?.username}`,
                        value: `${RPSEmoji[opponentChoice]}`,
                        inline: true,
                    },
                ],
                color: Color.primary,
            })

            if (beats(playerChoice, opponentChoice)) {
                resultsEmbed.setDescription(
                    `**${interaction.user.username}** wins! :partying_face:`
                )
                playerScore += 1
            } else if (beats(opponentChoice, playerChoice)) {
                resultsEmbed.setDescription(
                    `**${
                        opponent?.username ?? client.user?.username
                    }** wins! :partying_face:`
                )
                opponentScore += 1
            } else {
                resultsEmbed.setDescription("It's a **tie**! :no_mouth:")
            }

            row = rematch

            await interaction.editReply({
                embeds: [resultsEmbed],
                components: [row],
            })

            const rematchInt = await reply
                .awaitMessageComponent({
                    filter: (int) =>
                        int.user.id == interaction.user.id ||
                        int.user.id == opponent?.id,
                    time: 60 * 1000,
                    dispose: true,
                })
                .catch((_) => {
                    playing = false
                })

            if (!playing || !rematchInt) break

            rematchInt.deferUpdate()

            continue
        }

        await interaction.editReply({
            components: [asDisabled(row)],
        })
    },
} as SlashSubcommand
