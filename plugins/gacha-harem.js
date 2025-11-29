import { promises as fs } from 'fs';

const charactersFilePath = './lib/characters.json';

async function loadCharacters() {
  const fileContent = await fs.readFile(charactersFilePath, 'utf-8');
  return JSON.parse(fileContent);
}

function flattenCharacters(charactersData) {
  return Object.values(charactersData).flatMap(genre => Array.isArray(genre.characters) ? genre.characters : []);
}

const verifi = async () => {
  try {
    const packageJsonContent = await fs.readFile('./package.json', 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson.repository?.url === 'git+https://github.com/The-King-Destroy/YukiBot-MD.git';
  } catch {
    return false;
  }
};

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!await verifi()) {
    return conn.reply(m.chat, `El comando *<${command}>* solo está disponible para Yuki Suou.\n> https://github.com/The-King-Destroy/YukiBot-MD`, m);
  }

  if (!global.db.data.chats?.[m.chat]?.gacha && m.isGroup) {
    return m.reply(`Los comandos de Gacha están desactivados en este grupo.\n\nUn administrador puede activarlos con el comando:\n» *${usedPrefix}gacha on*`);
  }

  try {
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.characters) global.db.data.characters = {};

    let mentionedJid = await m.mentionedJid;
    let targetUser = mentionedJid && mentionedJid.length ? mentionedJid[0] : m.quoted && await m.quoted.sender ? await m.quoted.sender : m.sender;
    let userName = await (async () => global.db.data.users[targetUser]?.name?.trim() || await conn.getName(targetUser).then(name => typeof name === 'string' && name.trim() ? name : targetUser.split('@')[0]).catch(() => targetUser.split('@')[0]))();

    const charactersData = await loadCharacters();
    const allCharacters = flattenCharacters(charactersData);
    const userCharacters = Object.entries(global.db.data.characters)
      .filter(([, char]) => (char.user || '').replace(/[^0-9]/g, '') === targetUser.replace(/[^0-9]/g, ''))
      .map(([id]) => id);

    if (userCharacters.length === 0) {
      const message = targetUser === m.sender ? 'No tienes personajes reclamados.' : `*${userName}* no tiene personajes reclamados.`;
      return conn.reply(m.chat, message, m, { mentions: [targetUser] });
    }

    userCharacters.sort((a, b) => {
      const charA = global.db.data.characters[a] || {};
      const charB = global.db.data.characters[b] || {};
      const dataA = allCharacters.find(c => c.id === a);
      const dataB = allCharacters.find(c => c.id === b);
      const valueA = typeof charA.value === 'number' ? charA.value : Number(dataA?.value || 0);
      const valueB = typeof charB.value === 'number' ? charB.value : Number(dataB?.value || 0);
      return valueB - valueA;
    });

    const page = parseInt(args[1]) || 1;
    const pageSize = 50;
    const totalPages = Math.ceil(userCharacters.length / pageSize);

    if (page < 1 || page > totalPages) {
      return conn.reply(m.chat, `Página no válida. Hay un total de *${totalPages}* páginas.`, m);
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, userCharacters.length);
    let message = `Personajes reclamados\n\n`;
    message += `Usuario: *${userName}*\n`;
    message += `Personajes: *(${userCharacters.length})*\n\n`;

    for (let i = startIndex; i < endIndex; i++) {
      const charId = userCharacters[i];
      const characterInDb = global.db.data.characters[charId] || {};
      const characterData = allCharacters.find(c => c.id === charId);
      const name = characterData?.name || characterInDb.name || `ID: ${charId}`;
      const value = typeof characterInDb.value === 'number' ? characterInDb.value : Number(characterData?.value || 0);
      message += `» *${name}* (*${value.toLocaleString()}*)\n`;
    }

    message += `\n_Página *${page}* de *${totalPages}*_`;
    await conn.reply(m.chat, message.trim(), m, { mentions: [targetUser] });
  } catch (error) {
    await conn.reply(m.chat, `Se ha producido un problema. Usa *${usedPrefix}report* para informarlo.\n\n${error.message}`, m);
  }
};

handler.help = ['harem'];
handler.tags = ['anime'];
handler.command = ['harem', 'waifus', 'claims'];
handler.group = true;

export default handler;
