import { BotEmoji, Color } from '@config/config.js'
import { EmbedBuilder } from 'discord.js'

export const errorEmbed = (message: string) =>
    new EmbedBuilder()
        .setTitle(`Error`)
        .setDescription(`${BotEmoji.error} ${message}`)
        .setColor(Color.error)

export const successEmbed = (message: string) =>
    new EmbedBuilder()
        .setTitle(`Success`)
        .setDescription(`${BotEmoji.success} ${message}`)
        .setColor(Color.success)
