import {
    refreshRolepicker,
    rolePickerEmbed,
} from '@commands/rolepicker/rolepicker.js'
import { client, db } from 'app.js'
import {
    TextInputStyle,
    ButtonInteraction,
    ChatInputCommandInteraction,
} from 'discord.js'
import { sendError, sendSuccess } from 'util/messaging.js'
import { awaitModal, makeModal, parseModalFields } from 'util/modal.js'

export async function editRolePicker(
    id: number,
    interaction: ButtonInteraction | ChatInputCommandInteraction
) {
    const modal = makeModal({
        data: { id: 'createmodal', title: 'Create role picker' },
        inputs: [
            {
                label: 'Title',
                style: TextInputStyle.Short,
                placeholder: 'The title of the embed',
                id: 'title',
                maxLength: 128,
                required: true,
            },
            {
                label: 'Description',
                style: TextInputStyle.Paragraph,
                placeholder: 'The description of the embed',
                id: 'description',
                maxLength: 512,
                required: true,
            },
            {
                label: 'Unique',
                style: TextInputStyle.Short,
                placeholder: `1 role at max (true/false) (default: false)`,
                id: 'unique',
                maxLength: 5,
                minLength: 4,
                required: false,
            },
        ],
    })

    await interaction.showModal(modal)

    const modalSubmit = await awaitModal(interaction)

    if (!modalSubmit) return

    await modalSubmit.deferReply({ ephemeral: true })

    const [title, description, uniqueText] = parseModalFields(
        modalSubmit.fields,
        ['title', 'description', 'unique']
    )

    // wtf, i'm so tired
    // basically, if uniqueText is undefined, return undefined
    // if it is defined, then if it's true return true, otherwise false
    // this catches if someone puts in something cursed like
    // היכאדהואודאיסושדעאדועאוסדיואעשדיה
    const unique = uniqueText
        ? uniqueText.toLowerCase() == 'true'
            ? true
            : false
        : undefined

    const rolepicker = await db.roleSelector.findFirst({
        where: {
            id: id,
        },
    })

    if (!rolepicker || rolepicker.guild_id != interaction.guildId) {
        await modalSubmit.editReply({
            embeds: [sendError(`That rolepicker isn't in this guild.`)],
        })

        return
    }

    try {
        const channel = await client.channels.fetch(rolepicker.channel_id)

        if (!channel || !channel.isTextBased()) {
            throw Error('Missing role picker')
        }

        const message = await channel!.messages.fetch(rolepicker.message_id)

        await message.edit({
            embeds: [rolePickerEmbed(title, description)],
        })
    } catch (error) {
        await modalSubmit.editReply({
            embeds: [
                sendError(
                    `The message of that rolepicker doesn't exist. Was it deleted?`
                ),
            ],
        })

        return
    }

    const newRolePicker = await db.roleSelector.update({
        where: {
            id: rolepicker.id,
        },
        data: {
            unique: unique,
        },
    })

    await refreshRolepicker(newRolePicker.message_id, newRolePicker.channel_id)
        .then(async () => {
            await modalSubmit.editReply({
                embeds: [sendSuccess(`Successfully updated that role picker.`)],
            })
        })
        .catch(async (error) => {
            await modalSubmit.editReply({
                embeds: [
                    sendError(`Failed to update that role picker.`, error),
                ],
            })
        })
}
