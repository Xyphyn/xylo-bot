import { SlashCommand } from '@commands/command.js'
import {
    ApplicationCommandChoicesOption,
    ApplicationCommandOptionType,
    EmbedBuilder,
} from 'discord.js'
import { Translator, TargetLanguageCode } from 'deepl-node'
import { BotEmoji, Color } from '@config/config.js'

enum Languages {
    English = 'en-GB',
    German = 'de',
    French = 'fr',
    Spanish = 'es',
    Italian = 'it',
    Dutch = 'nl',
    Polish = 'pl',
    Portuguese = 'pt',
    Russian = 'ru',
    Japanese = 'ja',
    Chinese = 'zh',
    Swedish = 'sv',
    Danish = 'da',
    Finnish = 'fi',
    Norwegian = 'no',
}

function keyFromValue(object: any, value: any) {
    return Object.keys(object).find((key) => object[key] === value)
}

export default {
    cooldown: 5000,
    metadata: {
        name: 'translate',
        description: 'Translates text between languages.',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'text',
                description: 'The text to translate.',
                maxLength: 512,
                required: true,
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'language',
                description: 'The language to translate to.',
                choices: Object.keys(Languages).map((key) => {
                    return {
                        name: key,
                        value: Languages[key as keyof typeof Languages],
                    }
                }),
                required: true,
            },
        ],
    },

    async execute({ interaction }) {
        if (!process.env.DEEPL_KEY) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Error')
                        .setDescription(
                            `${BotEmoji.error} Translation is not configured in this bot.`
                        )
                        .setColor(Color.error),
                ],
            })

            return
        }

        const text = interaction.options.getString('text')!
        const language = interaction.options.getString('language')!

        await interaction.deferReply()

        const translator = new Translator(process.env.DEEPL_KEY || '')
        const response = await translator.translateText(
            text,
            null,
            language as TargetLanguageCode
        )

        const embed = new EmbedBuilder()
            .setColor(Color.primary)
            .addFields([
                {
                    name: 'Input',
                    value: text,
                },
                {
                    name: 'Translated',
                    value: response.text,
                },
            ])
            .setFooter({
                text: `${
                    keyFromValue(Languages, response.detectedSourceLang) ??
                    'Unknown'
                } to ${keyFromValue(Languages, language)}`,
            })

        await interaction.editReply({
            embeds: [embed],
        })
    },
} as SlashCommand
