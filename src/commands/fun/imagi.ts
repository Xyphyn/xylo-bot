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
            idle: 30 * 1000,
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
        })

        collector.on('end', async () => {
            actionRow.components.forEach((c) => c.setDisabled(true))
            await message.edit({
                components: [actionRow],
            })
        })
    },
} as SlashSubcommand
