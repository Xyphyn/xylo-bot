import { SlashCommandAutocomplete, SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import {
    ApplicationCommandOptionType,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js'
import { asDisabled, awaitInteraction, makeRow } from 'util/component.js'
import { sendError } from 'util/embed.js'

export default {
    metadata: {
        name: 'cat',
        description: 'Fetches a random cat',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'saying',
                description: 'What should the cat be saying?',
                maxLength: 128,
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'tag',
                description: 'The tag (e.g. loaf, cute, etc)',
                maxLength: 128,
                autocomplete: true,
            },
        ],
    },

    async execute({ interaction }) {
        const refresh = makeRow({
            buttons: [{ label: 'Refresh', style: ButtonStyle.Primary }],
        })

        let saying = interaction.options.getString('saying')
        if (saying) saying = encodeURIComponent(saying)

        let tag = interaction.options.getString('tag')
        if (tag) tag = encodeURIComponent(tag)

        const serviceURL = `https://cataas.com/cat${tag ? `/${tag}` : ''}${
            saying ? `/says/${saying}` : ''
        }?json=true`

        const reply = await interaction.deferReply()

        let interacting = true

        while (interacting) {
            const response: { url: string } = await fetch(serviceURL).then(
                (res) => res.json().catch((_) => undefined)
            )

            if (!response || !response.url) {
                await interaction.editReply({
                    embeds: [
                        sendError(
                            `Invalid arguments. Make sure to use alphanumeric characters.`
                        ),
                    ],
                    components: [],
                })

                break
            }

            const embed = new EmbedBuilder()
                .setImage(`https://cataas.com${response.url}`)
                .setURL(`https://cataas.com${response.url}`)
                .setFooter({ text: 'Courtesy of cataas.com' })
                .setTitle('kitty')
                .setColor(Color.primary)

            await interaction.editReply({
                embeds: [embed],
                components: [refresh],
            })

            const refreshInt = await awaitInteraction({
                message: reply,
                user: interaction.user,
            })

            if (!refreshInt) {
                interacting = false
                break
            }

            refreshInt.deferUpdate()
        }

        await interaction.editReply({
            components: [asDisabled(refresh)],
        })
    },
} as SlashSubcommand & SlashCommandAutocomplete
