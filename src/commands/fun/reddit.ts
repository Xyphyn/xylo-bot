import { SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
} from 'discord.js'
import { errorEmbed } from 'util/embed.js'

interface RedditPostChild {
    data: RedditPost
}

interface RedditPost {
    title: string
    selftext?: string
    over_18: boolean
    is_video: boolean
    thumbnail?: string
    url_overridden_by_dest: string
    ups: number
    url?: string
    permalink: string
    stickied: boolean
}

const postEmbed = (post: RedditPost) => {
    const embed = new EmbedBuilder()
        .setTitle(post.title)
        .setFooter({
            text: `👍 ${post.ups}`,
        })
        .setURL(`https://reddit.com${post.permalink}`)
        .setColor(Color.primary)

    if (post.url && post.thumbnail) embed.setImage(post.url)

    if (post.selftext) embed.setDescription(post.selftext)

    return embed
}

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'reddit',
        description: 'View reddit posts',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'subreddit',
                description: 'The subreddit to view.',
                required: true,
            },
        ],
    },

    async execute({ interaction }) {
        const message = await (await interaction.deferReply()).fetch()
        const subreddit = interaction.options.getString('subreddit')!

        let res: { data: { children: RedditPostChild[] } }

        try {
            res = await fetch(`https://reddit.com/r/${subreddit}.json`).then(
                (r) => r.json()
            )
        } catch (error) {
            await interaction.editReply({
                embeds: [errorEmbed(`That subreddit doesn't exist.`)],
            })

            return
        }

        if (!res || res.data.children.length == 0) {
            await interaction.editReply({
                embeds: [errorEmbed(`That subreddit doesn't exist.`)],
            })

            return
        }

        const posts = res.data.children.map((child) => child.data)

        let index = 0

        try {
            while (
                posts[index].stickied ||
                posts[index].over_18 ||
                posts[index].is_video
            ) {
                index++
            }
        } catch (error) {
            await message.edit({
                embeds: [
                    errorEmbed(
                        'All of the posts on that sub are blocked by our filter.'
                    ),
                ],
            })
        }

        const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setCustomId(`xylo:fun:imagi:back:${message.id}`)
                .setLabel('Back')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`xylo:fun:imagi:next:${message.id}`)
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
        )

        await interaction.editReply({
            embeds: [postEmbed(posts[index])],
            components: [actionRow],
        })

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            dispose: true,
            idle: 60 * 1000,
            filter: (i) => i.user.id == interaction.user.id,
        })

        collector.on('collect', async (interaction) => {
            await interaction.deferUpdate()

            if (!(interaction instanceof ButtonInteraction)) return

            const next = interaction.customId.startsWith(`xylo:fun:imagi:next`)

            let prevIndex = index

            if (next) index++
            else index--

            while (
                posts[index].stickied ||
                posts[index].over_18 ||
                posts[index].is_video
            ) {
                if (next) index++
                else index--
            }

            if (index <= 0) {
                index = prevIndex
                actionRow.components[0].setDisabled(true)
            } else {
                actionRow.components[0].setDisabled(false)
            }

            if (index >= posts.length - 1) {
                index = prevIndex
                actionRow.components[1].setDisabled(true)
            } else {
                actionRow.components[1].setDisabled(false)
            }

            await message.edit({
                embeds: [postEmbed(posts[index])],
                components: [actionRow],
            })
        })

        collector.on('end', async () => {
            actionRow.components.forEach((c) => c.setDisabled(true))
            await message.edit({
                components: [actionRow],
            })
        })
    },
} as SlashSubcommand
