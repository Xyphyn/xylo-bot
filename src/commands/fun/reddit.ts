import { SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import {
    ApplicationCommandOptionType,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js'
import { asDisabled, awaitInteraction, makeRow } from 'util/component.js'
import { sendError } from 'util/messaging.js'

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
            {
                type: ApplicationCommandOptionType.Boolean,
                name: 'private',
                description:
                    'Should it only be visible to you? (Default: False)',
                required: false,
            },
        ],
    },

    async execute({ interaction }) {
        const silent = interaction.options.getBoolean('private') || false

        const message = await (
            await interaction.deferReply({ ephemeral: silent })
        ).fetch()
        const subreddit = interaction.options.getString('subreddit')!

        let res: { data: { children: RedditPostChild[] } }

        try {
            res = await fetch(`https://reddit.com/r/${subreddit}.json`).then(
                (r) => r.json()
            )
        } catch (error) {
            await interaction.editReply({
                embeds: [sendError(`That subreddit doesn't exist.`)],
            })

            return
        }

        if (!res || !res.data || res.data.children.length == 0) {
            await interaction.editReply({
                embeds: [sendError(`That subreddit doesn't exist.`)],
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
            await interaction.editReply({
                embeds: [
                    sendError(
                        'All of the posts on that sub are blocked by our filter.'
                    ),
                ],
            })

            return
        }

        const actionRow = makeRow({
            buttons: [
                {
                    id: 'back',
                    label: 'Back',
                    style: ButtonStyle.Primary,
                },

                {
                    id: 'next',
                    label: 'Next',
                    style: ButtonStyle.Primary,
                },
            ],
        })

        let interacting = true
        while (interacting) {
            const reply = await interaction.editReply({
                embeds: [postEmbed(posts[index])],
                components: [actionRow],
            })

            const int = await awaitInteraction({
                message: reply,
                user: interaction.user,
            })

            if (!int) {
                interacting = false
                break
            }

            int.deferUpdate()

            const next = int.customId == `next`

            const prevIndex = index

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

            if (!silent) {
                await message.edit({
                    embeds: [postEmbed(posts[index])],
                    components: [actionRow],
                })
            } else {
                await interaction.editReply({
                    embeds: [postEmbed(posts[index])],
                    components: [actionRow],
                })
            }
        }

        if (!silent) {
            await message.edit({
                components: [asDisabled(actionRow)],
            })
        } else {
            await interaction.editReply({
                components: [asDisabled(actionRow)],
            })
        }
    },
} as SlashSubcommand
