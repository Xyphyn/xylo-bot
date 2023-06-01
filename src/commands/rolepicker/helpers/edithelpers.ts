import { refreshRolepicker } from '@commands/rolepicker/rolepicker.js'
import { Color } from '@config/config.js'
import { client, db } from 'app.js'
import {
    EmbedBuilder,
    ModalBuilder,
    TextInputStyle,
    ActionRowBuilder,
    TextInputBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
} from 'discord.js'
import { errorEmbed, successEmbed } from 'util/embed.js'
import { modalRows } from 'util/modal.js'

export async function editRolePicker(
    id: number,
    interaction: ButtonInteraction | ChatInputCommandInteraction
) {
    const modal = new ModalBuilder({
        custom_id: `xylo:rolepicker:create:modal`,
        title: `Create role picker`,
    })

    const items = [
        new TextInputBuilder({
            label: 'Title',
            style: TextInputStyle.Short,
            placeholder: 'The title of the embed',
            custom_id: 'title',
            maxLength: 128,
            required: true,
        }),
        new TextInputBuilder({
            label: 'Description',
            style: TextInputStyle.Paragraph,
            placeholder: 'The description of the embed',
            customId: 'description',
            maxLength: 512,
            required: true,
        }),
        new TextInputBuilder({
            label: 'Unique',
            style: TextInputStyle.Short,
            placeholder: `1 role at max (true/false) (default: false)`,
            customId: 'unique',
            maxLength: 5,
            minLength: 4,
            required: false,
        }),
    ]

    modal.setComponents(modalRows(...items))

    await interaction.showModal(modal)

    try {
        // I'm pretty sure this is a bad practice but we're
        // returning if modalSubmit ends up not existing
        // so i'd say it's okay
        var modalSubmit = await interaction.awaitModalSubmit({
            time: 3 * 60 * 1000,
            dispose: true,
        })
    } catch (error) {
        // User didn't respond in time. Just ignore it.
        return
    }

    await modalSubmit.deferReply({ ephemeral: true })

    const title = modalSubmit.fields.getTextInputValue('title')!
    const description = modalSubmit.fields.getTextInputValue('description')!
    const uniqueText = modalSubmit.fields.getTextInputValue('unique')

    // wtf, i'm so tired
    // basically, if uniqueText is undefined, return undefined
    // if it is defined, then if it's true return true, otherwise false
    // this catches if someone puts in something cursed like
    // היכאדהואודאיסושדעאדועאוסדיואעשדיה
    let unique = uniqueText
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
            embeds: [errorEmbed(`That rolepicker isn't in this guild.`)],
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
            embeds: [
                new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(description)
                    .setColor(Color.primary)
                    .setFooter({
                        text: `Selector ID: ${rolepicker.id} | Use /rolepicker addrole to add a role.`,
                    }),
            ],
        })
    } catch (error) {
        await modalSubmit.editReply({
            embeds: [
                errorEmbed(
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

    try {
        await refreshRolepicker(
            newRolePicker.message_id,
            newRolePicker.channel_id
        )

        await modalSubmit.editReply({
            embeds: [successEmbed(`Successfully updated that role picker.`)],
        })
    } catch (error) {
        await modalSubmit.editReply({
            embeds: [
                errorEmbed(`Failed to update that role picker.`)
                    .addFields([
                        {
                            name: 'Message',
                            value: `${error}`,
                        },
                    ])
                    .setFooter({
                        text: `Please inform an admin about this.`,
                    }),
            ],
        })
    }
}
