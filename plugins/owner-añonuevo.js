let handler = async (m, { conn, usedPrefix, command }) => {
    const message = "Feliz años nuevo espero y este año sea un año maravilloso para todos y que cumplan metas y sueños ATT ABRAHAN-M y Staff oficial";
    const videoUrl = "https://files.catbox.moe/li1723.mp4";

    await m.reply('Iniciando el envío del mensaje de año nuevo a todos los grupos...');

    try {
        const groups = Object.values(conn.chats).filter(chat => chat.id.endsWith('@g.us'));

        for (const group of groups) {
            try {
                const groupMetadata = await conn.groupMetadata(group.id);
                const participants = groupMetadata.participants.map(p => p.id);

                await conn.sendMessage(group.id, {
                    video: { url: videoUrl },
                    caption: message,
                    mentions: participants
                });

                // Adding a delay to avoid being flagged as spam
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                console.error(`Error sending message to group ${group.id}:`, err);
            }
        }

        await m.reply('¡Mensaje de año nuevo enviado a todos los grupos exitosamente!');
    } catch (err) {
        console.error('Error general en el comando de año nuevo:', err);
        await m.reply('Ocurrió un error al intentar enviar los mensajes de año nuevo.');
    }
}

handler.help = ['añonuevo'];
handler.tags = ['owner'];
handler.command = /^(añonuevo)$/i;
handler.owner = true;

export default handler;
