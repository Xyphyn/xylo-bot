import {
    ActionRowBuilder,
    ComponentType,
    ModalBuilder,
    TextInputBuilder,
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
                })
            )
        )
    )

    return modal
}
