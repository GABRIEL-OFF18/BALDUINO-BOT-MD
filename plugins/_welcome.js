import { WAMessageStubType } from '@whiskeysockets/baileys'

const image_urls = [
  'https://spacny.wuaze.com//uploads/IMG-20251202-WA0010.jpg',
  'https://spacny.wuaze.com//uploads/IMG-20251202-WA0012.jpg',
  'https://spacny.wuaze.com//uploads/IMG-20251125-WA0353_1_.jpg',
  'https://spacny.wuaze.com//uploads/IMG-20251202-WA0011.jpg',
  'https://spacny.wuaze.com//uploads/IMG-20251202-WA0009.jpg'
]

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

async function generateWelcome({ conn, userId, groupMetadata, chat }) {
  const username = `@${userId.split('@')[0]}`
  const groupName = groupMetadata.subject
  const groupDesc = groupMetadata.desc?.toString() || 'Sin descripción'

  const welcome_messages = [
    `🎉 ¡Bienvenido/a, ${username}! 🎉\n\nEstamos muy contentos de tenerte en *${groupName}*.`,
    `¡Hola, ${username}! 👋\n\nEsperamos que disfrutes tu estadía en *${groupName}*.`,
    `¡Hey, ${username}! ✨\n\nBienvenido/a a la familia de *${groupName}*.`
  ]

  const message = pickRandom(welcome_messages)
  const imageUrl = pickRandom(image_urls)

  const caption = `${message}\n\n*Descripción del grupo:*\n${groupDesc}`

  return { imageUrl, caption, mentions: [userId] }
}

async function generateGoodbye({ conn, userId, groupMetadata, chat }) {
  const username = `@${userId.split('@')[0]}`
  const groupName = groupMetadata.subject

  const goodbye_messages = [
    `😢 Adiós, ${username}. 😢\n\nTe extrañaremos en *${groupName}*.`,
    `Hasta luego, ${username}. 👋\n\nEsperamos verte de nuevo en *${groupName}*.`,
    `¡Nos vemos, ${username}! ✨\n\nGracias por haber sido parte de *${groupName}*.`
  ]

  const message = pickRandom(goodbye_messages)
  const imageUrl = pickRandom(image_urls)

  const caption = `${message}`

  return { imageUrl, caption, mentions: [userId] }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (m.messageStubType) {
    // This is a group event, handle welcome/goodbye
    const chat = global.db.data.chats[m.chat]
    const userId = m.messageStubParameters[0]
    const groupMetadata = await conn.groupMetadata(m.chat)

    if (chat.welcome && m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {
      const { imageUrl, caption, mentions } = await generateWelcome({ conn, userId, groupMetadata, chat })
      await conn.sendMessage(m.chat, { image: { url: imageUrl }, caption, mentions }, { quoted: null })
    }

    if (chat.welcome && (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_REMOVE || m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_LEAVE)) {
      const { imageUrl, caption, mentions } = await generateGoodbye({ conn, userId, groupMetadata, chat })
      await conn.sendMessage(m.chat, { image: { url: imageUrl }, caption, mentions }, { quoted: null })
    }
    return
  }

  // This is a command, handle .welcome on/off
  let chat = global.db.data.chats[m.chat]
  let welcome = 'bienvenida'
  let bye = 'despedida'
  let type = (args[0] || '').toLowerCase()

  switch (type) {
    case 'on':
    case 'enable':
      if (chat.welcome) return m.reply(`『✦』La ${welcome} ya está activada en este grupo.`)
      chat.welcome = true
      m.reply(`『✅』La ${welcome} se ha activado correctamente en este grupo.`)
      break
    case 'off':
    case 'disable':
      if (!chat.welcome) return m.reply(`『✦』La ${welcome} no está activada en este grupo.`)
      chat.welcome = false
      m.reply(`『✅』La ${welcome} se ha desactivado correctamente en este grupo.`)
      break
    default:
      return m.reply(`*✦─━╎「 ${command.toUpperCase()} 」╎━─✦*\n\n*OPTIONS:*\n*• on »* Activa las bienvenidas\n*• off »* Desactiva las bienvenidas\n\n*▸ Example:* ${usedPrefix + command} on`)
  }
}

handler.help = ['welcome']
handler.tags = ['group']
handler.command = /^(welcome)$/i
handler.admin = true
handler.group = true
handler.all = async function (m) {
    if (m.messageStubType) {
        await handler(m, { conn: this })
    }
}


export default handler
