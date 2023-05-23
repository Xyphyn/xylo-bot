import { BotEmoji, Color } from '@config/config.js'
import { EmbedBuilder, GuildMember } from 'discord.js'

export async function mute(
    member: GuildMember,
    millis: number,
    reason?: string
) {
    if (member.moderatable) {
        await member.timeout(millis, reason)

        return new EmbedBuilder()
            .setTitle('Timeout')
            .setDescription(
                `${BotEmoji.warning} <@${member.id}> was timed out.`
            )
            .setColor(Color.warning)
            .addFields([
                {
                    name: 'Reason',
                    value: reason || 'No reason provided.',
                },
            ])
    }

    return new EmbedBuilder()
        .setTitle('Error')
        .setDescription(
            `${BotEmoji.error} <@${member.id}> cannot be timed out. Do they have a higher permission?`
        )
        .setColor(Color.error)
}
