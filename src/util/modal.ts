// automatically create the action rows,
// because normally you have to create an action row

import { ActionRowBuilder, TextInputBuilder } from 'discord.js'

// for EVERY SINGLE COMPONENT
export const modalRows = (...items: TextInputBuilder[]) => {
    return items.map((item) => {
        return new ActionRowBuilder<TextInputBuilder>().setComponents(item)
    })
}
