import { SlashSubcommand } from '@commands/command.js'
import play from '@commands/fun/either/play.js'
import submit from '@commands/fun/either/submit.js'
import { ApplicationCommandOptionType } from 'discord.js'

const subcommands = [play, submit]

export default {
    metadata: {
        name: 'wouldyourather',
        description: 'Play a game of would you rather',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: subcommands.map((sc) => sc.metadata),
    },

    async execute({ interaction, client }) {
        subcommands
            .find(
                (sc) => sc.metadata.name == interaction.options.getSubcommand()
            )
            ?.execute({ interaction, client })
    },
} as SlashSubcommand
