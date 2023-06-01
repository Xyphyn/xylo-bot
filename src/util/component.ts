import {
    ActionRowBuilder,
    BaseSelectMenuBuilder,
    ButtonBuilder,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
} from 'discord.js'

export const asDisabled = (
    actionRow: ActionRowBuilder<
        ButtonBuilder | StringSelectMenuBuilder | RoleSelectMenuBuilder
    >
) =>
    actionRow.setComponents(
        actionRow.components.map((c) => c.setDisabled(true))
    )
