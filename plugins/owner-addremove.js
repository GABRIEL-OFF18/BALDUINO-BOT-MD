import db from '../lib/database.js'
import MessageType from '@whiskeysockets/baileys'

const handler = async (m, { conn, text, args, command, isROwner }) => {
if (!isROwner) return
try {
const now = Date.now()
const user = global.db.data.users
let mentionedJid = await m.mentionedJid
let who = mentionedJid && mentionedJid.length ? mentionedJid[0] : m.quoted && await m.quoted.sender ? await m.quoted.sender : null
switch (command) {
case 'addcoin': {
if (!who) return m.reply('Por favor, menciona al usuario o cita un mensaje.')
const coinTxt = text.replace(/^@\S+\s*/, '').trim().split(' ')[0]
if (!coinTxt) return m.reply(`Por favor, ingresa la cantidad que deseas añadir.`)
if (isNaN(coinTxt)) return m.reply(`Solo se permiten números.`)
await m.react('🕒')
const dmt = parseInt(coinTxt)
const impts = 0
const pjkC = Math.ceil(dmt * impts)
if (dmt + pjkC < 1) return m.react('✖️'), m.reply(`Mínimo es *1*`)
user[who].coin += dmt
await m.react('✔️')
m.reply(`*Añadido:*\n» ${dmt} \n@${who.split('@')[0]}, recibiste ${dmt} ${currency}`, null, { mentions: [who] })
break
}
case 'addxp': {
if (!who) return m.reply('Por favor, menciona al usuario o cita un mensaje.')
const xpTxt = text.replace(/^@\S+\s*/, '').trim().split(' ')[0]
if (!xpTxt) return m.reply(`Ingresa la cantidad de experiencia (XP) que deseas añadir.`)
if (isNaN(xpTxt)) return m.reply(`Solo números son permitidos.`)
await m.react('🕒')
const xp = parseInt(xpTxt)
const pajak = 0
const pjkX = Math.ceil(xp * pajak)
if (xp + pjkX < 1) return m.react('✖️'), m.reply(`El mínimo de experiencia (XP) es *1*`)
user[who].exp += xp
await m.react('✔️')
m.reply(`XP Añadido: *${xp}* \n@${who.split('@')[0]}, recibiste ${xp} XP`, null, { mentions: [who] })
break
}
case 'addprem': {
if (!who) return m.reply('Por favor, menciona al usuario o cita un mensaje.')
if (!user[who]) user[who] = { premiumTime: 0, premium: false }
const premArgs = text.split(' ').filter(arg => arg)
if (premArgs.length < 2) return m.reply('Envía un tiempo válido\n> Ejemplo (1h, 2d, 3s, 4m).')
await m.react('🕒')
let tiempo = 0
const cant = parseInt(premArgs[0])
const unidad = premArgs[1]
if (unidad === 'h') tiempo = 3600000 * cant
else if (unidad === 'd') tiempo = 86400000 * cant
else if (unidad === 's') tiempo = 604800000 * cant
else if (unidad === 'm') tiempo = 2592000000 * cant
else return m.react('✖️'), m.reply('Tiempo inválido.\nOpciones:\n h = horas, d = días, s = semanas, m = meses')
user[who].premiumTime = now < user[who].premiumTime ? user[who].premiumTime + tiempo : now + tiempo
user[who].premium = true
const timeLeft = await formatTime(user[who].premiumTime - now)
await m.react('✔️')
m.reply(`Nuevo Usuario Premium!!!\n\nUsuario: @${who.split('@')[0]}\nTiempo Premium: ${cant}${unidad}\nTiempo Restante: ${timeLeft}`, null, { mentions: [who] })
break
}
case 'delprem': {
if (!who) return m.reply('Por favor, menciona al usuario o cita un mensaje.')
if (!user[who]?.premiumTime) return m.react('✖️'), m.reply('El usuario no es premium.')
await m.react('🕒')
user[who].premiumTime = 0
user[who].premium = false
await m.react('✔️')
m.reply(`@${who.split('@')[0]} ya no es usuario premium.`, null, { mentions: [who] })
break
}
case 'listprem': {
await m.react('🕒')
const perm = (global.prems || []).map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').filter(v => v !== conn.user.jid)
const listaPermanentes = perm.map(v => `│ Usuario: @${v.replace(/@.+/, '')}`).join('\n')
const userList = Object.entries(user).filter(([_, v]) => v.premiumTime).map(([key, value]) => ({ ...value, jid: key }))
const sorted = userList.sort((a, b) => a.premiumTime - b.premiumTime)
const len = args[0] ? Math.min(100, Math.max(parseInt(args[0]), 10)) : Math.min(10, sorted.length)
const listaTemporales = await Promise.all(sorted.slice(0, len).map(async ({ jid, premiumTime }) => {
return `┌─⊷ \n│ Usuario: @${jid.split('@')[0]}\n│ Expira en: ${premiumTime > 0 ? await formatTime(premiumTime - now) : 'Expirado'}\n└───────────`
}))
const textList = `PREMIUM PERMANENTE\n\nTotal: ${perm.length}\n┌─⊷\n${listaPermanentes}\n└───────────\n\nUSUARIOS PREMIUM\nTotal: ${sorted.length} \n${listaTemporales.join('\n')}`
const mentions = [...perm, ...sorted.slice(0, len).map(({ jid }) => jid)]
await m.react('✔️')
conn.reply(m.chat, textList, m, { mentions })
break
}}} catch (error) {
m.reply(`Se ha producido un problema\n> Usa \*${usedPrefix}report\* para informarlo\n\n${error.message}
}}

handler.help = ['addcoin', 'addxp', 'addprem', 'delprem', 'listprem']
handler.tags = ['owner']
handler.command = ['addcoin', 'addxp', 'addprem', 'delprem', 'listprem']

export default handler

async function formatTime(ms) {
let s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24)
let months = Math.floor(d / 30), weeks = Math.floor((d % 30) / 7)
s %= 60; m %= 60; h %= 24; d %= 7
let t = months ? [`${months} mes${months > 1 ? 'es' : ''}`] :
weeks ? [`${weeks} semana${weeks > 1 ? 's' : ''}`] :
d ? [`${d} día${d > 1 ? 's' : ''}`] : []
if (h) t.push(`${h} hora${h > 1 ? 's' : ''}`)
if (m) t.push(`${m} minuto${m > 1 ? 's' : ''}`)
if (s) t.push(`${s} segundo${s > 1 ? 's' : ''}`)
return t.length > 1 ? t.slice(0, -1).join(' ') + ' y ' + t.slice(-1) : t[0]
}