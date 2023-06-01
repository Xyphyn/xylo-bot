import { SlashCommand } from '@commands/command.js'
import addrole from '@commands/rolepicker/addrole.js'
import create from '@commands/rolepicker/create.js'
import delrole from '@commands/rolepicker/delrole.js'
import edit from '@commands/rolepicker/edit.js'
import { editRolePicker } from '@commands/rolepicker/helpers/edithelpers.js'
import { ButtonBuilder, ComponentType } from 'discord.js'
import { client, db } from 'app.js'
import {
    ActionRowBuilder,
    ButtonInteraction,
    ButtonStyle,
    Client,
    EmbedBuilder,
    MessageComponentInteraction,
    PermissionsBitField,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder,
} from 'discord.js'
import { registerInteractionListener } from 'events/interaction.js'
import { errorEmbed, successEmbed } from 'util/embed.js'
import { Color } from '@config/config.js'
import { asDisabled } from 'util/component.js'
import { editRolePickerRoles } from '@commands/rolepicker/helpers/rolehelpers.js'

registerInteractionListener({
    filter: (interaction) =>
        interaction instanceof MessageComponentInteraction &&
        interaction.customId.startsWith(`xylo:rolepicker`),
    execute: async (interaction) => {
        if (interaction instanceof StringSelectMenuInteraction) {
            handleSelection(interaction)
        } else if (interaction instanceof ButtonInteraction) {
            handleClick(interaction)
        }
    },
})

async function handleClick(interaction: ButtonInteraction) {
    if (!interaction.guild) return

    const selector = await db.roleSelector.findFirst({
        where: {
            message_id: interaction.message.id,
        },
        include: {
            values: true,
        },
    })

    if (!selector) return

    const actions = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder({
            custom_id: 'xylo:rolepicker:edit:rolepicker',
            label: 'Embed',
            style: ButtonStyle.Secondary,
        }),
        new ButtonBuilder({
            custom_id: 'xylo:rolepicker:edit:items',
            label: 'Roles',
            style: ButtonStyle.Secondary,
        })
    )

    const reply = await interaction.reply({
        ephemeral: true,
        embeds: [
            new EmbedBuilder({
                color: Color.primary,
                title: 'Edit role picker',
                description:
                    'What part of this role picker would you like to edit?',
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
        if (int.customId == 'xylo:rolepicker:edit:rolepicker')
            await editRolePicker(selector.id, int)
        else if (int.customId == 'xylo:rolepicker:edit:items')
            await editRolePickerRoles(selector.id, int)
    })

    collector.on('end', () => {
        interaction.editReply({
            components: [asDisabled(actions)],
        })
    })
}

async function handleSelection(interaction: StringSelectMenuInteraction) {
    if (!interaction.guild) return

    await interaction.deferReply({ ephemeral: true })

    const selector = await db.roleSelector.findFirst({
        where: {
            message_id: interaction.message.id,
        },
        include: {
            values: true,
        },
    })

    if (!selector) {
        await interaction.editReply({
            embeds: [
                errorEmbed(
                    `That role picker isn't in the database. This is an error on our side.`
                ),
            ],
        })

        return
    }

    const member = await interaction.guild.members.fetch(interaction.user)

    for (const value of selector.values) {
        try {
            if (interaction.values.includes(value.role_id.toString())) {
                await member.roles.add(value.role_id)
            } else {
                await member.roles.remove(value.role_id)
            }
        } catch (error) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        `Attempted to give you the selected roles, but failed.\
                        Make sure that the bot's role is **higher** than the\
                        role you are trying to grant, on the role list.`
                    ),
                ],
            })

            return
        }
    }

    await interaction.editReply({
        embeds: [successEmbed(`Successfully updated your roles.`)],
    })
}

export async function refreshRolepicker(
    messageId: string,
    channelId: string,
    _client?: Client
) {
    const channel = await client.channels.fetch(channelId)

    if (!channel || !channel?.isTextBased()) {
        return
    }

    const message = await channel.messages.fetch(messageId)
    const rolePicker = await db.roleSelector.findFirst({
        where: {
            message_id: message.id,
        },
        include: {
            values: true,
        },
    })

    if (!rolePicker) return

    if (rolePicker.values.length >= 1) {
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

                    if (value.description)
                        option.setDescription(value.description)

                    if (value.emoji) option.setEmoji(value.emoji)

                    return option
                })
            )

        if (rolePicker.unique) {
            selectMenu.setMaxValues(1)
        }

        await message.edit({
            components: [
                new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                    selectMenu
                ),
                new ActionRowBuilder<ButtonBuilder>().setComponents(
                    new ButtonBuilder({
                        custom_id: 'xylo:rolepicker:edit',
                        style: ButtonStyle.Secondary,
                        label: 'Edit',
                    })
                ),
            ],
        })
    } else {
        await message.edit({
            components: [],
        })
    }
}

const subcommands = [create, addrole, delrole, edit]

export default {
    cooldown: 3000,
    metadata: {
        name: 'rolepicker',
        description: 'Role picker commands',
        options: subcommands.map((sc) => sc.metadata),
        dmPermission: false,
    },

    permission: PermissionsBitField.Flags.Administrator,

    async execute(args) {
        subcommands
            .find(
                (sc) =>
                    sc.metadata.name == args.interaction.options.getSubcommand()
            )
            ?.execute(args)
    },
} as SlashCommand
