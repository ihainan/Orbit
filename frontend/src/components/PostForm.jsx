import { useState, useRef } from 'react';
import { useCreatePost } from '../hooks/usePosts';
import { mediaApi, userApi, getBaseUrl } from '../api/client';
import whisperIcon from '../assets/whisper-icon.png';

function PostForm({ onSuccess }) {
  const [textContent, setTextContent] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);
  const [audioUrls, setAudioUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(1);
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [whisperMode, setWhisperMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const dragCounterRef = useRef(0);

  const createPost = useCreatePost();

  // Get user ID on mount
  useState(() => {
    userApi.getProfile().then(res => setUserId(res.data.id)).catch(() => {});
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => mediaApi.uploadMedia(file));
      const results = await Promise.all(uploadPromises);
      const newFiles = results.map(res => res.data);
      setUploadedImages(prev => [...prev, ...newFiles]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = async (e) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // Collect image files from both items and files
    const imageFiles = [];

    // Check clipboardData.items (for screenshots and copied images from web)
    if (clipboardData.items) {
      const imageItems = Array.from(clipboardData.items).filter(item =>
        item.type.startsWith('image/')
      );
      imageItems.forEach(item => {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      });
    }

    // Check clipboardData.files (for files copied from file manager)
    if (clipboardData.files && clipboardData.files.length > 0) {
      const files = Array.from(clipboardData.files).filter(file =>
        file.type.startsWith('image/')
      );
      files.forEach(file => {
        // Avoid duplicates
        if (!imageFiles.some(f => f.name === file.name && f.size === file.size)) {
          imageFiles.push(file);
        }
      });
    }

    if (imageFiles.length === 0) return;

    e.preventDefault();
    setUploading(true);

    try {
      const uploadPromises = imageFiles.map(file => mediaApi.uploadMedia(file));
      const results = await Promise.all(uploadPromises);
      const validResults = results.map(res => res.data);
      setUploadedImages(prev => [...prev, ...validResults]);
    } catch (error) {
      console.error('Paste upload error:', error);
      alert('Failed to upload pasted image');
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => mediaApi.uploadMedia(file));
      const results = await Promise.all(uploadPromises);
      const newFiles = results.map(res => res.data);
      setUploadedImages(prev => [...prev, ...newFiles]);
    } catch (error) {
      console.error('Drop upload error:', error);
      alert('Failed to upload dropped images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addVideoUrl = () => {
    const url = prompt('Enter video URL (YouTube, Bilibili, or direct link):');
    if (url && url.trim()) {
      setVideoUrls(prev => [...prev, url.trim()]);
    }
  };

  const removeVideoUrl = (index) => {
    setVideoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addAudioUrl = () => {
    const url = prompt('Enter audio URL (YouTube, Spotify, SoundCloud, NetEase Music, or direct link):');
    if (url && url.trim()) {
      setAudioUrls(prev => [...prev, url.trim()]);
    }
  };

  const removeAudioUrl = (index) => {
    setAudioUrls(prev => prev.filter((_, i) => i !== index));
  };

  const detectMusicPlatform = (url) => {
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('music.163.com')) return 'netease';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i)) return 'audio_url';
    return 'audio_url';
  };

  const detectVideoType = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('bilibili.com') || url.includes('b23.tv')) return 'bilibili';
    if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogv)(\?|$)/i)) return 'video_file';
    return 'video_url';
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Your browser does not support geolocation');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        setLocation({
          latitude,
          longitude,
          accuracy
        });

        setGettingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        let message = 'Unable to get location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }

        alert(message);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Determine content type
    const hasImages = uploadedImages.length > 0;
    const hasVideos = videoUrls.length > 0;
    const hasAudio = audioUrls.length > 0;
    const hasText = textContent.trim().length > 0;

    let contentType = 'text';
    const metadata = {};
    const mediaItems = [];

    // If we have multiple types, use 'mixed'
    const typeCount = [hasText, hasImages, hasVideos, hasAudio].filter(Boolean).length;
    if (typeCount > 1 || (hasImages && uploadedImages.length > 1) || hasVideos || hasAudio) {
      contentType = 'mixed';

      // Store content order in metadata
      const contentOrder = [];
      if (hasText) contentOrder.push('text');
      if (hasImages) contentOrder.push('images');
      if (hasVideos) contentOrder.push('videos');
      if (hasAudio) contentOrder.push('audio');

      metadata.content_order = contentOrder;

      // Add video URLs to metadata
      if (hasVideos) {
        metadata.video_urls = videoUrls.map(url => ({
          url,
          type: detectVideoType(url)
        }));
      }

      // Add audio URLs to metadata
      if (hasAudio) {
        metadata.audio_urls = audioUrls.map(url => ({
          url,
          platform: detectMusicPlatform(url)
        }));
      }
    } else if (hasImages && uploadedImages.length === 1) {
      contentType = 'image';
    }

    // Add uploaded images as media items
    uploadedImages.forEach(img => {
      mediaItems.push({
        media_type: 'image',
        file_url: img.file_url,
        is_external: false,
        thumbnail_url: img.thumbnail_url,
        file_size: img.file_size,
        mime_type: img.mime_type
      });
    });

    const postData = {
      user_id: userId,
      content_type: contentType,
      text_content: textContent.trim() || null,
      metadata,
      media_items: mediaItems,
      location: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      } : null,
      whisper_mode: whisperMode
    };

    try {
      await createPost.mutateAsync(postData);

      // Reset form
      setTextContent('');
      setUploadedImages([]);
      setVideoUrls([]);
      setAudioUrls([]);
      setLocation(null);
      setWhisperMode(false);
      onSuccess?.();
    } catch (error) {
      console.error('Post creation error:', error);
      alert('Failed to create post');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`space-y-4 relative ${isDragging ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-semibold text-blue-600">Drop images here to upload</p>
          </div>
        </div>
      )}

      {/* Text Content */}
      <textarea
        ref={textareaRef}
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        onPaste={handlePaste}
        placeholder="What's on your mind? (You can paste images here)"
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        rows={4}
      />

      {/* Action Buttons */}
      <div className="flex gap-2 items-center">
        <label
          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors border border-blue-200"
          title="Add Images"
        >
          <input
            type="file"
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            className="hidden"
          />
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </label>

        <button
          type="button"
          onClick={addVideoUrl}
          className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
          title="Add Video Link"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={addAudioUrl}
          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
          title="Add Audio Link"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </button>

        <button
          type="button"
          onClick={getLocation}
          disabled={gettingLocation}
          className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200 disabled:opacity-50"
          title="Add Location"
        >
          {gettingLocation ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>

        <div className="flex-grow" />

        {/* Whisper Mode Toggle */}
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all border bg-gray-50 border-gray-200 hover:border-gray-300 cursor-pointer">
          <img
            src={whisperIcon}
            alt="Whisper"
            className="w-4 h-4 opacity-70"
          />
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Shhh</span>
          <input
            type="checkbox"
            checked={whisperMode}
            onChange={(e) => setWhisperMode(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-9 h-5 rounded-full relative transition-colors ${whisperMode ? 'bg-primary' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${whisperMode ? 'transform translate-x-4' : ''}`} />
          </div>
        </label>
      </div>

      {/* Uploading Indicator */}
      {uploading && (
        <div className="text-sm text-blue-600 font-medium">
          Uploading...
        </div>
      )}

      {/* Location Display */}
      {location && (
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div className="flex-grow">
              <div className="font-medium text-gray-900">Location added</div>
              <div className="text-sm text-gray-600">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Accuracy: {location.accuracy.toFixed(0)}m
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLocation(null)}
              className="text-gray-400 hover:text-red-500 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Preview: Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Images:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {uploadedImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={`${getBaseUrl()}${img.file_url}`}
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview: Video URLs */}
      {videoUrls.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Videos:</div>
          <div className="space-y-2">
            {videoUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                <span className="flex-grow text-sm text-gray-700 truncate">{url}</span>
                <button
                  type="button"
                  onClick={() => removeVideoUrl(idx)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview: Audio URLs */}
      {audioUrls.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Audio:</div>
          <div className="space-y-2">
            {audioUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                <span className="flex-grow text-sm text-gray-700 truncate">{url}</span>
                <button
                  type="button"
                  onClick={() => removeAudioUrl(idx)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={createPost.isPending || uploading || (
          !textContent.trim() && uploadedImages.length === 0 &&
          videoUrls.length === 0 && audioUrls.length === 0
        )}
        className="w-full py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {createPost.isPending ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}

export default PostForm;
