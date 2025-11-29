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
    const user = global.db.data.users[m.sender];
    if (!Array.isArray(user.characters)) user.characters = [];

    if (!args.length) {
      return m.reply(`Debes especificar un personaje para eliminar.\n> Ejemplo » *${usedPrefix + command} Yuki Suou*`);
    }

    const characterName = args.join(' ').toLowerCase().trim();
    const charactersData = await loadCharacters();
    const allCharacters = flattenCharacters(charactersData);
    const character = allCharacters.find(c => c.name.toLowerCase() === characterName);

    if (!character) {
      return m.reply(`No se ha encontrado ningún personaje con el nombre *${characterName}*\n> Puedes sugerirlo usando *${usedPrefix}suggest personaje ${characterName}*`);
    }

    if (!global.db.data.characters?.[character.id]) {
      return m.reply(`*${character.name}* no está reclamado por ti.`);
    }

    const characterInDb = global.db.data.characters[character.id];
    if (characterInDb.user !== m.sender || !user.characters.includes(character.id)) {
      return m.reply(`*${character.name}* no está reclamado por ti.`);
    }

    delete global.db.data.characters[character.id];
    user.characters = user.characters.filter(id => id !== character.id);
    if (user.sales?.[character.id]?.user === m.sender) {
      delete user.sales[character.id];
    }
    if (user.favorite === character.id) {
      delete user.favorite;
    }

    await m.reply(`*${character.name}* ha sido eliminado de tu lista de reclamados.`);
  } catch (error) {
    await conn.reply(m.chat, `Se ha producido un problema. Usa *${usedPrefix}report* para informarlo.\n\n${error.message}`, m);
  }
};

handler.help = ['delchar'];
handler.tags = ['gacha'];
handler.command = ['delchar', 'deletewaifu', 'delwaifu'];
handler.group = true;

export default handler;
