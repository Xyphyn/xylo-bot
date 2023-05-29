import { SlashSubcommand } from '@commands/command.js'
import { refreshRolepicker } from '@commands/rolepicker/rolepicker.js'
import { Color } from '@config/config.js'
import { db } from 'app.js'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'
import { errorEmbed, successEmbed } from 'util/embed.js'

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'edit',
        description: 'Edit a role picker',
        options: [
            {
                type: ApplicationCommandOptionType.Integer,
                name: 'id',
                description: 'The id of the role picker.',
                required: true,
            },
        ],
        dmPermission: false,
    },

    async execute({ interaction, client }) {
        const id = interaction.options.getInteger('id')!

        const modal = new ModalBuilder()
            .setCustomId(`xylo:rolepicker:create:modal`)
            .setTitle(`Create role picker`)

        const row1 = new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
                .setLabel('Title')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(`The title of the embed`)
                .setCustomId(`title`)
                .setMaxLength(128)
                .setRequired(true)
        )

        const row2 = new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
                .setLabel('Description')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(`The description of the embed`)
                .setCustomId(`description`)
                .setMaxLength(512)
                .setRequired(true)
        )

        const row3 = new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
                .setLabel('Unique')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(`1 role at max (true/false) (default: false)`)
                .setCustomId(`unique`)
                .setMaxLength(5)
                .setMinLength(4)
                .setRequired(false)
        )

        modal.setComponents(row1, row2, row3)

        await interaction.showModal(modal)

        try {
            // I'm pretty sure this is a bad practice but we're
            // returning if modalSubmit ends up not existing
            // so i'd say it's okay
            var modalSubmit = await interaction.awaitModalSubmit({
                time: 3 * 60 * 1000,
                dispose: true,
            })
        } catch (error) {
            // User didn't respond in time. Just ignore it.
            return
        }

        await modalSubmit.deferReply({ ephemeral: true })

        const title = modalSubmit.fields.getTextInputValue('title')!
        const description = modalSubmit.fields.getTextInputValue('description')!
        const uniqueText =
            modalSubmit.fields.getTextInputValue('unique') || 'false'

        let unique = uniqueText.toLowerCase() == 'true' ? true : false

        const rolepicker = await db.roleSelector.findFirst({
            where: {
                id: id,
            },
        })

        if (!rolepicker || rolepicker.guild_id != interaction.guildId) {
            await modalSubmit.editReply({
                embeds: [errorEmbed(`That rolepicker isn't in this guild.`)],
            })

            return
        }

        try {
            const channel = await client.channels.fetch(rolepicker.channel_id)

            if (!channel || !channel.isTextBased()) {
                throw Error('Missing role picker')
            }

            const message = await channel!.messages.fetch(rolepicker.message_id)

            await message.edit({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(title)
                        .setDescription(description)
                        .setColor(Color.primary)
                        .setFooter({
                            text: `Selector ID: ${rolepicker.id} | Use /rolepicker addrole to add a role.`,
                        }),
                ],
            })
        } catch (error) {
            await modalSubmit.editReply({
                embeds: [
                    errorEmbed(
                        `The message of that rolepicker doesn't exist. Was it deleted?`
                    ),
                ],
            })

            return
        }

        const newRolePicker = await db.roleSelector.update({
            where: {
                id: rolepicker.id,
            },
            data: {
                unique: unique,
            },
        })

        try {
            await refreshRolepicker(
                newRolePicker.message_id,
                newRolePicker.channel_id,
                client
            )

            await modalSubmit.editReply({
                embeds: [
                    successEmbed(`Successfully updated that role picker.`),
                ],
            })
        } catch (error) {
            await modalSubmit.editReply({
                embeds: [
                    errorEmbed(`Failed to update that role picker.`)
                        .addFields([
                            {
                                name: 'Message',
                                value: `${error}`,
                            },
                        ])
                        .setFooter({
                            text: `Please inform an admin about this.`,
                        }),
                ],
            })
        }
    },
} as SlashSubcommand
