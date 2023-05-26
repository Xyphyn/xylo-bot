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
import ping from '@commands/ping.js'
import moderation from '@commands/moderation/moderation.js'
import translate from '@commands/translate.js'
import color from '@commands/color.js'
import rolepicker from '@commands/rolepicker/rolepicker.js'
import fun from '@commands/fun/fun.js'

export interface SlashCommand {
    metadata: ChatInputApplicationCommandData

    permission?: bigint

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

const commandList = [ping, moderation, translate, color, rolepicker, fun]

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
