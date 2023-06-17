import {
    SlashCommandAutocomplete,
    commands,
    cooldowns,
    getSubcommand,
} from '@commands/command.js'
import { Client, Interaction, PermissionsBitField } from 'discord.js'
import { sendError, sendStaff } from 'util/messaging.js'

interface InteractionListener {
    filter: (interaction: Interaction) => boolean
    execute: (Interaction: Interaction) => void
}

// For buttons, selections, and other stuff that needs to persist throughout
// the whole bot lifetime
const interactionListeners: InteractionListener[] = []

export function registerInteractionListener(listener: InteractionListener) {
    interactionListeners.push(listener)
}

export default {
    async execute(interaction: Interaction, client: Client) {
        for (const listener of interactionListeners) {
            if (listener.filter(interaction)) {
                listener.execute(interaction)
            }
        }

        if (interaction.isChatInputCommand()) {
            const command = commands.get(interaction.commandName)
            console.log(interaction.options.data)

            if (!command) return
            if (!cooldowns.has(command.metadata.name)) {
                cooldowns.set(command.metadata.name, new Map())
            }

            if (command.botpermission != undefined) {
                if (
                    interaction.guild?.members.me?.permissions.has(
                        command.botpermission
                    ) == false
                ) {
                    interaction.reply({
                        ephemeral: true,
                        embeds: [
                            sendError(
                                `I need the \`${command.botpermission.toString()}\` permission to run that.`
                            ),
                        ],
                    })

                    return
                }
            }

            if (command.subcommands) {
                const subcommand = getSubcommand(
                    interaction.options.getSubcommand(),
                    command.subcommands
                )

                if (subcommand?.botpermission) {
                    if (
                        interaction.guild?.members.me?.permissions.has(
                            subcommand.botpermission
                        ) == false
                    ) {
                        interaction.reply({
                            ephemeral: true,
                            embeds: [
                                sendError(
                                    `I need the \`${subcommand.botpermission.toString()}\` permission to run that.`
                                ),
                            ],
                        })

                        return
                    }
                }

                if (subcommand?.permission) {
                    if (
                        !interaction.memberPermissions?.has(
                            subcommand?.permission ??
                                PermissionsBitField.Flags.SendMessages
                        )
                    ) {
                        await interaction.reply({
                            embeds: [
                                sendError(
                                    `You don't have permission to use that command.`
                                ),
                            ],
                            ephemeral: true,
                        })

                        return
                    }
                }
            }

            const now = Date.now()
            const timestamps = cooldowns.get(command.metadata.name)!
            const cooldown = command.cooldown ?? 300

            if (timestamps.has(interaction.user.id)) {
                if (now < timestamps.get(interaction.user.id)!) {
                    interaction.reply({
                        embeds: [
                            sendError(
                                `You are on cooldown for that command. You can use it again <t:${Math.floor(
                                    timestamps.get(interaction.user.id)! / 1000
                                )}:R>.`
                            ),
                        ],

                        ephemeral: true,
                    })

                    return
                }
            }

            timestamps.set(interaction.user.id, now + cooldown)

            if (interaction.memberPermissions) {
                if (
                    !interaction.memberPermissions.has(
                        command?.permission ??
                            PermissionsBitField.Flags.SendMessages
                    )
                ) {
                    await interaction.reply({
                        embeds: [
                            sendError(
                                `You don't have permission to use that command.`
                            ),
                        ],
                        ephemeral: true,
                    })

                    return
                }
            }

            await command.execute({ interaction, client }).catch((err) => {
                console.error(err)

                if (!interaction.replied) {
                    interaction.reply({
                        embeds: [
                            sendError(
                                `There was an error executing the command.`,
                                err
                            ),
                        ],
                        ephemeral: true,
                    })
                } else {
                    interaction.editReply({
                        embeds: [
                            sendError(
                                `There was an error executing the command.`,
                                err
                            ),
                        ],
                    })
                }

                sendStaff(
                    sendError(
                        `Error executing \`/${interaction.commandName} ${
                            interaction.options.getSubcommand() ?? ''
                        }\``,
                        err
                    ).addFields({
                        name: 'Options',
                        value: `\`\`\`js\n${interaction.options.data.map((o) =>
                            JSON.stringify(o.options, undefined, 2).slice(
                                0,
                                1000
                            )
                        )}\n\`\`\``,
                    }),
                    undefined,
                    interaction.guild ?? undefined
                )
            })
        } else if (interaction.isAutocomplete()) {
            const command = commands.get(interaction.commandName) as
                | SlashCommandAutocomplete
                | undefined

            if (!command) return

            command.autocomplete(interaction)
        }
    },
}
