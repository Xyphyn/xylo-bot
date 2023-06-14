import { db } from 'app.js'
import { caching } from 'cache-manager'

export enum Color {
    primary = 0xffffff,
    error = 0xee3333,
    success = 0x33ee77,
    warning = 0xffdd33,
}

export enum BotEmoji {
    error = '<:error:1110296556118233250>',
    success = '<:success:1110297580358864966>',
    warning = '<:warning:1110297581281619969>',
}

const configCache = await caching('memory', {
    max: 100,
    ttl: 60 * 1000,
})

export interface GuildConfigData {
    embedColor: number
    logChannel?: string
}

const defaultConfig: GuildConfigData = {
    embedColor: 0xbd00ff,
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
