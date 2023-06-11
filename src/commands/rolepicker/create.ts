import { SlashSubcommand } from '@commands/command.js'
import { rolePickerEmbed } from '@commands/rolepicker/rolepicker.js'
import { Color } from '@config/config.js'
import { db } from 'app.js'
import {
    ApplicationCommandOptionType,
    ButtonStyle,
    EmbedBuilder,
    TextInputStyle,
} from 'discord.js'
import { asDisabled, awaitInteraction, makeRow } from 'util/component.js'
import { sendError, sendSuccess } from 'util/embed.js'
import { awaitModal, makeModal, parseModalFields } from 'util/modal.js'

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

        const setupButton = makeRow({
            buttons: [
                {
                    label: 'Setup',
                    id: 'setup',
                    style: ButtonStyle.Secondary,
                },
            ],
        })

        const reply = await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    title: 'Setup rolepicker',
                    description:
                        'Click the button below to setup this role picker.',
                    color: Color.primary,
                }),
            ],
            ephemeral: true,
            components: [setupButton],
        })

        const buttonInt = await awaitInteraction({
            message: reply,
            user: interaction.user,
        })

        if (!buttonInt) {
            await interaction.editReply({
                components: [asDisabled(setupButton)],
            })

            return
        }

        const modal = makeModal({
            data: { title: 'Create role picker' },
            inputs: [
                {
                    id: 'title',
                    label: 'Title',
                    placeholder: 'The title of the embed',
                    maxLength: 128,
                    required: true,
                    style: TextInputStyle.Short,
                },
                {
                    id: 'description',
                    label: 'Description',
                    placeholder: 'The description of the embed',
                    maxLength: 1024,
                    required: true,
                    style: TextInputStyle.Paragraph,
                },
                {
                    id: 'unique',
                    label: 'Unique',
                    placeholder: '1 role at max (true/false) (default: false)',
                    maxLength: 5,
                    minLength: 4,
                    required: false,
                    style: TextInputStyle.Short,
                },
            ],
        })

        await buttonInt.showModal(modal)

        const modalSubmit = await awaitModal(interaction)

        if (!modalSubmit) return
        await modalSubmit.deferUpdate()

        const [title, description, uniqueText] = parseModalFields(
            modalSubmit.fields,
            ['title', 'description', 'unique']
        )

        let unique = uniqueText?.toLowerCase() == 'true' ? true : false

        const message = await interaction.channel
            .send({
                embeds: [rolePickerEmbed(title, description)],
                components: [
                    makeRow({
                        buttons: [
                            {
                                id: 'xylo:rolepicker:edit',
                                label: 'Edit',
                                style: ButtonStyle.Secondary,
                            },
                        ],
                    }),
                ],
            })
            .catch((error) => {
                interaction.editReply({
                    embeds: [
                        sendError(
                            `Failed to create that role picker. **Make sure that the bot has permission to send messages in this channel.**`,
                            error
                        ),
                    ],
                    components: [],
                })

                return
            })

        if (!message) return

        const selector = await db.roleSelector.create({
            data: {
                guild_id: interaction.guildId,
                channel_id: interaction.channelId,
                message_id: message.id,
                unique: unique,
            },
        })

        await modalSubmit.editReply({
            embeds: [
                sendSuccess(
                    `Successfully created the role picker of ID \`${selector.id}\``
                ).addFields([
                    {
                        name: 'Tip',
                        value: `Use the edit button to add an option to this role picker.`,
                    },
                ]),
            ],
        })
    },
} as SlashSubcommand
