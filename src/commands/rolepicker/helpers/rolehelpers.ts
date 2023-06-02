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
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'
import { asDisabled } from 'util/component.js'
import { errorEmbed, successEmbed } from 'util/embed.js'
import { modalRows } from 'util/modal.js'
import { isEmoji, getEmoji } from 'emoji-info'

export async function editRolePickerRole(
    rolepicker: RoleSelector & { values: RoleSelectorValues[] },
    interaction: ButtonInteraction | ChatInputCommandInteraction
) {
    const selectMenu =
        new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            roleSelector(rolepicker)
                .setCustomId(`xylo:editrolepicker:edit:items:edit:select`)
                .setMaxValues(1)
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

    const selection = await reply
        .awaitMessageComponent({
            filter: (int) =>
                int.user == interaction.user && int.message.id == reply.id,
            time: 30 * 1000,
            dispose: true,
            componentType: ComponentType.StringSelect,
        })
        .catch((_) => {
            interaction.editReply({
                components: [asDisabled(selectMenu)],
            })
        })
    if (!selection) return

    const selectItemIndex = rolepicker.values.findIndex(
        (item) => item.role_id == selection.values[0]
    )
    const selectItem = rolepicker.values[selectItemIndex]
    if (!selectItem) return

    const modal = new ModalBuilder({
        title: 'Edit role picker',
        customId: `xylo:editrolepicker:edit:items:edit`,
        components: modalRows(
            new TextInputBuilder({
                customId: `label`,
                required: true,
                maxLength: 128,
                placeholder: `Epic role`,
                style: TextInputStyle.Short,
                label: 'Label',
                value: selectItem.label,
            }),
            new TextInputBuilder({
                customId: `description`,
                required: false,
                maxLength: 256,
                placeholder: `A very cool role`,
                style: TextInputStyle.Short,
                label: 'Description',
                value: selectItem.description ?? '',
            }),
            new TextInputBuilder({
                customId: `emoji`,
                required: false,
                maxLength: 128,
                placeholder: `:smiley:`,
                style: TextInputStyle.Short,
                label: 'Emoji',
                value: selectItem.emoji ?? '',
            })
        ),
    })

    await selection.showModal(modal)

    const modalSubmit = await interaction
        .awaitModalSubmit({
            dispose: true,
            time: 3 * 60 * 1000,
        })
        .catch((_) => {})

    if (!modalSubmit) return

    await modalSubmit.deferUpdate()

    const label =
        modalSubmit.fields.getTextInputValue('label') ?? selectItem.label
    const description = modalSubmit.fields.getTextInputValue('description')
    let emoji = modalSubmit.fields.getTextInputValue('emoji')

    if (emoji) {
        if (isEmoji(emoji, true)) {
            emoji = getEmoji(emoji)!.emoji
        } else {
            await interaction.editReply({
                embeds: [errorEmbed(`The provided emoji is invalid.`)],
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
        embeds: [successEmbed(`Successfully updated that role picker.`)],
        components: [],
    })
}

export async function deleteRolePickerRole(
    rolepicker: RoleSelector & { values: RoleSelectorValues[] },
    interaction: ButtonInteraction | ChatInputCommandInteraction
) {
    const selectMenu =
        new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            roleSelector(rolepicker)
                .setCustomId(`xylo:editrolepicker:edit:items:delete:select`)
                .setMaxValues(1)
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

    const selection = await reply
        .awaitMessageComponent({
            filter: (int) =>
                int.user == interaction.user && int.message.id == reply.id,
            time: 30 * 1000,
            dispose: true,
            componentType: ComponentType.StringSelect,
        })
        .catch((_) => {
            interaction.editReply({
                components: [asDisabled(selectMenu)],
            })
        })
    if (!selection) return

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
        embeds: [successEmbed(`Successfully updated that role picker.`)],
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
                customId: `xylo:rolepicker:edit:items:add:select`,
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

    const selection = await reply.awaitMessageComponent({
        filter: (int) =>
            int.user == interaction.user && int.message.id == reply.id,
        time: 30 * 1000,
        dispose: true,
        componentType: ComponentType.RoleSelect,
    })

    if (
        rolepicker.values
            .map((item) => item.role_id)
            .includes(selection.values[0])
    ) {
        await interaction.editReply({
            embeds: [errorEmbed(`That role is already in the role picker.`)],
            components: [],
        })
    }
    await interaction.editReply({
        components: [asDisabled(selectMenu)],
    })

    if (!selection) return

    const modal = new ModalBuilder({
        title: 'Edit role picker',
        customId: `xylo:editrolepicker:edit:items:edit`,
        components: modalRows(
            new TextInputBuilder({
                customId: `label`,
                required: true,
                maxLength: 128,
                placeholder: `Epic role`,
                style: TextInputStyle.Short,
                label: 'Label',
            }),
            new TextInputBuilder({
                customId: `description`,
                required: false,
                maxLength: 256,
                placeholder: `A very cool role`,
                style: TextInputStyle.Short,
                label: 'Description',
            }),
            new TextInputBuilder({
                customId: `emoji`,
                required: false,
                maxLength: 128,
                placeholder: `:smiley:`,
                style: TextInputStyle.Short,
                label: 'Emoji',
            })
        ),
    })

    await selection.showModal(modal)

    const modalSubmit = await interaction
        .awaitModalSubmit({
            dispose: true,
            time: 3 * 60 * 1000,
        })
        .catch((_) => {})

    if (!modalSubmit) return

    await modalSubmit.deferUpdate()

    const label = modalSubmit.fields.getTextInputValue('label')!
    const description = modalSubmit.fields.getTextInputValue('description')
    let emoji = modalSubmit.fields.getTextInputValue('emoji')

    if (emoji) {
        if (isEmoji(emoji, true)) {
            emoji = getEmoji(emoji)!.emoji
        } else {
            await interaction.editReply({
                embeds: [errorEmbed(`The provided emoji is invalid.`)],
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
        embeds: [successEmbed(`Successfully updated that role picker.`)],
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

    const actions = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder({
            customId: 'xylo:rolepicker:edit:items:add',
            label: 'Add',
            style: ButtonStyle.Success,
            disabled: rolepicker.values.length >= 25,
        }),
        new ButtonBuilder({
            customId: 'xylo:rolepicker:edit:items:edit',
            label: 'Edit',
            style: ButtonStyle.Primary,
            disabled: rolepicker.values.length == 0,
        }),
        new ButtonBuilder({
            customId: 'xylo:rolepicker:edit:items:delete',
            label: 'Delete',
            style: ButtonStyle.Danger,
            disabled: rolepicker.values.length == 0,
        })
    )

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
        idle: 30 * 1000,
        dispose: true,
        filter: (int) =>
            int.user.id == interaction.user.id && int.message.id == reply.id,
        componentType: ComponentType.Button,
    })

    collector.on('collect', async (int) => {
        if (int.customId == 'xylo:rolepicker:edit:items:edit') {
            await int.deferReply({ ephemeral: true })
            editRolePickerRole(rolepicker, int)
        }
        if (int.customId == 'xylo:rolepicker:edit:items:add') {
            await int.deferReply({ ephemeral: true })
            addRolePickerRole(rolepicker, int)
        }
        if (int.customId == 'xylo:rolepicker:edit:items:delete') {
            await int.deferReply({ ephemeral: true })
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
