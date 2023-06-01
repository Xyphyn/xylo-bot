import { SlashCommandAutocomplete, SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js'
import { asDisabled } from 'util/component.js'
import { errorEmbed } from 'util/embed.js'

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
        const refresh = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder({
                customId: 'xylo:fun:cat:refresh',
                style: ButtonStyle.Primary,
                label: 'Refresh',
            })
        )

        let saying = interaction.options.getString('saying')
        if (saying) saying = encodeURIComponent(saying)

        let tag = interaction.options.getString('tag')
        if (tag) tag = encodeURIComponent(tag)

        let serviceURL = `https://cataas.com/cat${tag ? `/${tag}` : ''}${
            saying ? `/says/${saying}` : ''
        }?json=true`

        const reply = await interaction.deferReply()

        let interacting = true

        while (interacting) {
            const response: { url: string } = await fetch(serviceURL).then(
                (res) => res.json().catch((_) => {})
            )

            if (!response || !response.url) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
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

            const refreshInt = await reply
                .awaitMessageComponent({
                    dispose: true,
                    filter: (int) => int.user.id == interaction.user.id,
                    idle: 30 * 1000,
                })
                .catch((_) => {
                    interacting = false
                })

            if (!interacting || !refreshInt) break

            refreshInt.deferUpdate()
        }

        await interaction.editReply({
            components: [asDisabled(refresh)],
        })
    },
} as SlashSubcommand & SlashCommandAutocomplete
