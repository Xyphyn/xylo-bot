import { SlashCommand } from '@commands/command.js'
import imagi from '@commands/fun/imagi.js'

const subcommands = [imagi]

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
} as SlashCommand
