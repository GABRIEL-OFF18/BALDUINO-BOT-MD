
import { Boom } from '@hapi/boom';
import {
  default as makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';
import cfonts from 'cfonts';
import chalk from 'chalk';
import handler from './handler.js';
import pkg from 'google-libphonenumber';
const { PhoneNumberUtil } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();

const logger = pino({ level: 'info' });

const { say } = cfonts;

say('GOJO BOT', {
  font: 'block',
  align: 'center',
  colors: ['yellowBright']
});

say(`Made With By ABRAHAN-M Y STAFF GOJO`, {
  font: 'console',
  align: 'center',
  colors: ['cyan']
});

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('.auth_info_baileys');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

  let opcion;
  if (!state.creds || !state.creds.registered) {
    const colores = chalk.bgMagenta.white;
    const opcionQR = chalk.bold.green;
    const opcionTexto = chalk.bold.cyan;
    do {
      opcion = await question(colores('⌨ Seleccione una opción:\n') + opcionQR('1. Con código QR\n') + opcionTexto('2. Con código de texto de 8 dígitos\n--> '));
      if (!/^[1-2]$/.test(opcion)) {
        console.log(chalk.bold.redBright(`✦ No se permiten numeros que no sean 1 o 2, tampoco letras o símbolos especiales.`));
      }
    } while (opcion !== '1' && opcion !== '2');
  }

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: opcion === '1',
    logger,
    browser: ['Chrome (Linux)', '', ''],
  });

  if (opcion === '2' && !sock.authState.creds.registered) {
    let phoneNumber;
    do {
      phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright(`✦ Por favor, Ingrese el número de WhatsApp.\n${chalk.bold.yellowBright(`✏  Ejemplo: 50584xxxxxx`)}\n${chalk.bold.magentaBright('---> ')}`)));
    } while (!await isValidPhoneNumber(phoneNumber));
    const code = await sock.requestPairingCode(phoneNumber.trim());
    console.log(chalk.bold.white(chalk.bgMagenta(`✧ CÓDIGO DE VINCULACIÓN ✧`)), chalk.bold.white(chalk.white(code)));
    rl.close();
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.badSession) {
        console.log(chalk.bold.cyanBright(`\n⚠︎ SIN CONEXIÓN, BORRE LA CARPETA .auth_info_baileys Y REINICIA EL SERVIDOR ⚠︎`));
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ☹\n┆ ⚠︎ CONEXION CERRADA, RECONECTANDO....\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ☹`));
        connectToWhatsApp();
      } else if (reason === DisconnectReason.connectionLost) {
        console.log(chalk.bold.blueBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ☂\n┆ ⚠︎ CONEXIÓN PERDIDA CON EL SERVIDOR, RECONECTANDO....\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ☂`));
        connectToWhatsApp();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log(chalk.bold.yellowBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ✗\n┆ ⚠︎ CONEXIÓN REEMPLAZADA, SE HA ABIERTO OTRA NUEVA SESION, POR FAVOR, CIERRA LA SESIÓN ACTUAL PRIMERO.\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ✗`));
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.bold.redBright(`\n⚠︎ SIN CONEXIÓN, BORRE LA CARPETA .auth_info_baileys Y REINICIA EL SERVIDOR  ⚠︎`));
        connectToWhatsApp();
      } else if (reason === DisconnectReason.restartRequired) {
        console.log(chalk.bold.cyanBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ✓\n┆ ✧ CONECTANDO AL SERVIDOR...\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ✓`));
        connectToWhatsApp();
      } else if (reason === DisconnectReason.timedOut) {
        console.log(chalk.bold.yellowBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ▸\n┆ ⧖ TIEMPO DE CONEXIÓN AGOTADO, RECONECTANDO....\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ▸`));
        connectToWhatsApp();
      } else {
        console.log(chalk.bold.redBright(`\n⚠︎！ RAZON DE DESCONEXIÓN DESCONOCIDA: ${reason || 'No encontrado'} >> ${connection || 'No encontrado'}`));
      }
    } else if (connection === 'open') {
      console.log(chalk.bold.green('\nKennyBot Conectado con éxito.'));
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    if (!m.messages) return;
    const msg = m.messages[0];
    await handler(sock, msg);
  });

  return sock;
}

async function isValidPhoneNumber(number) {
  try {
    number = number.replace(/\s+/g, '');
    if (number.startsWith('+521')) {
      number = number.replace('+521', '+52');
    } else if (number.startsWith('+52') && number[4] === '1') {
      number = number.replace('+52 1', '+52');
    }
    const parsedNumber = phoneUtil.parseAndKeepRawInput(number);
    return phoneUtil.isValidNumber(parsedNumber);
  } catch (error) {
    return false;
  }
}

connectToWhatsApp();
