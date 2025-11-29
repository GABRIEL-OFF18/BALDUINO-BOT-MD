import { promises as fs } from 'fs';

const file = './lib/characters.json';

async function load() {
  const fileContent = await fs.readFile(file, 'utf-8');
  return JSON.parse(fileContent);
}

function get(charactersData) {
  return Object.values(charactersData).flatMap(genre => Array.isArray(genre.characters) ? genre.characters : []);
}

let pending = {};

const verifi = async () => {
  try {
    const packageJsonContent = await fs.readFile('./package.json', 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson.repository?.url === 'git+https://github.com/The-King-Destroy/YukiBot-MD.git';
  } catch {
    return false;
  }
};

let handler = async (m, { conn, usedPrefix, command }) => {
  if (!await verifi()) {
    return conn.reply(m.chat, `El comando *<${command}>* solo está disponible para Yuki Suou.\n> https://github.com/The-King-Destroy/YukiBot-MD`, m);
  }

  if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
    return m.reply(`Los comandos de Gacha están desactivados en este grupo.\n\nUn administrador puede activarlos con el comando:\n» *${usedPrefix}gacha on*`);
  }

  try {
    const sender = global.db.data.users[m.sender];
    if (!Array.isArray(sender.characters)) sender.characters = [];

    const mentionedJid = await m.mentionedJid;
    const to = mentionedJid[0] || (m.quoted && await m.quoted.sender);

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return m.reply('Debes mencionar a quien quieras regalarle tus personajes.');
    }

    const receiver = global.db.data.users[to];
    if (!receiver) {
      return m.reply('El usuario mencionado no está registrado.');
    }
    if (!Array.isArray(receiver.characters)) receiver.characters = [];

    const charactersData = await load();
    const allCharacters = get(charactersData);
    const senderCharacters = sender.characters.map(id => {
      const characterInDb = global.db.data.characters?.[id] || {};
      const characterData = allCharacters.find(c => c.id === id);
      const value = typeof characterInDb.value === 'number' ? characterInDb.value : (typeof characterData?.value === 'number' ? characterData.value : 0);
      return {
        id: id,
        name: characterInDb.name || characterData?.name || `ID: ${id}`,
        value: value,
      };
    });

    if (senderCharacters.length === 0) {
      return m.reply('No tienes personajes para regalar.');
    }

    const totalValue = senderCharacters.reduce((sum, char) => sum + char.value, 0);
    let receiverName = await (async () => (global.db.data.users[to].name.trim() || await conn.getName(to).then(name => typeof name === 'string' && name.trim() ? name : to.split('@')[0]).catch(() => to.split('@')[0])))();
    let senderName = await (async () => (global.db.data.users[m.sender].name.trim() || await conn.getName(m.sender).then(name => typeof name === 'string' && name.trim() ? name : m.sender.split('@')[0]).catch(() => m.sender.split('@')[0])))();

    pending[m.sender] = {
      sender: m.sender,
      to: to,
      value: totalValue,
      count: senderCharacters.length,
      ids: senderCharacters.map(c => c.id),
      chat: m.chat,
      timeout: setTimeout(() => delete pending[m.sender], 60000),
    };

    await conn.reply(m.chat, `*${senderName}*, ¿confirmas regalar todo tu harem a *${receiverName}*?\n\nPersonajes a transferir: *${senderCharacters.length}*\nValor total: *${totalValue.toLocaleString()}*\n\nPara confirmar responde a este mensaje con "Aceptar".\n> Esta acción no se puede deshacer, revisa bien los datos antes de confirmar.`, m, { mentions: [to] });
  } catch (error) {
    await conn.reply(m.chat, `Se ha producido un problema. Usa *${usedPrefix}report* para informarlo.\n\n${error.message}`, m);
  }
};

handler.before = async (m, { conn }) => {
  try {
    const p = pending[m.sender];
    if (!p || m.quoted?.text?.toLowerCase() !== 'aceptar') return;
    if (m.sender !== p.sender || p.chat !== m.chat) return;
    if (typeof p.to !== 'string' || !p.to.includes('@')) return;

    const sender = global.db.data.users[m.sender];
    const receiver = global.db.data.users[p.to];

    for (const id of p.ids) {
      const characterInDb = global.db.data.characters?.[id];
      if (!characterInDb || characterInDb.user !== m.sender) continue;

      characterInDb.user = p.to;
      if (!receiver.characters.includes(id)) receiver.characters.push(id);
      sender.characters = sender.characters.filter(charId => charId !== id);

      if (sender.sales?.[id]?.user === m.sender) delete sender.sales[id];
      if (sender.favorite === id) delete sender.favorite;
      if (global.db.data.users[m.sender]?.favorite === id) delete global.db.data.users[m.sender].favorite;
    }

    clearTimeout(p.timeout);
    delete pending[m.sender];

    let receiverName = await (async () => (global.db.data.users[p.to].name.trim() || await conn.getName(p.to).then(name => typeof name === 'string' && name.trim() ? name : p.to.split('@')[0]).catch(() => p.to.split('@')[0])))();
    return await m.reply(`Has regalado con éxito todos tus personajes a *${receiverName}*!\n\n> ❏ Personajes regalados: *${p.count}*\n> ⴵ Valor total: *${p.value.toLocaleString()}*`), true;
  } catch (error) {
    await conn.reply(m.chat, `Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${error.message}`, m);
  }
};

handler.help = ['giveallharem'];
handler.tags = ['gacha'];
handler.command = ['giveallharem'];
handler.group = true;

export default handler;
