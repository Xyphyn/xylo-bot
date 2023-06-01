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

    const selectMenu =
        new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            roleSelector(rolepicker)
        )

    await interaction.editReply({
        embeds: [
            new EmbedBuilder({
                title: 'Select role',
                description: 'Select the role you want to edit.',
                color: Color.primary,
            }),
        ],
        components: [selectMenu],
    })
}

export async function editRolePickerRoles(
    id: number,
    interaction: ButtonInteraction | ChatInputCommandInteraction
) {
    const actions = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder({
            customId: 'xylo:rolepicker:edit:items:add',
            label: 'Add',
            style: ButtonStyle.Success,
        }),
        new ButtonBuilder({
            customId: 'xylo:rolepicker:edit:items:edit',
            label: 'Edit',
            style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
            customId: 'xylo:rolepicker:edit:items:delete',
            label: 'Delete',
            style: ButtonStyle.Danger,
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
        filter: (int) => int.user.id == interaction.user.id,
        componentType: ComponentType.Button,
    })

    collector.on('collect', async (int) => {
        int.deferUpdate()
        if (int.customId == 'xylo:rolepicker:edit:items:edit') {
            editRolePickerRole(id, interaction)
        }
    })

    collector.on('end', () => {
        interaction.editReply({
            components: [asDisabled(actions)],
        })
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
