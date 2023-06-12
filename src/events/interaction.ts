import { Interaction } from 'discord.js'

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
    async execute({ interaction }: { interaction: Interaction }) {
        for (const listener of interactionListeners) {
            if (listener.filter(interaction)) {
                listener.execute(interaction)
            }
        }
    },
}
