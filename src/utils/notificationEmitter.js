const notificationRepository = require('../repositories/notificationRepository');

const ADMIN_ROOM = 'admin_notifications';

const userInboxRoom = (userId) => `user_inbox_${userId}`;

let io = null;

function setNotificationIo(socketIo) {
    io = socketIo;
}

function emitToAdmins(event, payload) {
    if (!io) return;
    io.to(ADMIN_ROOM).emit(event, payload);
}

function emitToUser(userId, event, payload) {
    if (!io || !userId) return;
    io.to(userInboxRoom(String(userId))).emit(event, payload);
}

async function createAndBroadcast(data) {
    const notification = await notificationRepository.createNotification({
        ...data,
        read: data.read ?? false
    });

    if (notification) {
        emitToAdmins('admin_notification', {
            success: true,
            data: notification
        });
    }

    return notification;
}

function broadcastRead(id) {
    emitToAdmins('admin_notification_read', { success: true, data: { id } });
}

function broadcastAllRead() {
    emitToAdmins('admin_notifications_all_read', { success: true });
}

function broadcastDeleted(id) {
    emitToAdmins('admin_notification_deleted', { success: true, data: { id } });
}

module.exports = {
    ADMIN_ROOM,
    userInboxRoom,
    setNotificationIo,
    emitToAdmins,
    emitToUser,
    createAndBroadcast,
    broadcastRead,
    broadcastAllRead,
    broadcastDeleted
};
