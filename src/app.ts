import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    GatewayIntentBits,
    Interaction,
} from 'discord.js'
import ora from 'ora'
import { commands, registerCommands } from './commands/command'
import { config as dotenv } from 'dotenv'
import chalk from 'chalk'
import { createClient } from '@vercel/kv'
import { BotEmoji, Color } from './config/config'

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

export const db = createClient({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
})

spinner.succeed(`${chalk.green(`Started in ${Date.now() - startTime}ms`)}`)

client.on('interactionCreate', async (interaction: Interaction) => {
    try {
        if (interaction instanceof ChatInputCommandInteraction) {
            commands
                .get(interaction.commandName)
                ?.execute({ interaction, client })
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
