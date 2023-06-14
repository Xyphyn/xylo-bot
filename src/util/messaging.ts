import { BotEmoji, Color, getConfig } from '@config/config.js'
import { client } from 'app.js'
import { EmbedBuilder, Guild } from 'discord.js'

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

export const sendInfo = (message: string) =>
    new EmbedBuilder({
        title: 'Info',
        description: message,
        color: Color.primary,
    })

export async function log(guild: Guild, embed: EmbedBuilder) {
    const config = await getConfig(guild.id)
    if (!config || !config.logChannel) return

    const channel = await client.channels
        .fetch(config.logChannel)
        .catch((_) => undefined)
    if (!channel || !channel.isTextBased()) return

    embed.setFooter({
        text: guild.name,
        iconURL: guild.iconURL() as string | undefined,
    })

    embed.setTimestamp(Date.now())

    try {
        await channel.send({
            embeds: [embed],
        })
    } catch (_) {
        // failed to send. Doesn't really matter.
    }
}
