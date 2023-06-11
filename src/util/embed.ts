import { BotEmoji, Color } from '@config/config.js'
import { EmbedBuilder } from 'discord.js'

export function sendError(message: string, error?: Error) {
    const embed = new EmbedBuilder()
        .setTitle(`Error`)
        .setDescription(`${BotEmoji.error} ${message}`)
        .setColor(Color.error)

    if (error) {
        embed
            .addFields({
                name: 'Message',
                value: `\`\`\`${error.name}\`\`\``,
            })
            .setFooter({ text: 'Please inform a server admin about this.' })
    }

    return embed
}

export const sendSuccess = (message: string) =>
    new EmbedBuilder()
        .setTitle(`Success`)
        .setDescription(`${BotEmoji.success} ${message}`)
        .setColor(Color.success)
