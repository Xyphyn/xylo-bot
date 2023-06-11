import {
    ActionRowBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    ComponentType,
    Interaction,
    Message,
    ModalBuilder,
    ModalSubmitFields,
    RepliableInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'

// automatically create the action rows,
// because normally you have to create an action row
// for EVERY SINGLE COMPONENT
export const modalRows = (...items: TextInputBuilder[]) => {
    return items.map((item) => {
        return new ActionRowBuilder<TextInputBuilder>().setComponents(item)
    })
}

interface textInput {
    id: string
    label: string
    placeholder: string
    maxLength?: number
    minLength?: number
    value?: string
    style: TextInputStyle
    required?: boolean
}

interface modalData {
    id?: string
    title: string
}

export function makeModal({
    data,
    inputs,
}: {
    data: modalData
    inputs: textInput[]
}) {
    const modal = new ModalBuilder({
        customId: data.id ?? Math.floor(Math.random() * 10000).toString(),
        title: data.title,
    })

    modal.addComponents(
        inputs.map((input) =>
            new ActionRowBuilder<TextInputBuilder>().setComponents(
                new TextInputBuilder({
                    customId: input.id,
                    label: input.label,
                    maxLength: input.maxLength,
                    minLength: input.minLength,
                    placeholder: input.placeholder,
                    value: input.value,
                    type: ComponentType.TextInput,
                    style: input.style,
                    required: input.required,
                })
            )
        )
    )

    return modal
}

export async function awaitModal(
    interaction: ChatInputCommandInteraction | ButtonInteraction
) {
    return await interaction
        .awaitModalSubmit({
            dispose: true,
            time: 14 * 60 * 1000,
        })
        .catch((_) => {})
}

export function parseModalFields(
    fields: ModalSubmitFields,
    inputIds: string[]
) {
    return inputIds.map((id) => fields.getTextInputValue(id))
}
