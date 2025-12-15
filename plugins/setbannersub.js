let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) throw `🎌 *Ingrese la URL de la imagen para el banner*`
  let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
  let owner = who.split`@`[0]
  let bot = global.conns.find(con => con.user.jid.split`@`[0] == owner)
  if (!bot) return m.reply(`*No se encontró ningún sub bot para el usuario @${owner}*`, false, { mentions: [who] })
  let settings = global.db.data.settings[bot.user.jid]
  if (!settings) return m.reply(`*No se encontró la configuración para el sub bot*`)
  if (!args[0].match(/https?:\/\//)) throw `*La URL debe comenzar con http o https*`
  settings.banner = args[0]
  m.reply(`*El banner del sub bot fue cambiado*`)
}
handler.help = ["setbannersub"]
handler.tags = ["subbot"]
handler.command = /^(setbannersub)$/i
export default handler
