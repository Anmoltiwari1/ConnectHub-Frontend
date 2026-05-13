import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API, apiFetch } from '../config/api';

/**
 * PROFILE PAGE
 * ------------
 * Displays user info and allows editing profile + changing password.
 */
export default function ProfilePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiFetch(`${API.AUTH}/profile?userId=${user.userId}`);
        setProfile(data);
        setEditData({
          fullName: data.fullName || '',
          username: data.username || '',
          bio: data.bio || '',
          avatarUrl: data.avatarUrl || '',
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, [user.userId]);

  const handleSave = async () => {
    setError('');
    setMessage('');
    try {
      let newAvatarUrl = editData.avatarUrl;

      // 1. Upload new avatar if selected
      if (avatarFile) {
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('image', avatarFile);
        formData.append('uploaderId', user.userId);
        formData.append('roomId', 'PROFILE');

        const mediaRes = await apiFetch(`${API.MEDIA}/upload/image`, {
          method: 'POST',
          body: formData,
        });
        newAvatarUrl = mediaRes.url;
        setUploadingAvatar(false);
      }

      // 2. Update profile
      const payload = {
        ...editData,
        avatarUrl: newAvatarUrl,
      };

      const updated = await apiFetch(`${API.AUTH}/profile?userId=${user.userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setProfile(updated);
      setEditing(false);
      setAvatarFile(null);
      setMessage('Profile updated successfully!');

      // Update AuthContext with new info
      login({
        ...user,
        fullName: updated.fullName,
        username: updated.username,
        avatarUrl: updated.avatarUrl,
      });
    } catch (err) {
      setUploadingAvatar(false);
      setError('Failed to update profile');
    }
  };

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-card glass">
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading profile…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page animate-reveal">
      <div className="auth-card glass profile-card">
        {/* Back button */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/dashboard')}
          style={{ marginBottom: 24, alignSelf: 'flex-start' }}
          id="back-to-dashboard"
        >
          ← Back
        </button>

        <div className="profile-avatar-lg">
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt="Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
            />
          ) : (
            profile.username?.charAt(0)?.toUpperCase() || '?'
          )}
        </div>

        <h2
          className="gradient-text"
          style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 8 }}
        >
          {profile.fullName || profile.username}
        </h2>
        <p className="subtitle" style={{ textAlign: 'center', marginBottom: 32 }}>
          @{profile.username} · {profile.email}
        </p>

        {message && <div className="success-banner animate-reveal">✅ {message}</div>}
        {error && <div className="error-banner animate-reveal">⚠️ {error}</div>}

        {!editing ? (
          <div className="animate-reveal" style={{ width: '100%' }}>
            <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
              <span className="label">Full Name</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{profile.fullName || 'Not set'}</div>
            </div>
            <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
              <span className="label">Bio</span>
              <div style={{ fontSize: '1rem', opacity: 0.8, lineHeight: 1.6 }}>
                {profile.bio || 'Tell the world about yourself...'}
              </div>
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={() => setEditing(true)}
              id="edit-profile-btn"
              style={{ marginTop: 12 }}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="animate-reveal" style={{ width: '100%' }}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="edit-fullname">Full Name</label>
              <input
                id="edit-fullname"
                className="input"
                value={editData.fullName}
                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="edit-bio">Bio</label>
              <textarea
                id="edit-bio"
                className="input"
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Tell us about yourself"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="label" htmlFor="edit-avatar">Profile Picture</label>
              <input
                type="file"
                id="edit-avatar"
                className="input"
                accept="image/*"
                style={{ padding: '8px' }}
                onChange={(e) => setAvatarFile(e.target.files[0])}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn btn-primary" 
                onClick={handleSave} 
                style={{ flex: 1 }}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setAvatarFile(null);
                }}
                style={{ flex: 1 }}
                disabled={uploadingAvatar}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
