import { RoleSelector, RoleSelectorValues } from '.prisma/client'
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
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js'
import { asDisabled } from 'util/component.js'

export async function editRolePickerRole(
    rolepicker: RoleSelector & { values: RoleSelectorValues[] },
    interaction: ButtonInteraction | ChatInputCommandInteraction
) {
    const selectMenu =
        new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            roleSelector(rolepicker)
                .setCustomId(`xylo:rolepicker:edit:items:edit:select`)
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

    const selectItem = rolepicker.values.find(
        (item) => item.role_id == selection.values[0]
    )
    if (!selectItem) return
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
            int.deferReply()
            editRolePickerRole(rolepicker, int)
        }
        if (int.customId == 'xylo:rolepicker:edit:items:delete') {
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
