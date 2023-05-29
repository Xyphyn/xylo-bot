import { SlashCommand } from '@commands/command.js'
import {
    ApplicationCommandOptionType,
    Attachment,
    AttachmentBuilder,
    EmbedBuilder,
} from 'discord.js'
import { errorEmbed } from 'util/embed.js'

function hexToRgb(hex: string): [number, number, number] {
    const hexWithoutHash = hex.replace('#', '')
    const r = parseInt(hexWithoutHash.substring(0, 2), 16)
    const g = parseInt(hexWithoutHash.substring(2, 4), 16)
    const b = parseInt(hexWithoutHash.substring(4, 6), 16)
    return [r, g, b]
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    let h = 0
    const s = max === 0 ? 0 : d / max
    const v = max / 255

    if (max !== min) {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0)
                break
            case g:
                h = (b - r) / d + 2
                break
            case b:
                h = (r - g) / d + 4
                break
        }
        h /= 6
    }

    return [h, s, v]
}

function hexToHsv(hex: string): [number, number, number] {
    const [r, g, b] = hexToRgb(hex)
    return rgbToHsv(r, g, b)
}

function hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16)
}

export default {
    metadata: {
        name: 'color',
        description: 'Converts and shows a hex color',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'color',
                description: 'IN HEX, the color to show. (e.g. #FFF000)',
                maxLength: 7,
                minLength: 6,
                required: true,
            },
        ],
    },

    async execute({ interaction }) {
        const color = interaction.options.getString('color')!

        const test = hexToNumber(color)
        if (Number.isNaN(test)) {
            await interaction.reply({
                embeds: [
                    errorEmbed(
                        `That is not a valid hex color. Use the format #000000`
                    ),
                ],
            })

            return false
        }

        const rgb = hexToRgb(color)
        const hsv = hexToHsv(color)

        const embed = new EmbedBuilder()
            .addFields([
                {
                    name: 'Hex',
                    value: color,
                    inline: true,
                },
                {
                    name: 'RGB',
                    value: `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`,
                    inline: true,
                },
                {
                    name: 'HSV',
                    value: `${hsv[0].toFixed(3)}, ${hsv[1].toFixed(
                        3
                    )}, ${hsv[2].toFixed(3)}`,
                    inline: true,
                },
            ])
            .setColor(hexToNumber(color))

        await interaction.reply({
            embeds: [embed],
        })
    },
} as SlashCommand
