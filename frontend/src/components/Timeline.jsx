import { useState, useEffect } from 'react';
import { usePosts, useSearchPosts } from '../hooks/usePosts';
import PostCard from './PostCard';
import Pagination from './Pagination';

function Timeline({ searchQuery, viewMode }) {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: postsData, isLoading: postsLoading, isError: postsError } = usePosts(currentPage, 10, viewMode);
  const { data: searchData, isLoading: searchLoading, isError: searchError } = useSearchPosts(searchQuery, currentPage, 10, viewMode);

  // Use search results if there's a query, otherwise use regular posts
  const isSearching = searchQuery && searchQuery.trim() !== '';
  const data = isSearching ? searchData : postsData;
  const isLoading = isSearching ? searchLoading : postsLoading;
  const isError = isSearching ? searchError : postsError;

  // Reset to first page when search query or view mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, viewMode]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load posts. Please try again later.</p>
      </div>
    );
  }

  const posts = data?.posts || [];
  const pagination = data?.pagination || {};
  const totalPages = Math.ceil(pagination.total / 10) || 1;

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          {isSearching ? `No results found for "${searchQuery}"` : 'No posts yet. Create your first post!'}
        </p>
      </div>
    );
  }

  // Group posts by month
  const getMonthKey = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthLabel = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const postsWithMonths = [];
  let lastMonth = null;

  posts.forEach((post) => {
    const monthKey = getMonthKey(post.created_at);
    if (monthKey !== lastMonth) {
      postsWithMonths.push({
        type: 'month-separator',
        key: `month-${monthKey}`,
        label: getMonthLabel(post.created_at),
      });
      lastMonth = monthKey;
    }
    postsWithMonths.push({
      type: 'post',
      key: `post-${post.id}`,
      data: post,
    });
  });

  return (
    <div>
      {/* Search indicator */}
      {isSearching && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search results for <span className="font-semibold">"{searchQuery}"</span></span>
          <span className="text-gray-400">({pagination.total} found)</span>
        </div>
      )}

      {postsWithMonths.map((item) => {
        if (item.type === 'month-separator') {
          return (
            <div key={item.key} className="mb-4 sm:mb-5 mt-6 sm:mt-8 first:mt-3 first:sm:mt-4 flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <span className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  {item.label}
                </span>
              </div>
              <div className="flex-grow h-px bg-gray-200"></div>
            </div>
          );
        }
        return <PostCard key={item.key} post={item.data} />;
      })}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default Timeline;
