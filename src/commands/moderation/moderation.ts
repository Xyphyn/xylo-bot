import { SlashCommand } from '@commands/command'
import { PermissionsBitField } from 'discord.js'
import warnings from '@commands/moderation/warnings.js'
import warn from '@commands/moderation/warn.js'

const subcommands = [warnings, warn]

export default {
    metadata: {
        name: 'mod',
        description: 'Commands related to moderation',
        options: subcommands.map((sc) => sc.metadata),
    },

    permission: PermissionsBitField.Flags.ModerateMembers,

    async execute(args) {
        subcommands
            .find(
                (sc) =>
                    args.interaction.options.getSubcommand() == sc.metadata.name
            )
            ?.execute(args)
    },
} as SlashCommand
