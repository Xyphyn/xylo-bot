import {
    ApplicationCommandOptionData,
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputApplicationCommandData,
    ChatInputCommandInteraction,
    Client,
    PermissionResolvable,
    REST,
    Routes,
} from 'discord.js'
import ping from '@commands/ping.js'
import moderation from '@commands/moderation/moderation.js'
import translate from '@commands/translate.js'
import color from '@commands/color.js'
import rolepicker from '@commands/rolepicker/rolepicker.js'
import fun from '@commands/fun/fun.js'
import poll from '@commands/poll/poll.js'
import weather from '@commands/weather.js'

export interface Command {
    permission?: bigint
    botpermission?: PermissionResolvable
    // The cooldown (in millis)
    cooldown?: number
}

export interface SlashCommand extends Command {
    metadata: ChatInputApplicationCommandData
    execute: ({
        interaction,
        client,
    }: {
        interaction: ChatInputCommandInteraction
        client: Client
    }) => Promise<boolean | void>
}

export interface SlashSubcommand extends Command {
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

export interface SlashCommandAutocomplete {
    autocomplete: (
        interaction: AutocompleteInteraction
    ) => Promise<boolean | void>
}

export const cooldowns = new Map<string, Map<string, number>>()

const commandList: SlashCommand[] = [
    ping,
    moderation,
    translate,
    color,
    rolepicker,
    fun,
    poll,
    weather,
]

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
                body: commandList.map((c: SlashCommand) => c.metadata),
            }
        )
    } catch (error) {
        console.error(error)

        return false
    }

    return true
}
