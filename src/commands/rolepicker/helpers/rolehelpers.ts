/**
 * I am sorry for whoever has to read this
 */

import { RoleSelector, RoleSelectorValues } from '.prisma/client'
import { refreshRolepicker } from '@commands/rolepicker/rolepicker.js'
import { Color } from '@config/config.js'
import { db } from 'app.js'
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    ModalBuilder,
    RoleSelectMenuBuilder,
    RoleSelectMenuInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'
import { asDisabled, awaitInteraction, makeRow } from 'util/component.js'
import { sendError, sendSuccess } from 'util/embed.js'
import {
    awaitModal,
    makeModal,
    modalRows,
    parseModalFields,
} from 'util/modal.js'
import { isEmoji, getEmoji } from 'emoji-info'

export async function editRolePickerRole(
    rolepicker: RoleSelector & { values: RoleSelectorValues[] },
    interaction: ButtonInteraction | ChatInputCommandInteraction
) {
    const selectMenu =
        new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            roleSelector(rolepicker).setCustomId(`select`).setMaxValues(1)
        )

    const reply = await interaction.editReply({
        embeds: [
            new EmbedBuilder({
                title: 'Select role',
                description: 'Select the role you want to edit.',
                color: Color.primary,
            }),
        ],
        components: [selectMenu],
    })

    const selection = await awaitInteraction({
        message: reply,
        user: interaction.user,
    })

    if (!selection || !(selection instanceof StringSelectMenuInteraction)) {
        interaction.editReply({
            components: [asDisabled(selectMenu)],
        })
        return
    }

    const selectItemIndex = rolepicker.values.findIndex(
        (item) => item.role_id == selection.values[0]
    )
    const selectItem = rolepicker.values[selectItemIndex]
    if (!selectItem) return

    const modal = makeModal({
        data: {
            title: 'Edit role picker',
            id: 'editmodal',
        },
        inputs: [
            {
                id: 'label',
                label: 'Label',
                value: selectItem.label,
                maxLength: 128,
                required: true,
                placeholder: 'Epic role',
                style: TextInputStyle.Short,
            },
            {
                id: 'description',
                required: false,
                maxLength: 256,
                placeholder: 'A very cool role',
                style: TextInputStyle.Short,
                label: 'Description',
                value: selectItem.description ?? '',
            },
            {
                id: 'emoji',
                required: false,
                maxLength: 128,
                placeholder: ':smiley:',
                style: TextInputStyle.Short,
                label: 'Emoji',
                value: selectItem.emoji ?? '',
            },
        ],
    })

    await selection.showModal(modal)

    const modalSubmit = await awaitModal(selection)

    if (!modalSubmit) return

    await modalSubmit.deferUpdate()

    let [label, description, emoji] = parseModalFields(modalSubmit.fields, [
        'label',
        'description',
        'emoji',
    ])

    if (!label) label = selectItem.label

    if (emoji) {
        if (isEmoji(emoji, true)) {
            emoji = getEmoji(emoji)!.emoji
        } else {
            await interaction.editReply({
                embeds: [sendError(`The provided emoji is invalid.`)],
                components: [],
            })

            return
        }
    }

    selectItem.label = label
    selectItem.description = description
    selectItem.emoji = emoji

    await db.roleSelectorValues.update({
        where: {
            id: selectItem.id,
        },
        data: selectItem,
    })

    await refreshRolepicker(rolepicker.message_id, rolepicker.channel_id)

    await interaction.editReply({
        embeds: [sendSuccess(`Successfully updated that role picker.`)],
        components: [],
    })
}

export async function deleteRolePickerRole(
    rolepicker: RoleSelector & { values: RoleSelectorValues[] },
    interaction: ButtonInteraction | ChatInputCommandInteraction
) {
    const selectMenu =
        new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            roleSelector(rolepicker).setCustomId(`select`).setMaxValues(1)
        )

    const reply = await interaction.editReply({
        embeds: [
            new EmbedBuilder({
                title: 'Select role',
                description: 'Select the role you want to delete.',
                color: Color.primary,
            }),
        ],
        components: [selectMenu],
    })

    const selection = await awaitInteraction({
        message: reply,
        user: interaction.user,
    })
    if (!selection || !(selection instanceof StringSelectMenuInteraction)) {
        interaction.editReply({
            components: [asDisabled(selectMenu)],
        })
        return
    }

    await selection.deferUpdate()

    const selectItem = rolepicker.values.find(
        (item) => item.role_id == selection.values[0]
    )
    if (!selectItem) return

    await db.roleSelectorValues.delete({
        where: {
            id: selectItem.id,
        },
    })

    await refreshRolepicker(rolepicker.message_id, rolepicker.channel_id)

    await interaction.editReply({
        embeds: [sendSuccess(`Successfully updated that role picker.`)],
        components: [],
    })
}

export async function addRolePickerRole(
    rolepicker: RoleSelector & { values: RoleSelectorValues[] },
    interaction: ButtonInteraction | ChatInputCommandInteraction
) {
    const selectMenu =
        new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
            new RoleSelectMenuBuilder({
                customId: `select`,
                maxValues: 1,
                minValues: 1,
            })
        )

    const reply = await interaction.editReply({
        embeds: [
            new EmbedBuilder({
                title: 'Select role',
                description: 'Select the role you want to add.',
                color: Color.primary,
            }),
        ],
        components: [selectMenu],
    })

    const selection = await awaitInteraction({
        message: reply,
        user: interaction.user,
    })

    if (!selection || !(selection instanceof RoleSelectMenuInteraction)) {
        await interaction.editReply({
            components: [asDisabled(selectMenu)],
        })

        return
    }

    if (
        rolepicker.values
            .map((item) => item.role_id)
            .includes(selection.values[0])
    ) {
        await interaction.editReply({
            embeds: [sendError(`That role is already in the role picker.`)],
            components: [],
        })

        return
    }

    const modal = makeModal({
        data: { title: 'Edit role picker', id: 'editmodal' },
        inputs: [
            {
                id: 'label',
                required: true,
                maxLength: 128,
                placeholder: 'Epic role',
                style: TextInputStyle.Short,
                label: 'Label',
            },
            {
                id: 'description',
                required: false,
                maxLength: 256,
                placeholder: 'A very cool role',
                style: TextInputStyle.Short,
                label: 'Description',
            },
            {
                id: 'emoji',
                required: false,
                maxLength: 128,
                placeholder: ':smiley:',
                style: TextInputStyle.Short,
                label: 'Emoji',
            },
        ],
    })

    await selection.showModal(modal)

    const modalSubmit = await awaitModal(selection)

    if (!modalSubmit) return

    await modalSubmit.deferUpdate()

    let [label, description, emoji] = parseModalFields(modalSubmit.fields, [
        'label',
        'description',
        'emoji',
    ])

    if (emoji) {
        if (isEmoji(emoji, true)) {
            emoji = getEmoji(emoji)!.emoji
        } else {
            await interaction.editReply({
                embeds: [sendError(`The provided emoji is invalid.`)],
                components: [],
            })

            return
        }
    }

    await db.roleSelectorValues.create({
        data: {
            role_id: selection.values[0],
            label: label,
            description: description,
            emoji: emoji,
            RoleSelector: {
                connect: {
                    id: rolepicker.id,
                },
            },
        },
    })

    await refreshRolepicker(rolepicker.message_id, rolepicker.channel_id)

    await interaction.editReply({
        embeds: [sendSuccess(`Successfully updated that role picker.`)],
        components: [],
    })
}

export async function editRolePickerRoles(
    id: number,
    interaction: ButtonInteraction | ChatInputCommandInteraction
) {
    const rolepicker = await db.roleSelector.findUnique({
        where: {
            id: id,
        },
        include: {
            values: true,
        },
    })

    if (!rolepicker) return

    const actions = makeRow({
        buttons: [
            {
                id: 'add',
                label: 'Add',
                style: ButtonStyle.Success,
                disabled: rolepicker.values.length >= 25,
            },
            {
                id: 'edit',
                label: 'Edit',
                style: ButtonStyle.Primary,
                disabled: rolepicker.values.length == 0,
            },
            {
                id: 'delete',
                label: 'Delete',
                style: ButtonStyle.Danger,
                disabled: rolepicker.values.length == 0,
            },
        ],
    })

    const reply = await interaction.editReply({
        embeds: [
            new EmbedBuilder({
                title: 'Edit roles',
                description:
                    "What would you like to do with the role picker's items?",
                color: Color.primary,
            }),
        ],
        components: [actions],
    })

    const collector = reply.createMessageComponentCollector({
        time: 14 * 60 * 1000,
        idle: 60 * 1000,
        dispose: true,
        filter: (int) =>
            int.user.id == interaction.user.id && int.message.id == reply.id,
        componentType: ComponentType.Button,
    })

    collector.on('collect', async (int) => {
        await int.deferReply({ ephemeral: true })
        if (int.customId == 'edit') {
            editRolePickerRole(rolepicker, int)
        }
        if (int.customId == 'add') {
            addRolePickerRole(rolepicker, int)
        }
        if (int.customId == 'delete') {
            deleteRolePickerRole(rolepicker, int)
        }
    })

    collector.on('end', () => {
        interaction
            .editReply({
                components: [asDisabled(actions)],
            })
            .catch((_) => {})
    })
}

export function roleSelector(
    rolePicker: RoleSelector & {
        values: RoleSelectorValues[]
    }
) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`xylo:rolepicker:${rolePicker.id}`)
        .setPlaceholder(`Select your roles`)
        .setMaxValues(rolePicker.values.length)
        .setMinValues(0)
        .setOptions(
            rolePicker.values.map((value) => {
                const option = new StringSelectMenuOptionBuilder()
                    .setLabel(value.label)
                    .setValue(value.role_id)

                if (value.description) option.setDescription(value.description)

                if (value.emoji) option.setEmoji(value.emoji)

                return option
            })
        )

    if (rolePicker.unique) {
        selectMenu.setMaxValues(1)
    }

    return selectMenu
}
