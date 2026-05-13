import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API, apiFetch } from '../config/api';

/**
 * CREATE ROOM MODAL
 * -----------------
 * Allows users to create new rooms with name, description, and privacy settings.
 */
export default function CreateRoomModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      await apiFetch(API.ROOMS, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          type: 'GROUP',
          createdById: user.userId,
          creatorName: user.username,
          isPrivate: String(isPrivate),
        }),
      });
      onCreated();
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} id="close-create-modal">
          &times;
        </button>

        <h3 className="gradient-text">Create New Room</h3>

        <div className="form-group">
          <label className="label" htmlFor="new-room-name">Room Name</label>
          <input
            id="new-room-name"
            className="input"
            placeholder="e.g. Gaming Lounge"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="new-room-desc">Description</label>
          <textarea
            id="new-room-desc"
            className="input"
            placeholder="What is this room about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="room-privacy">Room Type</label>
          <select
            id="room-privacy"
            className="input"
            value={isPrivate ? 'true' : 'false'}
            onChange={(e) => setIsPrivate(e.target.value === 'true')}
          >
            <option value="false">Public Channel</option>
            <option value="true">Private Group</option>
          </select>
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          id="submit-create-room"
          style={{ marginTop: 8 }}
        >
          {loading ? <span className="spinner" /> : 'Create Room'}
        </button>
      </div>
    </div>
  );
}
