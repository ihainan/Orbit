import { useState } from 'react';
import { avatarsApi, getBaseUrl } from '../api/client';

function AvatarUpload({ currentAvatar, onSuccess }) {
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      await avatarsApi.uploadAvatar(file, true);
      onSuccess?.();
      alert('Avatar updated successfully!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = currentAvatar?.avatar_url
    ? `${getBaseUrl()}${currentAvatar.avatar_url}`
    : null;

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Current avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl">
            ?
          </div>
        )}

        {/* Upload overlay */}
        <label className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <span className="text-white text-sm">Change</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div>
        <p className="text-sm text-gray-600">
          {uploading ? 'Uploading...' : 'Click on avatar to change'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Max 5MB, JPG/PNG/GIF
        </p>
      </div>
    </div>
  );
}

export default AvatarUpload;
