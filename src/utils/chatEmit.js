const { getOnlineUsers } = require('../socket/chatSocket');

/**
 * Deliver a chat event to each online participant's socket (no duplicate delivery).
 * Works even when the recipient has not opened that chat room yet.
 */
function emitChatEventToRoom(io, room, event, payload) {
    if (!io || !room?.room_id) return;

    const onlineUsers = getOnlineUsers();
    const delivered = new Set();

    (room.participants || []).forEach((p) => {
        const info = onlineUsers.get(String(p.user_id));
        if (!info?.socketId || delivered.has(info.socketId)) return;
        io.to(info.socketId).emit(event, payload);
        delivered.add(info.socketId);
    });
}

/**
 * Emit per-viewer payloads (e.g. support message masking).
 * payloadBuilder(viewerUser) => payload or null to skip.
 */
async function emitChatEventToRoomPerViewer(io, room, event, payloadBuilder) {
    if (!io || !room?.room_id || typeof payloadBuilder !== 'function') return;

    const delivered = new Set();
    const deliver = (socketId, viewer) => {
        if (!socketId || delivered.has(socketId)) return;
        const payload = payloadBuilder(viewer);
        if (payload == null) return;
        io.to(socketId).emit(event, payload);
        delivered.add(socketId);
    };

    const roomSockets = await io.in(room.room_id).fetchSockets();
    roomSockets.forEach((clientSocket) => deliver(clientSocket.id, clientSocket.user));

    const onlineUsers = getOnlineUsers();
    (room.participants || []).forEach((p) => {
        const info = onlineUsers.get(String(p.user_id));
        if (!info?.socketId) return;
        const sock = io.sockets?.sockets?.get(info.socketId);
        deliver(info.socketId, sock?.user || null);
    });
}

module.exports = { emitChatEventToRoom, emitChatEventToRoomPerViewer };
