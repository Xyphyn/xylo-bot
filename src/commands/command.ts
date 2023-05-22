import {
    ApplicationCommandOptionData,
    ApplicationCommandOptionType,
    ApplicationCommandSubCommandData,
    ChatInputApplicationCommandData,
    ChatInputCommandInteraction,
    Client,
    REST,
    Routes,
} from 'discord.js'
import hello from './ping'

export interface SlashCommand {
    metadata: ChatInputApplicationCommandData

    execute: ({
        interaction,
        client,
    }: {
        interaction: ChatInputCommandInteraction
        client: Client
    }) => Promise<boolean | void>
}

export interface SlashSubcommand {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand
        name: string
        description: string
        options: ApplicationCommandOptionData[] | undefined
    }

    execute: ({
        interaction,
        client,
    }: {
        interaction: ChatInputCommandInteraction
        client: Client
    }) => Promise<boolean | void>
}

const commandList = [hello]

export const commands = new Map<string, SlashCommand>(
    commandList.map((command) => [command.metadata.name, command])
)

export async function registerCommands(): Promise<boolean> {
    if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID)
        return false

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN)

    try {
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            {
                body: commandList.map((command) => command.metadata),
            }
        )
    } catch (error) {
        console.error(error)

        return false
    }

    return true
}
