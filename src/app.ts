import {
    ActivityType,
    Client,
    EmbedBuilder,
    GatewayIntentBits,
} from 'discord.js'
import ora from 'ora'
import { registerCommands } from '@commands/command.js'
import { config as dotenv } from 'dotenv'
import chalk from 'chalk'
import { Color } from '@config/config.js'
import { PrismaClient } from '@prisma/client'
import interactionHandler from 'events/interaction.js'
import { server } from 'server/server.js'

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
await db.$connect()
spinner.succeed(`${chalk.green(`Started in ${Date.now() - startTime}ms`)}`)

server.listen(process.env.API_PORT ?? 6060)

ora({
    text: chalk.green(`API listening on port ${process.env.API_PORT ?? 6060}`),
}).succeed()

client.user?.setActivity(
    `${client.guilds.cache.size} guild${
        client.guilds.cache.size > 1 ? 's' : ''
    }`,
    {
        type: ActivityType.Watching,
    }
)

client.on('interactionCreate', (i) => interactionHandler.execute(i, client))

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
