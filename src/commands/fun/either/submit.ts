import { SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import { db } from 'app.js'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Guild,
} from 'discord.js'
import { registerInteractionListener } from 'events/interaction.js'
import { makeRow } from 'util/component.js'
import { sendError, sendStaff, sendSuccess } from 'util/messaging.js'

registerInteractionListener({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: (int: any) =>
        int.isButton() && int?.customId?.startsWith('xylo:wyr:submit'),
    async execute(int) {
        if (!int.isButton()) return

        await int.deferReply({ ephemeral: true })

        const approve = int.customId.startsWith('xylo:wyr:submit:approve')

        const id = Number(int.customId.split(':').at(-1))

        if (approve) {
            await db.ratherGame.update({
                where: {
                    id: id,
                },
                data: {
                    public: true,
                },
            })

            const components = int.message.components[0]

            const disabled = new ButtonBuilder({
                ...components.components[0].data,
            }).setDisabled(true)
            const deny = new ButtonBuilder({
                ...components.components[1].data,
            }).setDisabled(true)

            await int.message.edit({
                components: [
                    new ActionRowBuilder<ButtonBuilder>().setComponents(
                        disabled,
                        deny
                    ),
                ],
            })
        } else {
            await db.ratherGame.delete({
                where: {
                    id: id,
                },
            })

            await int.message.delete()
        }

        await int.editReply({
            embeds: [sendSuccess(`Successfully moderated submission.`)],
        })
    },
})

export default {
    metadata: {
        name: 'submit',
        description: 'Submit a would you rather question.',
        options: [
            {
                name: 'option1',
                description: 'The first choice.',
                type: ApplicationCommandOptionType.String,
                required: true,
                maxLength: 512,
            },
            {
                name: 'option2',
                description: 'The second choice.',
                type: ApplicationCommandOptionType.String,
                required: true,
                maxLength: 512,
            },
            {
                name: 'guildonly',
                description: 'Whether only this guild can see the question.',
                type: ApplicationCommandOptionType.Boolean,
                required: false,
            },
        ],
        type: ApplicationCommandOptionType.Subcommand,
    },

    async execute({ interaction }) {
        const option1 = interaction.options.getString('option1')!
        const option2 = interaction.options.getString('option2')!
        const guildOnly = interaction.options.getBoolean('guildOnly')

        if (!process.env.STAFF_CHANNEL) {
            await interaction.reply({
                embeds: [
                    sendError(
                        `Question submission is not configured for this bot instance`
                    ),
                ],
                ephemeral: true,
            })

            return false
        }

        await interaction.deferReply({ ephemeral: true })

        const result = await db.ratherGame.create({
            data: {
                option1: option1,
                option2: option2,
                guild_id: guildOnly ? interaction.guild?.id : null,
                public: false,
            },
        })

        await sendStaff(
            new EmbedBuilder({
                title: 'Would you rather submission',
                fields: [
                    {
                        name: 'Option 1',
                        value: result.option1,
                    },
                    {
                        name: 'Option 2',
                        value: result.option2,
                    },
                ],
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL() as string | undefined,
                },
                color: Color.primary,
            }),
            makeRow({
                buttons: [
                    {
                        label: 'Approve',
                        style: ButtonStyle.Success,
                        id: `xylo:wyr:submit:approve:${result.id}`,
                    },
                    {
                        label: 'Deny',
                        style: ButtonStyle.Danger,
                        id: `xylo:wyr:submit:deny:${result.id}`,
                    },
                ],
            }),
            guildOnly ? (interaction.guild as Guild | undefined) : undefined
        )

        await interaction.editReply({
            embeds: [sendSuccess(`Your submission was sent for approval.`)],
        })
    },
} as SlashSubcommand
