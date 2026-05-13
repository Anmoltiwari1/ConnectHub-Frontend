import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { API, apiFetch } from '../config/api';
import CreateRoomModal from '../components/CreateRoomModal';
import Toast from '../components/Toast';

/**
 * DASHBOARD PAGE
 * --------------
 * The main chat interface. Features:
 * - Sidebar with My Rooms + Public Channels
 * - Real-time messaging via WebSocket
 * - Typing indicators
 * - Unread message badges
 * - Members panel
 * - File upload support
 */
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { connected, subscribe, publish } = useWebSocket();
  const navigate = useNavigate();

  // ─── State ──────────────────────────────────────────────
  const [myRooms, setMyRooms] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [toasts, setToasts] = useState([]);

  const messageListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeRoomRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // ─── Toast Helper ───────────────────────────────────────
  const addToast = useCallback((message, icon = '💬') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // ─── Normalize room objects (backend uses `roomId`, we use `id`) ──
  const normalizeRoom = (room) => ({
    ...room,
    id: room.roomId || room.id,
  });

  // ─── Fetch Rooms ────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    try {
      const [allRoomsRaw, userRoomsRaw] = await Promise.all([
        apiFetch(API.ROOMS),
        apiFetch(`${API.ROOMS}/user/${user.userId}`),
      ]);

      const allRooms = (allRoomsRaw || []).map(normalizeRoom);
      const userRooms = (userRoomsRaw || []).map(normalizeRoom);

      setMyRooms(userRooms);

      // Public rooms are those the user hasn't joined
      const myRoomIds = new Set(userRooms.map((r) => r.id));
      setPublicRooms(allRooms.filter((r) => !myRoomIds.has(r.id)));
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  }, [user.userId]);

  // ─── Fetch Unread Counts ────────────────────────────────
  const fetchUnreadCounts = useCallback(async (rooms) => {
    const counts = {};
    for (const room of rooms) {
      try {
        const count = await apiFetch(
          `${API.ROOMS}/${room.id}/unread/${user.userId}`
        );
        if (count > 0) counts[room.id] = count;
      } catch {
        // ignore
      }
    }
    setUnreadCounts(counts);
  }, [user.userId]);

  // ─── Load Rooms on Mount ────────────────────────────────
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ─── Request Notification Permission ────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ─── Fetch Unread Counts when myRooms changes ──────────
  useEffect(() => {
    if (myRooms.length > 0) {
      fetchUnreadCounts(myRooms);
    }
  }, [myRooms, fetchUnreadCounts]);

  // ─── WebSocket Subscriptions ────────────────────────────
  useEffect(() => {
    if (!connected) return;

    // Subscribe to room-level messages for all joined rooms
    // Backend broadcasts to "/topic/room/{roomId}" (slash, not dot)
    const unsubs = myRooms.map((room) =>
      subscribe(`/topic/room/${room.id}`, (msg) => {
        // The backend uses a "type" field to distinguish message types
        if (msg.type === 'TYPING_INDICATOR') {
          // Handle typing indicator
          const typingUser = msg.senderUsername || msg.content || msg.senderId;
          if (msg.senderId !== user.userId && activeRoomRef.current?.id === room.id) {
            setTypingUsers((prev) => {
              if (!prev.includes(typingUser)) return [...prev, typingUser];
              return prev;
            });
            setTimeout(() => {
              setTypingUsers((prev) => prev.filter((u) => u !== typingUser));
            }, 3000);
          }
          return;
        }

        if (msg.type === 'MESSAGE_DELETE') {
          setMessages((prev) => prev.map((m) =>
            m.id === msg.messageId || m.messageId === msg.messageId
              ? { ...m, isDeleted: true, deleted: true }
              : m
          ));
          return;
        }

        if (msg.type === 'MESSAGE_PIN') {
          console.log('📌 Received pin update:', msg);
          const newPinnedStatus = msg.pinned !== undefined ? msg.pinned : msg.isPinned;
          setMessages((prev) => prev.map((m) => {
            const mId = m.messageId || m.id || m._localId;
            if (mId === msg.messageId) {
              return { ...m, isPinned: !!newPinnedStatus, pinned: !!newPinnedStatus };
            }
            return m;
          }));
          return;
        }

        // Skip non-message types (READ_RECEIPT, REACTION, etc.)
        if (msg.type && msg.type !== 'CHAT_MESSAGE' && msg.type !== 'TEXT') return;

        // If this message is for the active room, add it to messages
        if (activeRoomRef.current?.id === room.id) {
          setMessages((prev) => {
            // Prevent duplicates by messageId or matching content+sender
            if (msg.messageId && prev.some((m) => m.messageId === msg.messageId || m.id === msg.messageId)) return prev;
            if (prev.some((m) => m._localId && m.content === msg.content && m.senderId === msg.senderId)) {
              // Replace optimistic message with server-confirmed one
              return prev.map((m) =>
                m._localId && m.content === msg.content && m.senderId === msg.senderId
                  ? { ...msg, id: msg.messageId || msg.id }
                  : m
              );
            }
            return [...prev, { ...msg, id: msg.messageId || msg.id }];
          });

          // Show browser notification if window is hidden
          if (document.hidden && msg.senderId !== user.userId) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`ConnectHub: ${room.name}`, {
                body: `${msg.senderUsername}: ${msg.type === 'IMAGE' ? 'Sent an image' : msg.type === 'FILE' ? 'Sent a file' : msg.content}`
              });
            }
          }
        } else {
          // Otherwise, increment unread count
          setUnreadCounts((prev) => ({
            ...prev,
            [room.id]: (prev[room.id] || 0) + 1,
          }));
          addToast(`New message in ${room.name}`, '📨');

          // Show browser notification for unread message
          if (msg.senderId !== user.userId) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`ConnectHub: ${room.name}`, {
                body: `${msg.senderUsername}: ${msg.type === 'IMAGE' ? 'Sent an image' : msg.type === 'FILE' ? 'Sent a file' : msg.content}`
              });
            }
          }
        }
      })
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [connected, myRooms, subscribe, user.userId, user.username, addToast]);

  // ─── Auto-scroll to bottom ─────────────────────────────
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // ─── Select Room ────────────────────────────────────────
  const selectRoom = async (room) => {
    setActiveRoom(room);
    setMessages([]);
    setTypingUsers([]);
    setShowMembers(false);

    // Clear unread count
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[room.id];
      return updated;
    });

    // Mark as read on server
    try {
      await apiFetch(`${API.ROOMS}/${room.id}/read/${user.userId}`, {
        method: 'POST',
      });
    } catch {
      // ignore
    }

    // Fetch message history
    try {
      const data = await apiFetch(`${API.MESSAGES}/room/${room.id}`);
      const history = (data?.content || data || []).map(m => {
        const pinStatus = m.pinned !== undefined ? m.pinned : m.isPinned;
        return {
          ...m,
          id: m.messageId || m.id,
          isPinned: !!pinStatus,
          pinned: !!pinStatus
        };
      });
      setMessages(history);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }

    // Fetch members
    try {
      const membersList = await apiFetch(`${API.ROOMS}/${room.id}/members`);
      setMembers(membersList || []);
    } catch {
      // ignore
    }
  };

  // ─── Join Room ──────────────────────────────────────────
  const joinRoom = async (room) => {
    try {
      await apiFetch(`${API.ROOMS}/${room.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ 
          userId: user.userId, 
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl
        }),
      });
      await fetchRooms();
      selectRoom(room);
      addToast(`Joined ${room.name}`, '🎉');
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  // ─── Send Message ───────────────────────────────────────
  const sendMessage = async () => {
    if (!messageInput.trim() || !activeRoom) return;

    const content = messageInput.trim();
    const localId = `local-${Date.now()}`;

    const payload = {
      type: 'CHAT_MESSAGE',
      roomId: activeRoom.id,
      senderId: user.userId,
      senderUsername: user.username,
      senderFullName: user.fullName || user.username,
      senderAvatarUrl: user.avatarUrl,
      content,
    };

    // Optimistic UI: show message immediately
    setMessages((prev) => [
      ...prev,
      {
        _localId: localId,
        id: localId,
        senderId: user.userId,
        senderUsername: user.username,
        senderFullName: user.fullName || user.username,
        senderAvatarUrl: user.avatarUrl,
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
    setMessageInput('');

    try {
      // Send via WebSocket — the backend handler persists AND broadcasts
      publish('/app/chat.send', payload);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // ─── Typing Indicator ──────────────────────────────────
  const handleTyping = () => {
    if (!activeRoom || !connected) return;

    // Debounce: only send typing every 3 seconds
    if (typingTimeoutRef.current) return;

    publish('/app/chat.typing', {
      type: 'TYPING_INDICATOR',
      roomId: activeRoom.id,
      senderId: user.userId,
      senderUsername: user.username,
    });

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 3000);
  };

  // ─── File Upload ────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeRoom) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaderId', user.userId);
    formData.append('roomId', activeRoom.id);

    try {
      const result = await apiFetch(`${API.MEDIA}/upload/file`, {
        method: 'POST',
        body: formData,
      });
      addToast('File uploaded successfully', '📎');

      // Send file message via WebSocket (handler persists it)
      const isImage = file.type.startsWith('image/');
      const msgPayload = {
        type: isImage ? 'IMAGE' : 'FILE',
        roomId: activeRoom.id,
        senderId: user.userId,
        senderUsername: user.username,
        senderFullName: user.fullName || user.username,
        senderAvatarUrl: user.avatarUrl,
        content: file.name,
        mediaUrl: result?.url || result?.fileUrl || result?.url,
      };
      publish('/app/chat.send', msgPayload);
    } catch (err) {
      console.error('Upload failed:', err);
      addToast('File upload failed', '❌');
    }

    e.target.value = '';
  };

  // ─── Logout ─────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ─── Delete Message ─────────────────────────────────────
  const handleDeleteMessage = (messageId) => {
    if (!activeRoom || !connected) return;
    publish('/app/chat.delete', {
      type: 'MESSAGE_DELETE',
      roomId: activeRoom.id,
      messageId,
      senderId: user.userId,
    });
    // Optimistic UI update
    setMessages((prev) => prev.map((m) =>
      m.id === messageId || m.messageId === messageId
        ? { ...m, isDeleted: true, deleted: true }
        : m
    ));
  };

  // ─── Pin Message ────────────────────────────────────────
  const handleTogglePin = (msgId, currentPinStatus) => {
    console.log('Attempting to toggle pin:', { msgId, currentPinStatus });
    if (!activeRoom) {
      console.error('No active room to pin message in');
      return;
    }
    if (!connected) {
      console.error('WebSocket not connected, cannot pin message');
      addToast('Connection lost. Please wait...', '⚠️');
      return;
    }
    
    const targetId = msgId;
    const newStatus = !currentPinStatus;

    console.log('Publishing MESSAGE_PIN:', { targetId, newStatus });
    publish('/app/chat.pin', {
      type: 'MESSAGE_PIN',
      roomId: activeRoom.id,
      messageId: targetId,
      senderId: user.userId,
      isPinned: newStatus,
      pinned: newStatus, // Send both to be safe
    });

    // Optimistic UI update
    setMessages((prev) => prev.map((m) => {
      const mId = m.messageId || m.id || m._localId;
      if (mId === targetId) {
        return { ...m, isPinned: newStatus };
      }
      return m;
    }));

    addToast(newStatus ? 'Message pinned' : 'Message unpinned', '📌');
  };

  // ─── Format username ──────────────────────────────────
  const formatSenderName = (msg) => {
    if (msg.senderFullName && msg.senderFullName !== 'null' && msg.senderFullName !== 'undefined') {
      return msg.senderFullName;
    }
    // Fallback to username but prettify it (e.g. "john.doe_123" -> "John Doe")
    const username = msg.senderUsername || 'Unknown';
    if (!username.includes('.') && !username.includes('_')) return username;
    
    return username
      .split(/[._]/)
      .filter(part => isNaN(part)) // remove numbers
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  // ─── Format timestamp ──────────────────────────────────
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="dashboard animate-reveal">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="animate-reveal">
            <Toast message={t.message} icon={t.icon} />
          </div>
        ))}
      </div>

      {/* ─── Sidebar ─────────────────────────────────────── */}
      <div className="sidebar glass">
        <div className="sidebar-header">
          <h2 className="gradient-text">ConnectHub</h2>
          <button
            className="btn btn-primary btn-icon"
            onClick={() => setShowCreateRoom(true)}
            title="Create New Room"
            id="create-room-btn"
          >
            +
          </button>
        </div>

        <div className="sidebar-body">
          {/* Connection Status */}
          <div style={{ marginBottom: 12, textAlign: 'center' }}>
            <span className={`connection-badge ${connected ? 'online' : 'offline'}`}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: connected ? 'var(--success)' : 'var(--danger)',
                display: 'inline-block',
              }} />
              {connected ? 'Connected' : 'Reconnecting…'}
            </span>
          </div>

          {/* My Rooms */}
          <div className="sidebar-section-title">My Rooms</div>
          {myRooms.length === 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 12px' }}>
              No rooms yet. Join one below!
            </p>
          )}
          {myRooms.map((room) => (
            <div
              key={room.id}
              className={`room-item ${activeRoom?.id === room.id ? 'active' : ''}`}
              onClick={() => selectRoom(room)}
              id={`room-${room.id}`}
            >
              <div className="room-icon">
                {room.name?.charAt(0)?.toUpperCase() || '#'}
              </div>
              <div className="room-info">
                <div className="room-name">{room.name}</div>
                <div className="room-desc">{room.description || 'No description'}</div>
              </div>
              {unreadCounts[room.id] > 0 && (
                <span className="unread-badge">{unreadCounts[room.id]}</span>
              )}
            </div>
          ))}

          {/* Public Channels */}
          <div className="sidebar-section-title" style={{ marginTop: 20 }}>
            Public Channels
          </div>
          {publicRooms.length === 0 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '8px 12px' }}>
              All channels joined!
            </p>
          )}
          {publicRooms.map((room) => (
            <div
              key={room.id}
              className="room-item"
              onClick={() => joinRoom(room)}
              id={`public-room-${room.id}`}
            >
              <div className="room-icon" style={{ background: 'linear-gradient(135deg, var(--secondary), var(--warning))' }}>
                {room.name?.charAt(0)?.toUpperCase() || '#'}
              </div>
              <div className="room-info">
                <div className="room-name">{room.name}</div>
                <div className="room-desc">{room.description || 'Click to join'}</div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)' }}>Join</span>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button
            className="btn btn-ghost btn-block btn-sm"
            onClick={() => navigate('/profile')}
            id="profile-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start' }}
          >
            <div className="member-avatar" style={{ width: 24, height: 24, fontSize: '0.7rem' }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                (user.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <span>My Profile</span>
          </button>
          <button
            className="btn btn-danger btn-block btn-sm"
            onClick={handleLogout}
            id="logout-btn"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ─── Main Chat ───────────────────────────────────── */}
      <div className="chat-main glass">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <h2 className={activeRoom ? 'gradient-text' : ''}>
              {activeRoom ? activeRoom.name : 'Select a Room'}
            </h2>
            {activeRoom && (
              <p>{activeRoom.description || 'No description'}</p>
            )}
          </div>
          {activeRoom && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowMembers((prev) => !prev)}
                id="toggle-members-btn"
              >
                👥 Members
              </button>
            </div>
          )}
        </div>

        {/* Message List */}
        <div className="message-list" ref={messageListRef}>
          {!activeRoom ? (
            <div className="message-list-empty">
              <h3 className="gradient-text">Welcome to ConnectHub</h3>
              <p>Select a room from the sidebar to join the conversation.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="message-list-empty">
              <h3 className="gradient-text">No messages yet</h3>
              <p>Be the first to say something!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.senderId === user.userId || msg.senderUsername === user.username;
              return (
                <div
                  key={msg.id || idx}
                  className={`message-bubble animate-reveal ${isMine ? 'message-sent' : 'message-received'}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="message-sender">
                    <div className="member-avatar" style={{ width: 22, height: 22, fontSize: '0.65rem' }}>
                      {msg.senderAvatarUrl ? (
                        <img src={msg.senderAvatarUrl} alt="" />
                      ) : (
                        formatSenderName(msg).charAt(0).toUpperCase()
                      )}
                    </div>
                    <span>{formatSenderName(msg)}</span>
                  </div>
                  
                  <div className="message-content" style={{ position: 'relative' }}>
                    {(msg.isPinned || msg.pinned) && (
                      <span 
                        style={{ 
                          position: 'absolute', 
                          top: -12, 
                          right: -8, 
                          background: 'var(--bg-elevated)', 
                          borderRadius: '50%', 
                          width: 24, 
                          height: 24, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          boxShadow: 'var(--shadow-sm)',
                          border: '1px solid var(--glass-border)',
                          zIndex: 5
                        }} 
                        title="Pinned Message"
                      >
                        📌
                      </span>
                    )}
                    {msg.isDeleted || msg.deleted ? (
                      <span style={{ fontStyle: 'italic', opacity: 0.6 }}>[Message deleted]</span>
                    ) : msg.type === 'IMAGE' ? (
                      <div className="message-image">
                        <img 
                          src={msg.mediaUrl} 
                          alt={msg.content} 
                          onClick={() => window.open(msg.mediaUrl, '_blank')}
                        />
                      </div>
                    ) : msg.type === 'FILE' ? (
                      <div className="message-file">
                        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                          📎 {msg.content}
                        </a>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <div className="message-time">
                    {formatTime(msg.timestamp || msg.sentAt || msg.createdAt)}
                    {isMine && <span className="message-status">✓✓</span>}
                    {msg.isPinned && <span style={{ color: 'var(--warning)', marginLeft: 4 }}>📌</span>}
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ padding: '2px 4px', fontSize: '0.7rem' }}
                        onClick={() => handleTogglePin(msg.id || msg.messageId, msg.pinned !== undefined ? msg.pinned : msg.isPinned)}
                      >
                        {(msg.pinned !== undefined ? msg.pinned : msg.isPinned) ? "Unpin" : "Pin"}
                      </button>
                      {isMine && !(msg.isDeleted || msg.deleted) && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          style={{ padding: '2px 4px', fontSize: '0.7rem' }}
                          onClick={() => handleDeleteMessage(msg.id || msg.messageId)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Typing Indicator */}
        <div className="typing-indicator">
          {typingUsers.length > 0 && (
            <>
              <div className="typing-dots">
                <span /><span /><span />
              </div>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
            </>
          )}
        </div>

        {/* Input Area */}
        {activeRoom && (
          <div className="input-area">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => document.getElementById('file-upload').click()}
              title="Upload File"
              id="upload-btn"
            >
              📎
            </button>
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <input
              type="text"
              className="input"
              placeholder={`Message #${activeRoom.name}...`}
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              autoComplete="off"
              id="message-input"
            />
            <button
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              id="send-btn"
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* ─── Members Panel ───────────────────────────────── */}
      <div className={`members-panel glass ${!showMembers ? 'hidden' : ''}`}>
        <div className="members-header">
          <h4 className="gradient-text">Active Members</h4>
        </div>
        <div className="members-list">
          {members.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              No members found
            </p>
          ) : (
            members.map((member, idx) => (
              <div key={member.id || idx} className="member-item glass-card" style={{ marginBottom: 8 }}>
                <div className="member-avatar">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" />
                  ) : (
                    (member.fullName || member.username || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="member-name">
                  {member.fullName || member.username || 'Unknown'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Create Room Modal ────────────────────────────── */}
      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onCreated={() => {
            setShowCreateRoom(false);
            fetchRooms();
            addToast('Room created successfully!', '🎉');
          }}
        />
      )}
    </div>
  );
}
