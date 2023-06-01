import { SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import { db } from 'app.js'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'
import { successEmbed } from 'util/embed.js'

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'create',
        description: 'Creates a role picker. (You can create values later.)',
        options: [],
        dmPermission: false,
    },

    async execute({ interaction }) {
        if (!interaction.guildId || !interaction.channel) return false

        const setupButton = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setLabel('Setup')
                .setCustomId(`xylo:rolepicker:create:setup`)
                .setStyle(ButtonStyle.Secondary)
        )

        const reply = await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Setup rolepicker')
                    .setDescription(
                        'Click the button below to setup this role picker.'
                    )
                    .setColor(Color.primary),
            ],
            components: [setupButton],
        })

        try {
            var buttonInt = await reply.awaitMessageComponent({
                time: 60 * 1000,
                dispose: true,
                filter: (int) => int.user == interaction.user,
            })
        } catch (error) {
            return
        }

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

        await buttonInt.showModal(modal)

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

        const message = await reply.fetch()

        const selector = await db.roleSelector.create({
            data: {
                guild_id: interaction.guildId,
                channel_id: interaction.channelId,
                message_id: message.id,
                unique: unique,
            },
        })

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(Color.primary)
            .setFooter({
                text: `Selector ID: ${selector.id} | Use /rolepicker addrole to add a role.`,
            })

        await interaction.editReply({
            embeds: [embed],
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents(
                    new ButtonBuilder({
                        custom_id: 'xylo:rolepicker:edit',
                        label: 'Edit',
                        style: ButtonStyle.Secondary,
                    })
                ),
            ],
        })

        await modalSubmit.editReply({
            embeds: [
                successEmbed(
                    `Successfully created the role picker of ID ${selector.id}`
                ).addFields([
                    {
                        name: 'Tip',
                        value: `Use </rolepicker addrole:1110999044207169628> to add an option to this role picker.`,
                    },
                ]),
            ],
        })
    },
} as SlashSubcommand
