import { SlashSubcommand } from '@commands/command.js'
import { Color } from '@config/config.js'
import {
    ApplicationCommandOptionType,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js'
import { asDisabled, awaitInteraction, makeRow } from 'util/component.js'

const baseURL = 'https://backend.xylight.dev'

interface ImagiBaseFields {
    id: string
}

interface ImagiPost<TExpand> extends ImagiBaseFields {
    description: string
    image: string
    expand: TExpand
}

interface ImagiUser extends ImagiBaseFields {
    username: string
    avatar: string
}

interface ImagiPostStats extends ImagiBaseFields {
    likes: number
    comments: number
}

interface ImagiPostExpand {
    user: ImagiUser
    'postCounts(post)': ImagiPostStats[]
}

function getImage(
    baseURL: string,
    collection: string,
    id: string,
    filename: string
) {
    return `${baseURL}/api/files/${collection}/${id}/${filename}`
}

function postEmbed(post: ImagiPost<ImagiPostExpand>) {
    return new EmbedBuilder()
        .setAuthor({
            name: post.expand.user.username,
            iconURL: `${getImage(
                baseURL,
                'users',
                post.expand.user.id,
                post.expand.user.avatar
            )}?thumb=48x48`,
        })
        .setTitle(post.description)
        .setURL(`https://imagi.xylight.dev/post/${post.id}`)
        .setImage(getImage(baseURL, 'posts', post.id, post.image))
        .setColor(Color.primary)
        .setFooter({
            text: `👍 ${post.expand['postCounts(post)'][0].likes} | 🗨 ${post.expand['postCounts(post)'][0].comments}`,
        })
}

export default {
    metadata: {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'imagi',
        description: 'View imagi posts.',
    },

    async execute({ interaction }) {
        const message = await (await interaction.deferReply()).fetch()

        const posts: ImagiPost<ImagiPostExpand>[] = await fetch(
            `${baseURL}/api/collections/posts/records?expand=user,postCounts(post)&sort=-created`
        )
            .then((res) => res.json())
            .then((json) => json.items)

        let index = 0

        const actionRow = makeRow({
            buttons: [
                { id: 'back', label: 'Back', style: ButtonStyle.Primary },
                { id: 'next', label: 'Next', style: ButtonStyle.Primary },
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
                index > 0 &&
                index < posts.length - 1 &&
                (posts[index].image.endsWith('mp4') ||
                    posts[index].image.endsWith('mov') ||
                    posts[index].image.endsWith('webm'))
            ) {
                if (next) index++
                else index--
            }

            if (index <= 0) {
                index = 0
                actionRow.components[0].setDisabled(true)
            } else {
                actionRow.components[0].setDisabled(false)
            }

            if (index >= posts.length - 1) {
                index = posts.length - 1
                actionRow.components[1].setDisabled(true)
            } else {
                actionRow.components[1].setDisabled(false)
            }

            if (
                posts[index].image.endsWith('mp4') ||
                posts[index].image.endsWith('mov') ||
                posts[index].image.endsWith('webm')
            ) {
                index = prevIndex
            }

            await message.edit({
                embeds: [postEmbed(posts[index])],
                components: [actionRow],
            })
        }

        await interaction.editReply({
            components: [asDisabled(actionRow)],
        })
    },
} as SlashSubcommand
