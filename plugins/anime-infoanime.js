import fetch from 'node-fetch'

var handler = async (m, { conn, usedPrefix, command, text }) => {
if (!text) return conn.reply(m.chat, `Por favor, ingrese el nombre de un anime.`, m)
try {
await m.react('🕒')
let res = await fetch('https://api.jikan.moe/v4/manga?q=' + text)
if (!res.ok) {
await m.react('✖️')
return conn.reply(m.chat, `Ocurrió un fallo.`, m)
}
let json = await res.json()
let { chapters, title_japanese, url, type, score, members, background, status, volumes, synopsis, favorites } = json.data[0]
let author = json.data[0].authors[0].name
let animeingfo = `Título: ${title_japanese}
Capítulo: ${chapters}
Transmisión: ${type}
Estado: ${status}
Volumes: ${volumes}
Favorito: ${favorites}
Puntaje: ${score}
Miembros: ${members}
Autor: ${author}
Fondo: ${background}
Sinopsis: ${synopsis}
Url: ${url}`
await conn.sendFile(m.chat, json.data[0].images.jpg.image_url, 'anjime.jpg', '*INFO ANIME*\n\n' + animeingfo, fkontak)
await m.react('✔️')
} catch (error) {
await m.react('✖️')
await conn.reply(m.chat, `Se ha producido un problema. Usa *${usedPrefix}report* para informarlo.`, m)
}}

handler.help = ['infoanime'] 
handler.tags = ['anime']
handler.command = ['infoanime']
handler.group = true

export default handler
