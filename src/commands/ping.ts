import { ButtonStyle, Client, EmbedBuilder } from 'discord.js'
import { SlashCommand } from '@commands/command'
import { db } from 'app.js'
import { Color } from '@config/config.js'
import { asDisabled, awaitInteraction, makeRow } from 'util/component.js'

async function fetchPing(
    client: Client
): Promise<{ discordPing: number; redisPing: number }> {
    const redisStart = Date.now()
    await db.warning.findFirst()
    return { discordPing: client.ws.ping, redisPing: Date.now() - redisStart }
}

export default {
    metadata: {
        name: 'ping',
        description: 'Fetches Discord API ping',
    },

    async execute({ interaction, client }) {
        await interaction.deferReply()

        let refresh = true

        const row = makeRow({
            buttons: [{ label: 'Refresh', style: ButtonStyle.Primary }],
        })

        while (refresh) {
            const { discordPing, redisPing } = await fetchPing(client)

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
                        name: 'MariaDB',
                        value: `${redisPing}ms`,
                        inline: true,
                    },
                ])

            const reply = await interaction.editReply({
                embeds: [embed],
                components: [row],
            })

            const int = await awaitInteraction({
                message: reply,
                user: interaction.user,
            })

            if (!int) {
                refresh = false
                break
            }

            int.deferUpdate()
        }

        await interaction.editReply({
            components: [asDisabled(row)],
        })
    },
} as SlashCommand
