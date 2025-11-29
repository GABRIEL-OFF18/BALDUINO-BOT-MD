import { cpus as _cpus, totalmem, freemem, platform, hostname } from 'os'
import { execSync } from 'child_process'
import { sizeFormatter } from 'human-readable'

let format = sizeFormatter({ std: 'JEDEC', decimalPlaces: 2, keepTrailingZeroes: false, render: (literal, symbol) => `${literal} ${symbol}B` })
let handler = async (m, { conn }) => {
let totalUsers = Object.keys(global.db.data.users).length
let totalChats = Object.keys(global.db.data.chats).length
let totalPlugins = Object.values(global.plugins).filter((v) => v.help && v.tags).length
let totalBots = global.conns.filter(conn => conn.user && conn.ws.socket && conn.ws.socket.readyState !== 3).length
let totalCommands = Object.values(global.db.data.users).reduce((acc, user) => acc + (user.commands || 0), 0)
let system = `*Estado del Sistema*\n\nComandos ejecutados: ${toNum(totalCommands)}\nUsuarios registrados: ${totalUsers.toLocaleString()}\nGrupos registrados: ${totalChats.toLocaleString()}\nPlugins: ${totalPlugins}\nBots Activos: ${totalBots}\n\n*Estado del Servidor*\n\nSistema: ${platform()}\nCPU: ${_cpus().length} cores\nRAM: ${format(totalmem())}\nRAM Usado: ${format(totalmem() - freemem())}\nArquitectura: ${process.arch}\nHost ID: ${hostname().slice(0, 8)}...\n\n*Uso de Memoria NODEJS*\n\nRam Utilizada: ${format(process.memoryUsage().rss)}\nHeap Reservado: ${format(process.memoryUsage().heapTotal)}\nHeap Usado: ${format(process.memoryUsage().heapUsed)}\nMódulos Nativos: ${format(process.memoryUsage().external)}\nBuffers de Datos: ${format(process.memoryUsage().arrayBuffers)}`
await conn.reply(m.chat, system, m, rcanal)
}

handler.help = ['estado']
handler.tags = ['info']
handler.command = ['estado', 'status']

export default handler

function toNum(number) {
if (number >= 1000 && number < 1000000) {
return (number / 1000).toFixed(1) + 'k'
} else if (number >= 1000000) {
return (number / 1000000).toFixed(1) + 'M'
} else {
return number.toString()
}}
