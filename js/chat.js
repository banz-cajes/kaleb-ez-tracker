// ============================================
// C4 SYSTEMS - Team and direct chat
// ============================================

let chatMessages = [];
let chatListeners = [];
let chatMessageMap = new Map();
let isChatOpen = false;
let unreadCount = 0;
let activeChat = { type: 'team', userId: null, userName: null };

function initChat() {
    if (!currentUser) return setTimeout(initChat, 1000);
    loadChatRecipients();
    setupChatListener();
}

async function loadChatRecipients() {
    const selector = document.getElementById('chatRecipient');
    if (!selector || !db || !currentUser) return;
    try {
        const snapshot = await db.collection('chat_profiles').orderBy('email').get();
        const users = snapshot.docs
            .filter(doc => doc.id !== currentUser.uid)
            .map(doc => ({ id: doc.id, ...doc.data() }));
        selector.innerHTML = '<option value="">Direct message…</option>' + users.map(user => {
            const name = user.name || user.email || 'User';
            return `<option value="${user.id}" data-name="${escapeHtml(name)}">${escapeHtml(name)}${user.email ? ` (${escapeHtml(user.email)})` : ''}</option>`;
        }).join('');
    } catch (error) {
        console.warn('Unable to load chat recipients:', error.message);
        selector.title = 'Unable to load users for direct messages';
    }
}

function toggleChat() {
    const chatBox = document.getElementById('chatBox');
    isChatOpen = chatBox.style.display !== 'none';
    chatBox.style.display = isChatOpen ? 'none' : 'flex';
    if (!isChatOpen) {
        setTimeout(() => document.getElementById('chatInput')?.focus(), 300);
        scrollChatToBottom();
        markAllMessagesAsRead();
    }
}

function selectTeamChat() {
    activeChat = { type: 'team', userId: null, userName: null };
    const selector = document.getElementById('chatRecipient');
    if (selector) selector.value = '';
    updateActiveChatUI();
}

function selectDirectChat(userId) {
    if (!userId) return selectTeamChat();
    const option = document.querySelector(`#chatRecipient option[value="${userId}"]`);
    activeChat = { type: 'direct', userId, userName: option?.dataset.name || option?.textContent || 'Direct message' };
    updateActiveChatUI();
}

function updateActiveChatUI() {
    const isTeam = activeChat.type === 'team';
    document.getElementById('teamChatButton')?.classList.toggle('active', isTeam);
    const title = document.getElementById('chatTitle');
    const input = document.getElementById('chatInput');
    if (title) title.textContent = isTeam ? 'Team Chat' : activeChat.userName;
    if (input) input.placeholder = isTeam ? 'Message the team...' : `Message ${activeChat.userName}...`;
    renderChatMessages();
    markAllMessagesAsRead();
}

function setupChatListener() {
    chatListeners.forEach(unsubscribe => unsubscribe());
    chatListeners = [];
    chatMessageMap.clear();
    if (!db || !currentUser) return;
    const handleSnapshot = snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'removed') chatMessageMap.delete(change.doc.id);
            else chatMessageMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
        });
        chatMessages = [...chatMessageMap.values()].sort((a, b) => getMessageTime(a) - getMessageTime(b));
        renderChatMessages();
        updateUnreadCount();
    };
    const handleError = error => {
        console.warn('Chat listener error:', error.message);
        if (error.code === 'permission-denied') showToast('Chat unavailable: insufficient Firestore permissions.', 'error');
    };
    // Separate, rule-compatible queries keep direct messages private to participants.
    chatListeners.push(db.collection('chat_messages').where('conversationType', '==', 'team').orderBy('timestamp', 'desc').limit(100).onSnapshot(handleSnapshot, handleError));
    chatListeners.push(db.collection('chat_messages').where('participants', 'array-contains', currentUser.uid).orderBy('timestamp', 'desc').limit(100).onSnapshot(handleSnapshot, handleError));
}

function getMessageTime(message) {
    const value = message.timestamp?.toDate?.() || new Date(message.timestamp || 0);
    return value.getTime() || 0;
}

function messageMatchesActiveChat(message) {
    if (message.conversationType === 'team') return activeChat.type === 'team';
    return activeChat.type === 'direct' && Array.isArray(message.participants) && message.participants.includes(currentUser?.uid) && message.participants.includes(activeChat.userId);
}

function isMessageVisibleToUser(message) {
    return message.conversationType === 'team' || message.participants?.includes(currentUser?.uid);
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const messages = chatMessages.filter(messageMatchesActiveChat);
    if (!messages.length) {
        container.innerHTML = `<div class="chat-welcome"><i class="fas fa-comments" style="font-size:2rem;"></i><p style="margin-top:.5rem;">No messages yet</p><p style="font-size:.7rem;">Start the conversation.</p></div>`;
        return;
    }
    container.innerHTML = messages.map(msg => {
        const isSelf = msg.userId === currentUser?.uid;
        const isUnread = !isSelf && (!msg.readBy || !msg.readBy.includes(currentUser?.uid));
        const time = new Date(getMessageTime(msg));
        const edited = msg.editedAt ? ' <span class="msg-edited">edited</span>' : '';
        return `<div class="chat-message ${isSelf ? 'chat-message-self' : 'chat-message-other'} ${isUnread ? 'unread' : ''}">
            <div class="msg-user">${isSelf ? 'You' : escapeHtml(msg.userName || 'Unknown')}<span class="msg-time">${time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}${edited}</span></div>
            <div>${escapeHtml(msg.text || '')}</div>
            ${isSelf ? `<div class="msg-actions"><button onclick="editChatMessage('${msg.id}')" title="Edit message"><i class="fas fa-pen"></i></button><button onclick="unsendChatMessage('${msg.id}')" title="Unsend message"><i class="fas fa-trash-alt"></i></button></div>` : ''}
        </div>`;
    }).join('');
    scrollChatToBottom();
}

function scrollChatToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input?.value.trim();
    if (!text || !currentUser) return;
    const sendBtn = document.getElementById('chatSendBtn');
    input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    try {
        const direct = activeChat.type === 'direct';
        const message = {
            text, userId: currentUser.uid, userName: currentUser.email?.split('@')[0] || 'User', userEmail: currentUser.email,
            conversationType: direct ? 'direct' : 'team',
            participants: direct ? [currentUser.uid, activeChat.userId].sort() : [],
            readBy: [currentUser.uid], timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        const reference = await db.collection('chat_messages').add(message);
        applyLocalChatMessage({ id: reference.id, ...message, timestamp: new Date() });
        input.value = '';
        if (!await waitForChatWrite()) showToast('Message is queued but not synced. Allow firestore.googleapis.com in your browser blocker.', 'warning');
    } catch (error) { showToast('Failed to send: ' + error.message, 'error');
    } finally { input.disabled = false; if (sendBtn) sendBtn.disabled = false; input.focus(); }
}

async function editChatMessage(id) {
    const message = chatMessages.find(item => item.id === id);
    if (!message || message.userId !== currentUser?.uid) return;
    const result = await Swal.fire({ title: 'Edit message', input: 'text', inputValue: message.text, inputAttributes: { maxlength: 2000 }, showCancelButton: true, confirmButtonText: 'Save' });
    const text = result.value?.trim();
    if (!result.isConfirmed || !text || text === message.text) return;
    try {
        await db.collection('chat_messages').doc(id).update({ text, editedAt: firebase.firestore.FieldValue.serverTimestamp() });
        applyLocalChatMessage({ ...message, text, editedAt: new Date() });
        if (!await waitForChatWrite()) showToast('Edit is queued but not synced. Allow firestore.googleapis.com in your browser blocker.', 'warning');
    }
    catch (error) { showToast('Unable to edit message: ' + error.message, 'error'); }
}

async function unsendChatMessage(id) {
    const message = chatMessages.find(item => item.id === id);
    if (!message || message.userId !== currentUser?.uid) return;
    const result = await Swal.fire({ title: 'Unsend this message?', text: 'It will be removed for everyone.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Unsend', confirmButtonColor: '#ef4444' });
    if (!result.isConfirmed) return;
    try {
        await db.collection('chat_messages').doc(id).delete();
        removeLocalChatMessage(id);
        if (await waitForChatWrite()) showToast('Message unsent', 'success');
        else showToast('Unsend is queued but not synced. Allow firestore.googleapis.com in your browser blocker.', 'warning');
    }
    catch (error) { showToast('Unable to unsend message: ' + error.message, 'error'); }
}

function updateUnreadCount() {
    unreadCount = chatMessages.filter(msg => isMessageVisibleToUser(msg) && msg.userId !== currentUser?.uid && (!msg.readBy || !msg.readBy.includes(currentUser?.uid))).length;
    const badge = document.getElementById('chatBadge');
    if (badge) { badge.textContent = unreadCount; badge.style.display = unreadCount ? 'flex' : 'none'; }
}

async function markAllMessagesAsRead() {
    if (!db || !currentUser) return;
    const unread = chatMessages.filter(msg => messageMatchesActiveChat(msg) && msg.userId !== currentUser.uid && (!msg.readBy || !msg.readBy.includes(currentUser.uid)));
    if (!unread.length) return;
    const batch = db.batch();
    unread.forEach(msg => batch.update(db.collection('chat_messages').doc(msg.id), { readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) }));
    try { await batch.commit(); } catch (error) { console.warn('Unable to mark messages read:', error.message); }
}

// Keep the UI responsive even when Firestore's real-time channel is reconnecting.
// Snapshot listeners remain the source of truth and reconcile these local changes.
function applyLocalChatMessage(message) {
    chatMessageMap.set(message.id, message);
    chatMessages = [...chatMessageMap.values()].sort((a, b) => getMessageTime(a) - getMessageTime(b));
    renderChatMessages();
    updateUnreadCount();
}

function removeLocalChatMessage(id) {
    chatMessageMap.delete(id);
    chatMessages = chatMessages.filter(message => message.id !== id);
    renderChatMessages();
    updateUnreadCount();
}

// Firestore applies offline changes locally first. Wait briefly for the server so
// chat never reports a successful edit/unsend when a browser extension blocked it.
async function waitForChatWrite(timeoutMs = 5000) {
    if (!db?.waitForPendingWrites) return true;
    try {
        return await Promise.race([
            db.waitForPendingWrites().then(() => true),
            new Promise(resolve => setTimeout(() => resolve(false), timeoutMs))
        ]);
    } catch (error) {
        console.warn('Chat write did not sync:', error.message);
        return false;
    }
}

function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendChatMessage(); }
}
