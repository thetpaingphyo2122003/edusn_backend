const SUPPORT_DISPLAY_NAME = 'EDUSN Support';
const STAFF_ROLES = ['admin', 'staff', 'super_admin'];

const isStaffRole = (role) => STAFF_ROLES.includes(role);

const isSupportRoom = (room) => {
    if (!room) return false;
    return (
        room.room_type === 'support' ||
        room.chat_type === 'support' ||
        room.is_support_chat === true
    );
};

const supportRoomQuery = () => ({
    $or: [
        { room_type: 'support' },
        { chat_type: 'support' },
        { is_support_chat: true }
    ]
});

const formatMessageForViewer = (message, viewer, room = null) => {
    const msg = message?.toObject ? message.toObject() : { ...message };
    const supportContext = isSupportRoom(room) || msg.is_staff_reply === true;
    const viewerIsStaff = isStaffRole(viewer?.role);
    const senderIsStaff = isStaffRole(msg.sender?.role);

    if (msg.visible_to_staff_only && !viewerIsStaff) {
        return null;
    }

    // In support chats, end users should only see "EDUSN Support" for staff/admin senders.
    if (supportContext && senderIsStaff && !viewerIsStaff) {
        msg.sender = {
            ...msg.sender,
            name: SUPPORT_DISPLAY_NAME,
            role: 'support'
        };

        if (msg.reply_to?.sender_name && msg.reply_to?.sender_id?.toString() !== viewer?._id?.toString()) {
            msg.reply_to = {
                ...msg.reply_to,
                sender_name: SUPPORT_DISPLAY_NAME
            };
        }
    }

    return msg;
};

const formatMessagesForViewer = (messages, viewer, room = null) =>
    messages
        .map((message) => formatMessageForViewer(message, viewer, room))
        .filter(Boolean);

const canAccessRoom = (room, user) => {
    if (!room || !user) return false;

    if (isStaffRole(user.role) && isSupportRoom(room)) {
        return true;
    }

    return room.participants?.some(
        (participant) => participant.user_id?.toString() === user._id.toString()
    );
};

module.exports = {
    SUPPORT_DISPLAY_NAME,
    STAFF_ROLES,
    isStaffRole,
    isSupportRoom,
    supportRoomQuery,
    formatMessageForViewer,
    formatMessagesForViewer,
    canAccessRoom
};
