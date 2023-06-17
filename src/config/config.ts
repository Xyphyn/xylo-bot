import { db } from 'app.js'
import { caching } from 'cache-manager'

export enum Color {
    primary = 0xffffff,
    error = 0xda373c,
    success = 0x2dc770,
    warning = 0xffcc33,
}

export enum BotEmoji {
    error = '<:error:1119439881148571679>',
    success = '<:success:1119439884051026000>',
    warning = '<:warning:1119439886588592178>',
    shield = '<:shieldexclamation:1119439885435162717>',
}

const configCache = await caching('memory', {
    max: 100,
    ttl: 60 * 1000,
})

export interface GuildConfigData {
    embedColor: number
    logging: {
        enabled: boolean
        channel?: string
    }
}

const defaultConfig: GuildConfigData = {
    embedColor: 0xffffff,
    logging: {
        enabled: false,
    },
}

export async function getConfig(guildId: string): Promise<GuildConfigData> {
    const dbConfig = await configCache.wrap(
        guildId,
        async () => await db.guildConfig.findFirst({ where: { id: guildId } })
    )

    if (dbConfig) {
        const json = JSON.parse(dbConfig.config!.toString())
        return { ...defaultConfig, ...json }
    } else {
        const result = await db.guildConfig.create({
            data: {
                config: JSON.stringify(defaultConfig),
                id: guildId,
            },
        })
        await configCache.set(guildId, result)
        return defaultConfig
    }
}

export async function refreshConfig(guildId: string): Promise<GuildConfigData> {
    const data = await db.guildConfig.findFirst({ where: { id: guildId } })

    if (data) {
        const json = JSON.parse(data.config!.toString())
        await configCache.set(guildId, data)
        return { ...defaultConfig, ...json }
    } else {
        const result = await db.guildConfig.create({
            data: {
                config: JSON.stringify(defaultConfig),
                id: guildId,
            },
        })
        await configCache.set(guildId, result)
        return defaultConfig
    }
}
