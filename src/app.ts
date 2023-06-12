import {
    ActivityType,
    Client,
    EmbedBuilder,
    GatewayIntentBits,
    PermissionsBitField,
} from 'discord.js'
import ora from 'ora'
import {
    SlashCommandAutocomplete,
    commands,
    cooldowns,
    registerCommands,
} from '@commands/command.js'
import { config as dotenv } from 'dotenv'
import chalk from 'chalk'
import { BotEmoji, Color } from '@config/config.js'
import { PrismaClient } from '@prisma/client'
import interactionHandler from 'events/interaction.js'
import { sendError } from 'util/embed.js'

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

client.user?.setActivity(
    `${client.guilds.cache.size} guild${
        client.guilds.cache.size > 1 ? 's' : ''
    }`,
    {
        type: ActivityType.Watching,
    }
)

client.on('interactionCreate', async (interaction) => {
    interactionHandler.execute({ interaction })

    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName)

        if (!command) return
        if (!cooldowns.has(command.metadata.name)) {
            cooldowns.set(command.metadata.name, new Map())
        }

        if (command.botpermission != undefined) {
            if (
                interaction.guild?.members.me?.permissions.has(
                    command.botpermission
                ) == false
            ) {
                interaction.reply({
                    ephemeral: true,
                    embeds: [
                        sendError(
                            `I need the \`${command.botpermission.toString()}\` permission to run that.`
                        ),
                    ],
                })
            }
        }

        const now = Date.now()
        const timestamps = cooldowns.get(command.metadata.name)!
        const cooldown = command.cooldown ?? 300

        if (timestamps.has(interaction.user.id)) {
            if (now < timestamps.get(interaction.user.id)!) {
                interaction.reply({
                    embeds: [
                        sendError(
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
                    ephemeral: true,
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

            interaction.channel?.send({
                embeds: [errorEmbed],
            })
        })
    } else if (interaction.isAutocomplete()) {
        const command = commands.get(interaction.commandName) as
            | SlashCommandAutocomplete
            | undefined

        if (!command) return

        command.autocomplete(interaction)
    }
})

const exceptionEmbed = (err: Error) =>
    new EmbedBuilder({
        title: 'Error',
        description: 'An unhandled exception was caught.',
        fields: [
            {
                name: 'Message',
                value: `\`\`\`${err}\`\`\``,
            },
        ],
        timestamp: new Date(),
        color: Color.error,
    })

client.on('error', (err) => {
    console.error(err)

    if (process.env.LOG_CHANNEL!) {
        client.channels.fetch(process.env.LOG_CHANNEL).then((channel) => {
            if (channel?.isTextBased()) {
                channel.send({ embeds: [exceptionEmbed(err)] })
            }
        })
    }
})

process.on('unhandledRejection', (err: Error) => {
    console.log(err)

    if (process.env.LOG_CHANNEL) {
        client.channels.fetch(process.env.LOG_CHANNEL).then((channel) => {
            if (channel?.isTextBased()) {
                channel.send({ embeds: [exceptionEmbed(err)] })
            }
        })
    }
})

process.on('uncaughtException', (err: Error) => {
    console.log(err)

    if (process.env.LOG_CHANNEL) {
        client.channels.fetch(process.env.LOG_CHANNEL).then((channel) => {
            if (channel?.isTextBased()) {
                channel.send({ embeds: [exceptionEmbed(err)] })
            }
        })
    }
})

process.on('SIGINT', () => {
    console.log('\nGracefully shutting down...')
    client.destroy()
    process.exit(0)
})
