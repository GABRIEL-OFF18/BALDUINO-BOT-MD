import { promises as fs } from 'fs';

const charactersFilePath = './lib/characters.json';

async function loadCharacters() {
  const fileContent = await fs.readFile(charactersFilePath, 'utf-8');
  return JSON.parse(fileContent);
}

function getCharacterById(id, charactersData) {
  return Object.values(charactersData)
    .flatMap(genre => genre.characters)
    .find(character => character.id === id);
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

let handler = async (m, { conn, usedPrefix, command }) => {
  if (!await verifi()) {
    return conn.reply(m.chat, `El comando *<${command}>* solo está disponible para Yuki Suou.\n> https://github.com/The-King-Destroy/YukiBot-MD`, m);
  }

  const chat = global.db.data.chats?.[m.chat] || {};
  if (!chat.gacha && m.isGroup) {
    return m.reply(`Los comandos de Gacha están desactivados en este grupo.\n\nUn administrador puede activarlos con el comando:\n» *${usedPrefix}gacha on*`);
  }

  try {
    const user = global.db.data.users[m.sender];
    const now = Date.now();
    const cooldown = 30 * 60 * 1000;

    if (user.lastClaim && now < user.lastClaim) {
      const remainingTime = Math.ceil((user.lastClaim - now) / 1000);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      let timeString = '';
      if (minutes > 0) {
        timeString += `${minutes} minuto${minutes !== 1 ? 's' : ''} `;
      }
      if (seconds > 0 || timeString === '') {
        timeString += `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
      }
      return m.reply(`Debes esperar *${timeString.trim()}* para usar *${usedPrefix + command}* de nuevo.`);
    }

    const lastRolledCharacterName = chat.lastRolledCharacter?.name || '';
    const isValidClaim = m.quoted?.id === chat.lastRolledMsgId || (m.quoted?.text?.includes(lastRolledCharacterName) && lastRolledCharacterName);

    if (!isValidClaim) {
      return m.reply('Debes citar un personaje válido para reclamar.');
    }

    const characterId = chat.lastRolledId;
    const charactersData = await loadCharacters();
    const character = getCharacterById(characterId, charactersData);

    if (!character) {
      return m.reply('Personaje no encontrado.');
    }

    if (!global.db.data.characters) global.db.data.characters = {};
    if (!global.db.data.characters[characterId]) global.db.data.characters[characterId] = {};

    const characterInDb = global.db.data.characters[characterId];
    characterInDb.name = characterInDb.name || character.name;
    characterInDb.value = typeof characterInDb.value === 'number' ? characterInDb.value : (character.value || 0);
    characterInDb.votes = characterInDb.votes || 0;

    if (characterInDb.reservedBy && characterInDb.reservedBy !== m.sender && now < characterInDb.reservedUntil) {
      let ownerName = await (async () => global.db.data.users[characterInDb.reservedBy].name || (async () => {
        try {
          const name = await conn.getName(characterInDb.reservedBy);
          return typeof name === 'string' && name.trim() ? name : characterInDb.reservedBy.split('@')[0];
        } catch {
          return characterInDb.reservedBy.split('@')[0];
        }
      })())();
      const protectionTime = ((characterInDb.reservedUntil - now) / 1000).toFixed(1);
      return m.reply(`Este personaje está protegido por *${ownerName}* durante *${protectionTime}s.*`);
    }

    if (characterInDb.expiresAt && now > characterInDb.expiresAt && !characterInDb.user && !(characterInDb.reservedBy && now < characterInDb.reservedUntil)) {
      const expirationTime = ((now - characterInDb.expiresAt) / 1000).toFixed(1);
      return m.reply(`El personaje ha expirado ${expirationTime}s.`);
    }

    if (characterInDb.user) {
      let ownerName = await (async () => global.db.data.users[characterInDb.user].name || (async () => {
        try {
          const name = await conn.getName(characterInDb.user);
          return typeof name === 'string' && name.trim() ? name : characterInDb.user.split('@')[0];
        } catch {
          return characterInDb.user.split('@')[0];
        }
      })())();
      return m.reply(`El personaje *${characterInDb.name}* ya ha sido reclamado por *${ownerName}*`);
    }

    characterInDb.user = m.sender;
    characterInDb.claimedAt = now;
    delete characterInDb.reservedBy;
    delete characterInDb.reservedUntil;
    user.lastClaim = now + cooldown;

    if (!Array.isArray(user.characters)) user.characters = [];
    if (!user.characters.includes(characterId)) user.characters.push(characterId);

    let userName = await (async () => global.db.data.users[m.sender].name || (async () => {
      try {
        const name = await conn.getName(m.sender);
        return typeof name === 'string' && name.trim() ? name : m.sender.split('@')[0];
      } catch {
        return m.sender.split('@')[0];
      }
    })())();

    const characterName = characterInDb.name;
    const claimMessage = user.claimMessage;
    const expiresIn = typeof characterInDb.expiresAt === 'number' ? ((now - characterInDb.expiresAt + 60000) / 1000).toFixed(1) : '∞';
    const message = claimMessage
      ? claimMessage.replace(/€user/g, `*${userName}*`).replace(/€character/g, `*${characterName}*`)
      : `*${characterName}* ha sido reclamado por *${userName}*`;

    await conn.reply(m.chat, `${message} (${expiresIn}s)`, m);
  } catch (error) {
    await conn.reply(m.chat, `Se ha producido un problema. Usa *${usedPrefix}report* para informarlo.\n\n${error.message}`, m);
  }
};

handler.help = ['claim'];
handler.tags = ['gacha'];
handler.command = ['claim', 'c', 'reclamar'];
handler.group = true;

export default handler;
