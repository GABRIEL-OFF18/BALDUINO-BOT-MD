import path from "path"
import { File } from "megajs"

const handler = async (m, { conn, args, usedPrefix, command, text }) => {
if (!text) {
return conn.reply(m.chat, `Por favor, envia un link de MEGA para descargar el archivo.`, m)
}
try {
await m.react('🕒')
const file = File.fromURL(text)
await file.loadAttributes()
let maxSize = 300 * 1024 * 1024;
if (file.size >= maxSize) {
return conn.reply(m.chat, `El archivo es demasiado pesado (Peso máximo: 300MB).`, m)
}
let cap = `*MEGA - DOWNLOADER*

Nombre: ${file.name}
Tamaño: ${formatBytes(file.size)}
URL: ${text}`
m.reply(cap)
const data = await file.downloadBuffer()
const fileExtension = path.extname(file.name).toLowerCase()
const mimeTypes = {
".mp4": "video/mp4",
".pdf": "application/pdf",
".zip": "application/zip",
".rar": "application/x-rar-compressed",
".7z": "application/x-7z-compressed",
".jpg": "image/jpeg",
".jpeg": "image/jpeg",
".png": "image/png",
}
let mimetype = mimeTypes[fileExtension] || "application/octet-stream"
await conn.sendFile(m.chat, data, file.name, "", m, null, { mimetype, asDocument: true })
await m.react('✔️')
} catch (e) {
await m.react('✖️')
return conn.reply(m.chat, `Se ha producido un problema. Usa *${usedPrefix}report* para informarlo.`, m)
}}

handler.help = ["mega"]
handler.tags = ["descargas"]
handler.command = ["mega", "mg"]
handler.group = true

export default handler

function formatBytes(bytes) {
if (bytes === 0) return '0 Bytes'
const k = 1024
const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
const i = Math.floor(Math.log(bytes) / Math.log(k))
return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
