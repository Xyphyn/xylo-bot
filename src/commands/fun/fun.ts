import { SlashCommand, SlashCommandAutocomplete } from '@commands/command.js'
import cat from '@commands/fun/cat.js'
import either from '@commands/fun/either.js'
import imagi from '@commands/fun/imagi.js'
import reddit from '@commands/fun/reddit.js'
import rps from '@commands/fun/rps.js'

const subcommands = [imagi, reddit, rps, cat, either]

const tags: string[] = await fetch('https://cataas.com/api/tags').then((res) =>
    res.json()
)

export default {
    metadata: {
        name: 'fun',
        description: 'Commands to kill time.',
        options: subcommands.map((sc) => sc.metadata),
    },

    async execute(args) {
        subcommands
            .find(
                (sc) =>
                    sc.metadata.name == args.interaction.options.getSubcommand()
            )
            ?.execute(args)
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused()
        const filtered = tags.filter(
            (tag) =>
                tag.startsWith(focusedValue.toLowerCase()) &&
                tag.length < 100 &&
                tag.length >= 1
        )
        await interaction.respond(
            filtered
                .map((choice) => ({ name: choice, value: choice }))
                .slice(0, 24)
        )
    },
} as SlashCommand & SlashCommandAutocomplete
