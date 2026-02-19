import { useState, useRef, useEffect } from 'react';
import { useUpdatePost } from '../hooks/usePosts';
import { mediaApi, getBaseUrl } from '../api/client';
import whisperIcon from '../assets/whisper-icon.png';

function PostEditForm({ post, onSuccess, onCancel }) {
  // For reposts, use repost_comment; for regular posts, use text_content
  const initialText = post.reposted_post ? (post.repost_comment || '') : (post.text_content || '');
  const [textContent, setTextContent] = useState(initialText);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);
  const [audioUrls, setAudioUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [whisperMode, setWhisperMode] = useState(post.whisper_mode || false);
  const textareaRef = useRef(null);

  const updatePost = useUpdatePost();

  // Initialize form with existing post data
  useEffect(() => {
    // Don't load media for reposts - they only have comments
    if (post.reposted_post) {
      return;
    }

    // Load existing images
    if (post.media && post.media.length > 0) {
      setUploadedImages(post.media);
    }

    // Load existing video URLs
    if (post.metadata?.video_urls) {
      setVideoUrls(post.metadata.video_urls.map(v => v.url));
    }

    // Load existing audio URLs
    if (post.metadata?.audio_urls) {
      setAudioUrls(post.metadata.audio_urls.map(a => a.url));
    }

    // Handle legacy content types
    if (post.content_type === 'youtube' && post.metadata?.youtube_url) {
      setVideoUrls([post.metadata.youtube_url]);
    }
    if (post.content_type === 'music' && post.metadata?.music_url) {
      setAudioUrls([post.metadata.music_url]);
    }
  }, [post]);

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
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItems = Array.from(items).filter(item =>
      item.type.startsWith('image/')
    );

    if (imageItems.length === 0) return;

    e.preventDefault();
    setUploading(true);

    try {
      const uploadPromises = imageItems.map(async (item) => {
        const file = item.getAsFile();
        if (!file) return null;
        const result = await mediaApi.uploadMedia(file);
        return result.data;
      });

      const results = await Promise.all(uploadPromises);
      const validResults = results.filter(r => r !== null);
      setUploadedImages(prev => [...prev, ...validResults]);
    } catch (error) {
      console.error('Paste upload error:', error);
      alert('Failed to upload pasted image');
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

    const updateData = {
      content_type: contentType,
      text_content: textContent.trim() || null,
      metadata,
      media_items: mediaItems,
      whisper_mode: whisperMode
    };

    try {
      await updatePost.mutateAsync({ id: post.id, data: updateData });
      onSuccess?.();
    } catch (error) {
      console.error('Post update error:', error);
      alert('Failed to update post');
    }
  };

  const isRepost = !!post.reposted_post;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Text Content */}
      <textarea
        ref={textareaRef}
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        onPaste={isRepost ? undefined : handlePaste}
        placeholder={isRepost ? "Edit your repost comment..." : "What's on your mind? (You can paste images here)"}
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        rows={4}
      />

      {/* Action Buttons - only show for non-repost posts */}
      {!isRepost && (
        <div className="flex gap-2">
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
      )}

      {/* Whisper Mode Toggle for reposts */}
      {isRepost && (
        <div className="flex gap-2">
          <div className="flex-grow" />

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
      )}

      {/* Uploading Indicator */}
      {!isRepost && uploading && (
        <div className="text-sm text-blue-600 font-medium">
          Uploading...
        </div>
      )}

      {/* Preview: Images */}
      {!isRepost && uploadedImages.length > 0 && (
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
      {!isRepost && videoUrls.length > 0 && (
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
      {!isRepost && audioUrls.length > 0 && (
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

      {/* Submit Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={updatePost.isPending || uploading || (
            !isRepost && (
              !textContent.trim() && uploadedImages.length === 0 &&
              videoUrls.length === 0 && audioUrls.length === 0
            )
          )}
          className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updatePost.isPending ? 'Updating...' : isRepost ? 'Update Comment' : 'Update Post'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default PostEditForm;
