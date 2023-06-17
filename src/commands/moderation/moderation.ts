import { SlashCommand } from '@commands/command'
import { PermissionsBitField } from 'discord.js'
import warnings from '@commands/moderation/warnings.js'
import warn from '@commands/moderation/warn.js'
import mute from '@commands/moderation/mute.js'
import delwarn from '@commands/moderation/delwarn.js'
import unmute from '@commands/moderation/unmute.js'
import ban from '@commands/moderation/ban.js'

const subcommands = [warnings, warn, mute, delwarn, unmute, ban]
export default {
    cooldown: 1000,
    subcommands: subcommands,
    metadata: {
        name: 'mod',
        description: 'Commands related to moderation',
        options: subcommands.map((sc) => sc.metadata),
        dmPermission: false,
    },

    permission: PermissionsBitField.Flags.ModerateMembers,
    botpermission: 'ModerateMembers',

    async execute(args) {
        subcommands
            .find(
                (sc) =>
                    args.interaction.options.getSubcommand() == sc.metadata.name
            )
            ?.execute(args)
    },
} as SlashCommand
