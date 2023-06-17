import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    InteractionResponse,
    Message,
    MessageComponentType,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    User,
} from 'discord.js'
import { sendError } from 'util/messaging.js'

// these are only used for makeRow
// i'm copying go's style and using a lowercase for
// an unexported interface
interface simpleComponent {
    id?: string
    disabled?: boolean
}

interface buttonComponent extends simpleComponent {
    label: string
    style: ButtonStyle
    emoji?: string
}

interface selectMenu extends simpleComponent {
    maxValues?: number
    minValues?: number
    placeholder: string
}

interface menuItem {
    label: string
    emoji?: string
    description: string
    value: string
}

export function makeStringMenu({
    data,
    items,
}: {
    data: selectMenu
    items: menuItem[]
}) {
    const menu = new StringSelectMenuBuilder({
        maxValues: data.maxValues,
        minValues: data.minValues,
        placeholder: data.placeholder,
    }).addOptions(
        items.map(
            (item) =>
                new StringSelectMenuOptionBuilder({
                    label: item.label,
                    value: item.value,
                    description: item.description,
                    emoji: item.emoji,
                })
        )
    )

    return menu
}

export function makeRow({ buttons }: { buttons?: buttonComponent[] }) {
    const row = new ActionRowBuilder<
        ButtonBuilder | StringSelectMenuBuilder | RoleSelectMenuBuilder
    >()

    if (buttons) {
        row.addComponents(
            // because .setEmoji sucks i have to clutter the code more
            buttons.map((button) => {
                const btn = new ButtonBuilder()
                    .setCustomId(
                        button.id ??
                            Math.floor(Math.random() * 10000).toString()
                    )
                    .setStyle(button.style)
                    .setLabel(button.label)

                if (button.emoji) btn.setEmoji(button.emoji)
                if (button.disabled) btn.setDisabled(button.disabled)

                return btn
            })
        )
    }

    return row
}

export const asDisabled = (
    actionRow: ActionRowBuilder<
        ButtonBuilder | StringSelectMenuBuilder | RoleSelectMenuBuilder
    >
) =>
    actionRow.setComponents(
        actionRow.components.map((c) => c.setDisabled(true))
    )

/**
 * A wrapper for message.awaitMessageComponent
 */
export async function awaitInteraction<T extends MessageComponentType>({
    message,
    user,
}: {
    message: Message | InteractionResponse
    user: User
}) {
    return await message
        .awaitMessageComponent<T>({
            filter: (int) => {
                if (int.user.id != user.id) {
                    int.reply({
                        embeds: [
                            sendError(
                                `That interaction doesn't belong to you.`
                            ),
                        ],
                        ephemeral: true,
                    })

                    return false
                }

                return true
            },
            idle: 60 * 1000,
            dispose: true,
        })
        .catch((_) => undefined)
}
