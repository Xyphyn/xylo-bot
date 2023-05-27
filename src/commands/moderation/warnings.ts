import { SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import { db } from 'app.js'
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js'

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'warnings',
        description: 'Gets the warnings for a certain user.',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                description: 'The user to fetch warnings for.',
                required: true,
                name: 'user',
            },
            {
                type: ApplicationCommandOptionType.Boolean,
                description: 'Should the message be public? (Default: yes)',
                required: false,
                name: 'silent',
            },
        ],
        dmPermission: false,
    },

    async execute({ interaction }) {
        const user = interaction.options.getUser('user')!
        const silent = interaction.options.getBoolean('silent') || true

        await interaction.deferReply({ ephemeral: silent })

        if (!interaction.guild) return

        const results = await db.warning.findMany({
            where: {
                guild_id: interaction.guild.id,
                user_id: user.id,
            },
        })

        const embed = new EmbedBuilder()
            .setTitle(`Warnings`)
            .setColor(Color.primary)
            .setAuthor({
                name: user.username,
                iconURL: user.avatarURL() ?? '',
            })
            .setDescription(
                results
                    .map(
                        (result) =>
                            `\`${result.id}\` <t:${Math.floor(
                                result.time.getTime() / 1000
                            )}:R> ${result.reason}`
                    )
                    .join('\n')
            )
            .addFields([
                {
                    name: 'Total',
                    value: `${results.length}`,
                    inline: true,
                },
                {
                    name: 'Last 3 days',
                    value: `${
                        results.filter(
                            (result) =>
                                Date.now() - result.time.getTime() <=
                                3 * 60 * 60 * 1000
                        ).length
                    }`,
                    inline: true,
                },
            ])

        await interaction.editReply({
            embeds: [embed],
        })
    },
} as SlashSubcommand
