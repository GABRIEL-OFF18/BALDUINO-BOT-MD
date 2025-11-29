import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix }) => {
try {
if (!text) return conn.reply(m.chat, `Por favor, ingresa el nombre del Pokemon que quieres buscar.`, m)
const url = `https://some-random-api.com/pokemon/pokedex?pokemon=${encodeURIComponent(text)}`
await m.react('🕒')
const response = await fetch(url)
const json = await response.json()
if (!response.ok) return conn.reply(m.chat, 'Ocurrió un error.', m)
const aipokedex = `*Pokedex - Información*\n\nNombre: ${json.name}\nID: ${json.id}\nTipo: ${json.type}\nHabilidades: ${json.abilities}\nTamaño: ${json.height}\nPeso: ${json.weight}\nDescripción: ${json.description}\n\nEncuentra más detalles sobre este Pokémon en la Pokedex:\nhttps://www.pokemon.com/es/pokedex/${json.name.toLowerCase()}`
conn.reply(m.chat, aipokedex, m)
await m.react('✔️')
} catch (error) {
await m.react('✖️')
await conn.reply(m.chat, `Se ha producido un problema. Usa *${usedPrefix}report* para informarlo.`, m)
}}

handler.help = ['pokedex']
handler.tags = ['fun']
handler.command = ['pokedex']
handler.group = true

export default handler