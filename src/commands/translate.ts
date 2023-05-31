import { SlashCommand } from '@commands/command.js'
import {
    ActionRowBuilder,
    ApplicationCommandChoicesOption,
    ApplicationCommandOptionType,
    ButtonInteraction,
    ComponentType,
    EmbedBuilder,
    SelectMenuType,
    StringSelectMenuBuilder,
} from 'discord.js'
import { Translator, TargetLanguageCode } from 'deepl-node'
import { BotEmoji, Color } from '@config/config.js'
import { asDisabled } from 'util/component.js'

enum Languages {
    English = 'en',
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
    Latvian = 'lv',
}

enum LanguageEmojis {
    'en' = '🇬🇧',
    'de' = '🇩🇪',
    'fr' = '🇫🇷',
    'es' = '🇪🇸',
    'it' = '🇮🇹',
    'nl' = '🇳🇱',
    'pl' = '🇵🇱',
    'pt' = '🇵🇹',
    'ru' = '🇷🇺',
    'ja' = '🇯🇵',
    'zh' = '🇨🇳',
    'sv' = '🇸🇪',
    'da' = '🇩🇰',
    'fi' = '🇫🇮',
    'lv' = '🇱🇻',
}

function keyFromValue(object: any, value: any) {
    return Object.keys(object).find((key) => object[key] === value)
}

const translationEmbed = (
    input: string,
    output: string,
    from: string | undefined,
    to: string
) =>
    new EmbedBuilder({
        color: Color.primary,
        fields: [
            {
                name: 'Input',
                value: input,
            },
            {
                name: 'Translated',
                value: output,
            },
        ],
        footer: {
            text: `${LanguageEmojis[from!] ?? '🏳️'} ${
                keyFromValue(Languages, from) ?? 'Unknown'
            } to ${LanguageEmojis[to]} ${keyFromValue(Languages, to)}`,
        },
    })

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
            {
                type: ApplicationCommandOptionType.Boolean,
                name: 'silent',
                description:
                    'Should the translation be private? (Default: False)',
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
        let language = interaction.options.getString('language')!
        if (language == 'en') language = 'en-GB'
        const silent = interaction.options.getBoolean('silent') || false

        const reply = await interaction.deferReply({ ephemeral: silent })

        const selectMenu =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                new StringSelectMenuBuilder({
                    customId: `xylo:translate:languages`,
                    maxValues: 1,
                    minValues: 1,
                    placeholder: 'Select another language',
                    options: Object.keys(Languages).map((key) => {
                        return {
                            label: key,
                            value: Languages[key as keyof typeof Languages],
                            emoji: LanguageEmojis[
                                Languages[key as keyof typeof Languages]
                            ],
                        }
                    }),
                })
            )

        const translator = new Translator(process.env.DEEPL_KEY || '')
        const response = await translator.translateText(
            text,
            null,
            language as TargetLanguageCode
        )

        const embed = translationEmbed(
            text,
            response.text,
            response.detectedSourceLang,
            language
        )

        await interaction.editReply({
            embeds: [embed],
            components: [selectMenu],
        })

        const collector =
            reply.createMessageComponentCollector<ComponentType.StringSelect>({
                filter: (int) => int.user.id == interaction.user.id,
                dispose: true,
                idle: 60 * 1000,
                time: 14 * 60 * 1000,
            })

        collector.on('collect', async (int) => {
            int.deferUpdate()

            let language = int.values[0]
            if (language == 'en') language = 'en-GB'

            const response = await translator.translateText(
                text,
                null,
                language as TargetLanguageCode
            )

            const embed = translationEmbed(
                text,
                response.text,
                response.detectedSourceLang,
                language
            )

            await interaction.editReply({
                embeds: [embed],
            })
        })

        collector.on('end', async () => {
            await interaction.editReply({
                components: [asDisabled(selectMenu)],
            })
        })
    },
} as SlashCommand
