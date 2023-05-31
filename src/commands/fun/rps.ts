import { SlashCommand, SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js'
import { asDisabled } from 'util/component.js'

type RPSChoice = 'rock' | 'paper' | 'scissors'

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

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'rockpaperscissors',
        description: 'Play a rock paper scissors match with the bot',
    },

    async execute({ interaction }) {
        const gameButtons = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder({
                customId: 'xylo:fun:rps:rock',
                label: 'Rock',
                style: ButtonStyle.Secondary,
                emoji: '🪨',
            }),
            new ButtonBuilder({
                customId: 'xylo:fun:rps:paper',
                label: 'Paper',
                style: ButtonStyle.Secondary,
                emoji: '📜',
            }),
            new ButtonBuilder({
                customId: 'xylo:fun:rps:scissors',
                label: 'Scissors',
                style: ButtonStyle.Secondary,
                emoji: '✂️',
            })
        )

        const rematch = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder({
                customId: 'xylo:fun:rps:rematch',
                label: 'Rematch',
                style: ButtonStyle.Secondary,
            })
        )

        let embed = new EmbedBuilder({
            title: 'Rock paper scissors',
            description: 'Choose one wisely...',
            color: Color.primary,
        })

        const reply = await interaction.deferReply()

        let row = gameButtons
        let playing = true

        let playerScore = 0
        let opponentScore = 0

        while (playing) {
            row = gameButtons

            if (!(playerScore == 0 && opponentScore == 0)) {
                embed.setFields(
                    {
                        name: 'You',
                        value: `${playerScore}`,
                        inline: true,
                    },
                    {
                        name: 'Opponent',
                        value: `${opponentScore}`,
                        inline: true,
                    }
                )
            }

            await interaction.editReply({
                embeds: [embed],
                components: [row],
            })

            const buttonInt = await reply
                .awaitMessageComponent({
                    filter: (int) => int.user == interaction.user,
                    time: 60 * 1000,
                    dispose: true,
                })
                .catch((err) => {
                    playing = false
                })

            if (!playing || !buttonInt) break

            buttonInt.deferUpdate()

            let choice: RPSChoice = buttonInt.customId
                .split(':')
                .at(-1) as RPSChoice

            let opponentChoice = getRandomChoice()

            const resultsEmbed = new EmbedBuilder({
                title: 'Rock paper scissors',
                fields: [
                    {
                        name: 'Your choice',
                        value: capitalizeFirstLetter(choice),
                    },
                    {
                        name: 'Opponent choice',
                        value: capitalizeFirstLetter(opponentChoice),
                    },
                ],
                color: Color.primary,
            })

            if (beats(choice, opponentChoice)) {
                resultsEmbed.setTitle('**You win! :partying_face:**')
                playerScore += 1
            } else if (beats(opponentChoice, choice)) {
                resultsEmbed.setTitle('**You lose :confused:**')
                opponentScore += 1
            } else {
                resultsEmbed.setTitle("**It's a tie! :no_mouth:**")
            }

            row = rematch

            await interaction.editReply({
                embeds: [resultsEmbed],
                components: [row],
            })

            const rematchInt = await reply
                .awaitMessageComponent({
                    filter: (int) => int.user == interaction.user,
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
