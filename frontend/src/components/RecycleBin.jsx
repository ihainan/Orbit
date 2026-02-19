import { useState, useEffect } from 'react';
import { postsApi, getBaseUrl } from '../api/client';

function RecycleBin({ onClose }) {
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadDeletedPosts();
  }, [currentPage]);

  const loadDeletedPosts = async () => {
    try {
      setLoading(true);
      const response = await postsApi.getDeletedPosts(currentPage, 20);
      setDeletedPosts(response.data.posts);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Failed to load deleted posts:', err);
      setError('Failed to load deleted posts');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (postId) => {
    if (!window.confirm('Are you sure you want to restore this post?')) {
      return;
    }

    try {
      await postsApi.restorePost(postId);
      // Reload the list after restoration
      loadDeletedPosts();
    } catch (err) {
      console.error('Failed to restore post:', err);
      alert('Failed to restore post');
    }
  };

  const handlePermanentDelete = async (postId) => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete this post!\n\nThis action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    try {
      await postsApi.permanentlyDeletePost(postId);
      // Reload the list after deletion
      loadDeletedPosts();
    } catch (err) {
      console.error('Failed to permanently delete post:', err);
      alert('Failed to permanently delete post');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const getContentPreview = (post) => {
    if (post.repost_comment) {
      return post.repost_comment;
    }
    if (post.text_content) {
      return post.text_content;
    }
    if (post.media && post.media.length > 0) {
      return `[${post.media.length} media file(s)]`;
    }
    return '[No content]';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <h2 className="text-xl font-bold">Recycle Bin</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : deletedPosts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-lg">Recycle bin is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedPosts.map((post) => {
                const avatarUrl = post.avatar?.avatar_url
                  ? `${getBaseUrl()}${post.avatar.avatar_url}`
                  : null;

                return (
                  <div
                    key={post.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-4">
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            {formatDate(post.created_at)}
                          </span>
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            Deleted {formatDate(post.deleted_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                          {getContentPreview(post)}
                        </p>

                        {/* Media preview */}
                        {post.media && post.media.length > 0 && (
                          <div className="flex gap-1 mb-2">
                            {post.media.slice(0, 4).map((media) => (
                              <img
                                key={media.id}
                                src={`${getBaseUrl()}${media.file_url}`}
                                alt=""
                                className="w-12 h-12 object-cover rounded"
                              />
                            ))}
                            {post.media.length > 4 && (
                              <div className="w-12 h-12 bg-gray-300 flex items-center justify-center text-xs text-gray-600 font-semibold rounded">
                                +{post.media.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleRestore(post.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          title="Restore post"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(post.id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                          title="Permanently delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="border-t border-gray-200 p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: {pagination.total} deleted post{pagination.total !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {pagination.page}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!pagination.hasMore}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecycleBin;
