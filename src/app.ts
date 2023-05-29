import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    GatewayIntentBits,
    GuildMember,
    Interaction,
    PermissionsBitField,
    SlashCommandBuilder,
} from 'discord.js'
import ora from 'ora'
import { commands, cooldowns, registerCommands } from '@commands/command.js'
import { config as dotenv } from 'dotenv'
import chalk from 'chalk'
import { BotEmoji, Color } from '@config/config.js'
import { PrismaClient } from '@prisma/client'
import interactionHandler from 'events/interaction.js'
import { errorEmbed } from 'util/embed.js'

// starting stuff
dotenv()

const startTime = Date.now()

const spinner = ora({
    text: `${chalk.blue('Starting...')}`,
    color: 'blue',
}).start()

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessageReactions,
    ],
})

await registerCommands()
await client.login(process.env.DISCORD_TOKEN)
export const db = new PrismaClient()

spinner.succeed(`${chalk.green(`Started in ${Date.now() - startTime}ms`)}`)

client.on('interactionCreate', async (interaction) => {
    interactionHandler.execute({ interaction })

    if (interaction instanceof ChatInputCommandInteraction) {
        const command = commands.get(interaction.commandName)

        if (!command) return
        if (!cooldowns.has(command.metadata.name)) {
            cooldowns.set(command.metadata.name, new Map())
        }

        const now = Date.now()
        const timestamps = cooldowns.get(command.metadata.name)!
        const cooldown = command.cooldown ?? 300

        if (timestamps.has(interaction.user.id)) {
            if (now < timestamps.get(interaction.user.id)!) {
                interaction.reply({
                    embeds: [
                        errorEmbed(
                            `You are on cooldown for that command. You can use it again <t:${Math.floor(
                                timestamps.get(interaction.user.id)! / 1000
                            )}:R>.`
                        ),
                    ],

                    ephemeral: true,
                })

                return
            }
        }

        timestamps.set(interaction.user.id, now + cooldown)

        if (interaction.memberPermissions) {
            if (
                !interaction.memberPermissions.has(
                    command?.permission ??
                        PermissionsBitField.Flags.SendMessages
                )
            ) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Missing permission')
                    .setColor(Color.error)
                    .setDescription(
                        `${BotEmoji.error} You don't have permission to use that command.`
                    )

                await interaction.reply({
                    embeds: [errorEmbed],
                })

                return
            }
        }

        command.execute({ interaction, client }).catch((err) => {
            console.error(err)

            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setColor(Color.error)
                .setDescription(
                    `${BotEmoji.error} There was an error executing the command.`
                )
                .addFields([
                    {
                        name: 'Message',
                        value: `\`\`\`${err}\`\`\``,
                    },
                ])

            if (interaction.isRepliable()) {
                interaction.editReply({
                    embeds: [errorEmbed],
                })
            }

            if (!interaction.isRepliable()) {
                // @ts-ignore
                interaction.channel?.send({
                    embeds: [errorEmbed],
                })
            }
        })
    }
})

client.on('error', (err) => {
    console.error(err)
})

process.on('unhandledRejection', (err) => {
    console.log(err)
})

process.on('uncaughtException', (err) => {
    console.log(err)
})
