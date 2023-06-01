import { SlashSubcommand } from '@commands/command.js'
import { editRolePicker } from '@commands/rolepicker/helpers/edithelpers.js'
import { refreshRolepicker } from '@commands/rolepicker/rolepicker.js'
import { Color } from '@config/config.js'
import { client, db } from 'app.js'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonInteraction,
    EmbedBuilder,
    ModalBuilder,
    RepliableInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'
import { errorEmbed, successEmbed } from 'util/embed.js'

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'edit',
        description: 'Edit a role picker',
        options: [
            {
                type: ApplicationCommandOptionType.Integer,
                name: 'id',
                description: 'The id of the role picker.',
                required: true,
            },
        ],
        dmPermission: false,
    },

    async execute({ interaction }) {
        const id = interaction.options.getInteger('id')!

        editRolePicker(id, interaction)
    },
} as SlashSubcommand
