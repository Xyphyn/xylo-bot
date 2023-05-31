import {
    ActionRowBuilder,
    BaseSelectMenuBuilder,
    ButtonBuilder,
    StringSelectMenuBuilder,
} from 'discord.js'

export const asDisabled = (actionRow: ActionRowBuilder<ButtonBuilder>) =>
    actionRow.setComponents(
        actionRow.components.map((c) => c.setDisabled(true))
    )
