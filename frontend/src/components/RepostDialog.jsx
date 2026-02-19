import { useState, useEffect } from 'react';
import { getBaseUrl } from '../api/client';

function RepostDialog({ post, onRepost, onCancel }) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [comment]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onRepost(comment.trim() || null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const avatarUrl = post.avatar?.avatar_url
    ? `${getBaseUrl()}${post.avatar.avatar_url}`
    : null;

  // Determine if this is a repost and what content to show
  const isRepost = !!post.reposted_post;
  const hasRepostComment = isRepost && post.repost_comment;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Repost</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Comment Input */}
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your thoughts... (optional)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none transition-colors"
              rows="3"
              autoFocus
            />
            <div className="mt-1 space-y-1">
              <p className="text-xs text-gray-500">
                Tip: Press Ctrl+Enter to repost quickly
              </p>
              {post.whisper_mode && (
                <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2 py-1.5 rounded-md">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>This is a private post. Your repost will also be private.</span>
                </div>
              )}
            </div>
          </div>

          {/* Original Post Preview */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 ring-2 ring-gray-200">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
                    {formatDate(post.created_at)}
                  </span>
                </div>

                {/* If this is a repost, show repost comment; otherwise show text content */}
                {isRepost ? (
                  hasRepostComment ? (
                    <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
                      {post.repost_comment}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Reposted without comment
                    </p>
                  )
                ) : (
                  <>
                    {post.text_content && (
                      <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
                        {post.text_content}
                      </p>
                    )}

                    {/* Media Preview - only for original posts */}
                    {post.media && post.media.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1 overflow-hidden rounded-lg">
                          {post.media.slice(0, 3).map((media, idx) => (
                            <img
                              key={media.id}
                              src={`${getBaseUrl()}${media.file_url}`}
                              alt=""
                              className="w-16 h-16 object-cover"
                            />
                          ))}
                          {post.media.length > 3 && (
                            <div className="w-16 h-16 bg-gray-300 flex items-center justify-center text-xs text-gray-600 font-semibold">
                              +{post.media.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Video/Music indicators - only for original posts */}
                    {post.metadata?.video_urls && post.metadata.video_urls.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        {post.metadata.video_urls.length} video(s)
                      </div>
                    )}
                    {post.metadata?.audio_urls && post.metadata.audio_urls.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                        </svg>
                        {post.metadata.audio_urls.length} audio(s)
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Reposting...' : 'Repost'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RepostDialog;
