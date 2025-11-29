import moment from 'moment-timezone'

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
if (!text) return conn.reply(m.chat, `Por favor, ingrese el número al que quiere enviar una invitación al grupo.`, m)
if (text.includes('+')) return conn.reply(m.chat, `Ingrese el número todo junto sin el *+*`, m)
if (isNaN(text)) return conn.reply(m.chat, `Ingrese sólo números sin su código de país y sin espacios.`, m)
let group = m.chat
let link = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(group)
let tag = m.sender ? '@' + m.sender.split('@')[0] : 'Usuario'
const chatLabel = m.isGroup ? (await conn.getName(m.chat) || 'Grupal') : 'Privado'
const horario = `${moment.tz('America/Caracas').format('DD/MM/YYYY hh:mm:ss A')}`
const invite = `INVITACIÓN A UN GRUPO\n\nUsuario: ${tag}\nChat: ${chatLabel}\nFecha: ${horario}\nLink: ${link}`
await conn.reply(`${text}@s.whatsapp.net`, invite, m, { mentions: [m.sender] })
m.reply(`El enlace de invitación fue enviado al usuario correctamente.`)
}

handler.help = ['invite']
handler.tags = ['group']
handler.command = ['add', 'agregar', 'añadir']
handler.group = true
handler.botAdmin = true

export default handler