import { SlashCommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js'

const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']

export default {
    metadata: {
        name: 'poll',
        description: 'Creates a poll.',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'question',
                description: 'The question to ask',
                required: true,
            },
            ...Array.from({ length: 9 }, (element, index) => {
                return {
                    type: ApplicationCommandOptionType.String,
                    name: `choice${index + 1}`,
                    description: `One of the choices for the poll.`,
                    required: index < 2,
                }
            }),
        ],
        dmPermission: false,
    },

    async execute({ interaction }) {
        const question = interaction.options.getString('question')!

        const choices = Array.from({ length: 9 }, (item, index) =>
            interaction.options.getString(`choice${index + 1}`)
        ).filter((item) => item != undefined)

        const embed = new EmbedBuilder()
            .setTitle(question)
            .setColor(Color.primary)
            .addFields(
                choices.map((choice, index) => {
                    return {
                        name: emojis[index],
                        value: choice!,
                        inline: true,
                    }
                })
            )

        const reply = await interaction.reply({
            embeds: [embed],
        })

        const message = await reply.fetch()

        choices.forEach(async (choice, index) => {
            await message.react(emojis[index])
        })
    },
} as SlashCommand
