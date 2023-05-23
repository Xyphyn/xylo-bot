import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    GatewayIntentBits,
    GuildMember,
    Interaction,
    PermissionsBitField,
} from 'discord.js'
import ora from 'ora'
import { commands, registerCommands } from '@commands/command.js'
import { config as dotenv } from 'dotenv'
import chalk from 'chalk'
import { BotEmoji, Color } from '@config/config.js'
import { PrismaClient } from '@prisma/client'

// starting stuff
dotenv()

const startTime = Date.now()

const spinner = ora({
    text: `${chalk.blue('Starting...')}`,
    color: 'blue',
}).start()

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

await registerCommands()

await client.login(process.env.DISCORD_TOKEN)

export const db = new PrismaClient()

spinner.succeed(`${chalk.green(`Started in ${Date.now() - startTime}ms`)}`)

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction instanceof ChatInputCommandInteraction) {
            const command = commands.get(interaction.commandName)

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

            command?.execute({ interaction, client })
        }
    } catch (error) {
        console.error(error)

        const errorEmbed = new EmbedBuilder()
            .setTitle('Error')
            .setColor(Color.error)
            .setDescription(
                `${BotEmoji.error} There was an error executing the command.`
            )
            .addFields([
                {
                    name: 'Message',
                    value: `\`${error}\``,
                },
            ])

        interaction.channel?.send({
            embeds: [errorEmbed],
        })
    }
})
