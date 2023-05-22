import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Client,
    EmbedBuilder,
    Interaction,
} from 'discord.js'
import { SlashCommand } from './command'
import { db } from '../app'
import { Color } from '../config/config'

async function fetchPing(
    client: Client
): Promise<{ discordPing: number; redisPing: number }> {
    const redisStart = Date.now()
    await db.ping()
    return { discordPing: client.ws.ping, redisPing: Date.now() - redisStart }
}

export default {
    metadata: {
        name: 'ping',
        description: 'Fetches Discord API ping',
    },

    async execute({ interaction, client }) {
        const message = await interaction.deferReply()

        const { discordPing, redisPing } = await fetchPing(client)

        const id = `xylo:ping:refresh:${interaction.id}`

        const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setCustomId(id)
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Primary)
        )

        const embed = new EmbedBuilder()
            .setColor(Color.primary)
            .setTitle(`Ping`)
            .addFields([
                {
                    name: 'Discord',
                    value: `${discordPing}ms`,
                    inline: true,
                },
                {
                    name: 'Database',
                    value: `${redisPing}ms`,
                    inline: true,
                },
            ])

        await interaction.editReply({
            embeds: [embed],
            components: [actionRow],
        })

        const collector = message.createMessageComponentCollector({
            time: 5 * 60 * 1000,
            filter: (int: Interaction) =>
                (int as ButtonInteraction).message.id != id,
        })

        collector.on('collect', async (int: ButtonInteraction) => {
            int.deferUpdate()

            const { discordPing, redisPing } = await fetchPing(client)

            embed.setFields([
                {
                    name: 'Discord',
                    value: `${discordPing}ms`,
                    inline: true,
                },
                {
                    name: 'Database',
                    value: `${redisPing}ms`,
                    inline: true,
                },
            ])

            await interaction.editReply({
                embeds: [embed],
            })
        })
    },
} as SlashCommand
