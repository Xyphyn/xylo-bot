import { BotEmoji, Color, getConfig } from '@config/config.js'
import { client } from 'app.js'
import { ActionRowBuilder, EmbedBuilder, Guild } from 'discord.js'

export function sendError(message: string, error?: Error) {
    const embed = new EmbedBuilder()
        .setTitle(`Error`)
        .setDescription(`${BotEmoji.error} ${message}`)
        .setColor(Color.error)

    if (error) {
        embed
            .addFields({
                name: 'Message',
                value: `\`\`\`${error.message.slice(0, 4080)}\`\`\``,
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
    if (!config || !config.logging || !config.logging.channel) return

    const channel = await client.channels
        .fetch(config.logging.channel)
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

export async function sendStaff(
    embed: EmbedBuilder,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    components?: ActionRowBuilder<any>,
    guild?: Guild
) {
    if (!process.env.STAFF_CHANNEL) return

    const channel = await client.channels
        .fetch(process.env.STAFF_CHANNEL)
        .catch((_) => undefined)

    if (!channel || !channel.isTextBased()) return

    if (guild) {
        embed.setFooter({
            text: guild.name,
            iconURL: guild.iconURL() as string | undefined,
        })
    }

    embed.setTimestamp(Date.now())

    const rows = components ? [components] : []
    await channel
        .send({ embeds: [embed], components: rows })
        .catch((_) => undefined)
}
