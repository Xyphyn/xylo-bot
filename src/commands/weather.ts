import { SlashCommand, SlashCommandAutocomplete } from '@commands/command.js'
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js'
import { sendError } from 'util/messaging.js'

const baseUrl = 'https://api.open-meteo.com/v1/forecast'
const searchUrl = 'https://geocoding-api.open-meteo.com/v1'

interface searchResult {
    id: number
    name: string
    country: string
    admin1: string
    latitude: number
    longitude: number
}

interface weatherResult {
    latitude: number
    longitude: number
    current_weather: {
        temperature: number
        windspeed: number
        is_day: 0 | 1
    }
    daily: {
        sunrise: string[]
        sunset: string[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        precipitation_probability_max: number[]
    }
}

function getColor(input: number): number {
    const blue = [50, 50, 220]
    const green = [50, 220, 50]
    const red = [220, 50, 50]

    let color: number[] = []

    if (input <= 20) {
        const ratio = input / 20
        color = blue.map((value, index) =>
            Math.round(value + ratio * (green[index] - value))
        )
    } else if (input <= 40) {
        const ratio = (input - 20) / 20
        color = green.map((value, index) =>
            Math.round(value + ratio * (red[index] - value))
        )
    } else {
        color = red
    }

    return parseInt(
        color.map((value) => value.toString(16).padStart(2, '0')).join(''),
        16
    )
}

export default {
    cooldown: 30 * 1000,
    metadata: {
        name: 'weather',
        description: 'Get the weather for a certain location',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'location',
                description: 'The location to get weather for',
                required: true,
                autocomplete: true,
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'units',
                description: 'The units to use for the temperature',
                required: false,
                choices: [
                    {
                        name: 'Celcius',
                        value: 'celcius',
                    },
                    {
                        name: 'Fahrenheit',
                        value: 'fahrenheit',
                    },
                ],
            },
        ],
    },

    async execute({ interaction }) {
        const locOption = interaction.options.getString('location')!
        const locRegex =
            /^(-?[1-8]?\d(?:\.\d{1,6})?|90(?:\.0{1,6})?),(-?(?:1[0-7]\d(?:\.\d{1,6})?|180(?:\.0{1,6})?|[1-9]?\d(?:\.\d{1,6})?))$/gm

        const locData = locOption.split(',')

        if (locData.length != 4) {
            await interaction.reply({
                embeds: [sendError(`Invalid location.`)],
                ephemeral: true,
            })
            return
        }

        const name = locData.slice(0, 2)
        const location = locData.slice(2, 4)

        const match = locRegex.exec(location.join(`,`))

        // maybe i should've just had only celcius as an option
        // and force the 'muricans to use sane units

        // update: i did it

        if (!match) {
            await interaction.reply({
                embeds: [sendError(`Invalid location.`)],
                ephemeral: true,
            })
            return
        }

        const unit = '°C'

        const [latitude, longitude] = location

        await interaction.deferReply()

        const params = new URLSearchParams([
            ['latitude', latitude],
            ['longitude', longitude],
            [
                'daily',
                'weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max',
            ],
            ['current_weather', 'true'],
            ['forecase_days', '1'],
            ['timezone', 'GMT'],
        ])

        const data: weatherResult = await fetch(`${baseUrl}?${params}`).then(
            (res) => res.json()
        )

        const embed = new EmbedBuilder({
            title: `Weather in ${name.join(', ')}`,
            description: `Good ${
                data.current_weather.is_day ? 'Day' : 'Evening'
            }!`,
            color: getColor(data.current_weather.temperature),
            fields: [
                {
                    name: 'Temperature',
                    value: `${data.current_weather.temperature}${unit}`,
                    inline: true,
                },
                {
                    name: 'Wind speed',
                    value: `${data.current_weather.windspeed}kph`,
                    inline: true,
                },
                {
                    name: 'Rain probability',
                    value: `${data.daily.precipitation_probability_max[0]}%`,
                    inline: true,
                },
                {
                    name: 'Sunrise',
                    value: `<t:${Math.floor(
                        new Date(data.daily.sunset[0]).getTime() / 1000
                    )}:t>`,
                    inline: true,
                },
                {
                    name: 'Sunset',
                    value: `<t:${Math.floor(
                        new Date(data.daily.sunset[0]).getTime() / 1000
                    )}:t>`,
                    inline: true,
                },
            ],
            footer: { text: `${data.latitude}, ${data.longitude}` },
            timestamp: Date.now(),
        })

        await interaction.editReply({
            embeds: [embed],
        })
    },

    async autocomplete(int) {
        const choice = int.options.getFocused()

        if (choice == '') {
            await int.respond([])
            return
        }

        const data: { results: searchResult[] } = await fetch(
            `${searchUrl}/search?name=${choice}&count=10`
        )
            .then((res) => res.json())
            .catch((_) => undefined)

        const filtered = data?.results?.slice(0, 24)
        if (!filtered) {
            await int.respond([])
            return
        }

        await int.respond(
            filtered.map((c) => ({
                name: `${c.name}, ${c.admin1}, ${c.country}`,
                value: `${c.name},${c.admin1 ?? c.country},${c.latitude},${
                    c.longitude
                }`,
            }))
        )
    },
} as SlashCommand & SlashCommandAutocomplete
