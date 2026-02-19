import { useState, useEffect } from 'react';
import { useDeletePost, useRepostPost } from '../hooks/usePosts';
import { getBaseUrl } from '../api/client';
import PostEditForm from './PostEditForm';
import RepostDialog from './RepostDialog';
import YouTubeMusicPlayer from './YouTubeMusicPlayer';
import whisperIcon from '../assets/whisper-icon.png';

function PostCard({ post }) {
  const deletePost = useDeletePost();
  const repostPost = useRepostPost();
  const [isEditing, setIsEditing] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [imageModal, setImageModal] = useState(null);

  // Keyboard event handler for image modal
  useEffect(() => {
    if (imageModal === null || !post.media) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setImageModal(null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setImageModal((prev) => (prev > 0 ? prev - 1 : post.media.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setImageModal((prev) => (prev < post.media.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageModal, post.media]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost.mutateAsync(post.id);
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete post');
      }
    }
  };

  const handleRepost = async (repostComment) => {
    try {
      // Repost the current post (whether it's original or already a repost)
      await repostPost.mutateAsync({
        postId: post.id,
        userId: 1, // Hardcoded user_id for single-user app
        repostComment
      });
      setIsReposting(false);
    } catch (error) {
      console.error('Repost error:', error);
      alert(error.response?.data?.error || 'Failed to repost');
    }
  };

  const handleClickOriginalPost = () => {
    if (!post.reposted_post) return;

    // Try to find and scroll to the original post
    const originalPostElement = document.getElementById(`post-${post.reposted_post.id}`);
    if (originalPostElement) {
      originalPostElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      originalPostElement.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50');
      setTimeout(() => {
        originalPostElement.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50');
      }, 2000);
    }
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeThumbnail = (url) => {
    const videoId = extractYouTubeId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  const extractBilibiliId = (url) => {
    // Support formats:
    // https://www.bilibili.com/video/BV1xx411c7XZ
    // https://www.bilibili.com/video/av123456
    // https://b23.tv/xxxxx (short link)
    const bvMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
    const avMatch = url.match(/bilibili\.com\/video\/av(\d+)/);

    if (bvMatch) {
      return { type: 'bvid', id: bvMatch[1] };
    } else if (avMatch) {
      return { type: 'aid', id: avMatch[1] };
    }
    return null;
  };

  const getBilibiliThumbnail = (url) => {
    // Bilibili doesn't provide a direct thumbnail URL pattern like YouTube
    // We'll return null and use a placeholder icon instead
    return null;
  };

  const renderMusicPlayer = (url, platform) => {
    switch (platform) {
      case 'spotify':
        const spotifyMatch = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if (spotifyMatch) {
          const [, type, id] = spotifyMatch;
          return (
            <div className="rounded-lg overflow-hidden shadow-sm">
              <iframe
                src={`https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`}
                width="100%"
                height="120"
                frameBorder="0"
                allow="encrypted-media"
                className="rounded-lg"
              />
            </div>
          );
        }
        break;

      case 'soundcloud':
        return (
          <div className="rounded-lg overflow-hidden shadow-sm">
            <iframe
              width="100%"
              height="140"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`}
              className="rounded-lg"
            />
          </div>
        );

      case 'netease':
        const neteaseMatch = url.match(/id=(\d+)/);
        if (neteaseMatch) {
          const songId = neteaseMatch[1];
          return (
            <div className="rounded-lg overflow-hidden shadow-sm">
              <iframe
                src={`https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`}
                width="100%"
                height="80"
                frameBorder="0"
                className="rounded-lg"
              />
            </div>
          );
        }
        break;

      case 'youtube':
        const videoId = extractYouTubeId(url);
        if (videoId) {
          return <YouTubeMusicPlayer videoId={videoId} title={url} />;
        }
        break;

      case 'audio_url':
        return (
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 shadow-sm border border-slate-200">
            <audio
              src={url}
              controls
              className="w-full h-8"
              preload="metadata"
            />
          </div>
        );

      default:
        return null;
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 border-2 border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium truncate flex-grow">
            {url}
          </span>
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </a>
    );
  };

  const renderImageGallery = (images) => {
    const apiBaseUrl = getBaseUrl();
    const imageCount = images.length;

    if (imageCount === 0) return null;

    // Single image - large display
    if (imageCount === 1) {
      return (
        <div
          className="relative rounded-xl overflow-hidden shadow-md cursor-pointer group"
          onClick={() => setImageModal(0)}
        >
          <img
            src={`${apiBaseUrl}${images[0].file_url}`}
            alt=""
            className="w-full object-contain bg-gray-50"
            style={{ maxHeight: '400px' }}
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
        </div>
      );
    }

    // Two images - side by side
    if (imageCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="relative cursor-pointer group overflow-hidden"
              style={{ height: '200px' }}
              onClick={() => setImageModal(idx)}
            >
              <img
                src={`${apiBaseUrl}${img.file_url}`}
                alt=""
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
            </div>
          ))}
        </div>
      );
    }

    // Three images - special layout
    if (imageCount === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
          <div
            className="col-span-2 relative cursor-pointer group overflow-hidden"
            onClick={() => setImageModal(0)}
            style={{ height: '240px' }}
          >
            <img
              src={`${apiBaseUrl}${images[0].file_url}`}
              alt=""
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
          </div>
          {images.slice(1).map((img, idx) => (
            <div
              key={img.id}
              className="relative cursor-pointer group overflow-hidden"
              style={{ height: '160px' }}
              onClick={() => setImageModal(idx + 1)}
            >
              <img
                src={`${apiBaseUrl}${img.file_url}`}
                alt=""
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
            </div>
          ))}
        </div>
      );
    }

    // Four or more images - grid layout
    return (
      <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
        {images.slice(0, 4).map((img, idx) => (
          <div
            key={img.id}
            className="relative cursor-pointer group overflow-hidden"
            style={{ height: '160px' }}
            onClick={() => setImageModal(idx)}
          >
            <img
              src={`${apiBaseUrl}${img.file_url}`}
              alt=""
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            {idx === 3 && imageCount > 4 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{imageCount - 4}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
          </div>
        ))}
      </div>
    );
  };

  const renderVideoCard = (video, idx) => {
    const isYouTube = video.type === 'youtube';
    const isBilibili = video.type === 'bilibili';
    const isVideoFile = video.type === 'video_file';

    // Direct video file: render with the native HTML5 video element
    if (isVideoFile) {
      return (
        <div key={idx} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg overflow-hidden shadow-sm border border-slate-200">
          <video
            src={video.url}
            controls
            className="w-full rounded-lg"
            preload="metadata"
            style={{ maxHeight: '500px' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // YouTube: render the embedded player
    if (isYouTube) {
      const videoId = extractYouTubeId(video.url);
      if (videoId) {
        return (
          <div key={idx} className="rounded-lg overflow-hidden shadow-sm border-2 border-blue-200">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        );
      }
    }

    // Bilibili: render the embedded player
    if (isBilibili) {
      const bilibiliId = extractBilibiliId(video.url);
      if (bilibiliId) {
        const embedUrl = bilibiliId.type === 'bvid'
          ? `https://player.bilibili.com/player.html?bvid=${bilibiliId.id}&high_quality=1&autoplay=false`
          : `https://player.bilibili.com/player.html?aid=${bilibiliId.id}&high_quality=1&autoplay=false`;

        return (
          <div key={idx} className="rounded-lg overflow-hidden shadow-sm border-2 border-pink-200">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={embedUrl}
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        );
      }
    }

    // Fallback: show as a link card
    const thumbnail = isYouTube ? getYouTubeThumbnail(video.url) : null;
    const borderColor = isBilibili ? 'border-pink-200' : 'border-blue-200';
    const hoverBorderColor = isBilibili ? 'hover:border-pink-400' : 'hover:border-blue-400';
    const bgColor = isBilibili ? 'bg-pink-100' : 'bg-blue-100';
    const hoverBgColor = isBilibili ? 'group-hover:bg-pink-200' : 'group-hover:bg-blue-200';
    const textColor = isBilibili ? 'text-pink-700 group-hover:text-pink-900' : 'text-blue-700 group-hover:text-blue-900';
    const iconColor = isBilibili ? 'text-pink-600' : 'text-blue-600';
    const playBgColor = isBilibili ? 'bg-pink-600' : 'bg-blue-600';
    const arrowColor = isBilibili ? 'text-pink-400' : 'text-blue-400';

    return (
      <a
        key={idx}
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block border-2 ${borderColor} rounded-lg sm:rounded-xl ${hoverBorderColor} hover:shadow-md transition-all duration-200 overflow-hidden group`}
      >
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
          {thumbnail ? (
            <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 rounded-md sm:rounded-lg overflow-hidden">
              <img
                src={thumbnail}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${playBgColor} rounded-full flex items-center justify-center`}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5 sm:ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0 ${hoverBgColor} transition-colors`}>
              <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
          )}
          <div className="flex-grow min-w-0">
            <div className={`text-xs sm:text-sm font-medium ${textColor} truncate`}>
              {isYouTube ? 'YouTube Video' : isBilibili ? 'Bilibili Video' : 'Video Link'}
            </div>
            <div className="text-xs text-gray-500 truncate mt-0.5 hidden sm:block">{video.url}</div>
          </div>
          <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${arrowColor} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </a>
    );
  };

  const renderMixedContent = () => {
    const apiBaseUrl = getBaseUrl();
    const contentOrder = post.metadata?.content_order || ['text', 'images', 'videos', 'audio'];

    return (
      <div className="space-y-4">
        {contentOrder.map((contentType, index) => {
          switch (contentType) {
            case 'text':
              return post.text_content ? (
                <p key={`text-${index}`} className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {post.text_content}
                </p>
              ) : null;

            case 'images':
              if (!post.media || post.media.length === 0) return null;
              return (
                <div key={`images-${index}`}>
                  {renderImageGallery(post.media)}
                </div>
              );

            case 'videos':
              const videoUrls = post.metadata?.video_urls || [];
              if (videoUrls.length === 0) return null;

              return (
                <div key={`videos-${index}`} className="space-y-2">
                  {videoUrls.map((video, vIdx) => renderVideoCard(video, vIdx))}
                </div>
              );

            case 'audio':
              const audioUrls = post.metadata?.audio_urls || [];
              if (audioUrls.length === 0) return null;

              return (
                <div key={`audio-${index}`} className="space-y-3">
                  {audioUrls.map((audio, aIdx) => (
                    <div key={aIdx}>
                      {renderMusicPlayer(audio.url, audio.platform)}
                    </div>
                  ))}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    );
  };

  const renderLegacyContent = () => {
    const apiBaseUrl = getBaseUrl();

    switch (post.content_type) {
      case 'image':
        return post.media && renderImageGallery(post.media);

      case 'video':
        return post.media?.[0] && (
          <div className="rounded-xl overflow-hidden shadow-md">
            <video
              src={`${apiBaseUrl}${post.media[0].file_url}`}
              controls
              className="w-full"
              style={{ maxHeight: '500px' }}
            />
          </div>
        );

      case 'audio':
        return post.media?.[0] && (
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 shadow-sm border border-slate-200">
            <audio
              src={`${apiBaseUrl}${post.media[0].file_url}`}
              controls
              className="w-full h-8"
            />
          </div>
        );

      case 'youtube':
        if (post.metadata?.youtube_url) {
          return renderVideoCard({ url: post.metadata.youtube_url, type: 'youtube' }, 0);
        }
        return null;

      case 'music':
        return post.metadata?.music_url && (
          <div>
            {renderMusicPlayer(post.metadata.music_url, post.metadata.music_platform)}
          </div>
        );

      case 'link':
        return post.metadata?.external_url && (
          <a
            href={post.metadata.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border-2 border-cyan-200 rounded-xl hover:border-cyan-400 hover:bg-cyan-50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-sm text-cyan-700 group-hover:text-cyan-900 font-medium truncate flex-grow">
                {post.metadata.external_url}
              </span>
              <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>
        );

      case 'text':
      default:
        return null;
    }
  };

  const avatarUrl = post.avatar?.avatar_url
    ? `${getBaseUrl()}${post.avatar.avatar_url}`
    : null;

  // Image modal
  const ImageModal = () => {
    if (imageModal === null || !post.media) return null;

    const apiBaseUrl = getBaseUrl();

    const handlePrevImage = () => {
      setImageModal((prev) => (prev > 0 ? prev - 1 : post.media.length - 1));
    };

    const handleNextImage = () => {
      setImageModal((prev) => (prev < post.media.length - 1 ? prev + 1 : 0));
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
        onClick={() => setImageModal(null)}
      >
        <button
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          onClick={() => setImageModal(null)}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Previous button */}
        {post.media.length > 1 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <img
          src={`${apiBaseUrl}${post.media[imageModal].file_url}`}
          alt=""
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Next button */}
        {post.media.length > 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Image counter */}
        {post.media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
            {imageModal + 1} / {post.media.length}
          </div>
        )}
      </div>
    );
  };

  // If editing, show edit form in modal
  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-800">Edit Post</h2>
          </div>
          <div className="p-6">
            <PostEditForm
              post={post}
              onSuccess={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id={`post-${post.id}`} className="group bg-white rounded-2xl sm:rounded-2xl rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden mb-3 sm:mb-4 border border-gray-100/50">
        <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-gray-100 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 ring-2 ring-gray-100 shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            {/* Header with time and actions */}
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 sm:py-1 rounded-md">
                  {formatDate(post.created_at)}
                </span>
                {/* Whisper mode indicator */}
                {post.whisper_mode && (
                  <span className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" title="Whisper Mode">
                    <img src={whisperIcon} alt="Whisper" className="w-3.5 h-3.5 opacity-50" />
                  </span>
                )}
                {/* Location display */}
                {(post.location_city || post.location_address) && (
                  <a
                    href={post.location_latitude && post.location_longitude
                      ? `https://uri.amap.com/marker?position=${post.location_longitude},${post.location_latitude}&name=${encodeURIComponent(post.location_address || 'Location')}&src=yang_timeline&coordinate=gaode`
                      : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1 hover:bg-orange-100 hover:text-orange-700 transition-colors cursor-pointer"
                    title={post.location_address ? `${post.location_address}\nClick to open in AMap` : 'Click to open in map'}
                    onClick={(e) => {
                      if (!post.location_latitude || !post.location_longitude) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {post.location_district
                      ? `${post.location_district}${post.location_city && post.location_city !== post.location_province ? '' : ''}`
                      : post.location_city || 'Location'}
                  </a>
                )}
              </div>
              <div className="flex gap-0.5 sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => setIsReposting(true)}
                  className="p-1 sm:p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                  title="Repost"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 sm:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Edit post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Delete post"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Render content based on type */}
            {post.reposted_post ? (
              // This is a repost - show repost comment and original post
              <>
                {post.repost_comment && (
                  <p className="text-gray-800 text-sm sm:text-base whitespace-pre-wrap leading-relaxed mb-3">{post.repost_comment}</p>
                )}
                <div
                  onClick={handleClickOriginalPost}
                  className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:bg-gray-100 hover:border-blue-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="font-medium">Reposted from {formatDate(post.reposted_post.created_at)}</span>
                    <span className="ml-auto text-blue-500 text-xs">Click to view original</span>
                  </div>
                  <div className="flex items-start gap-3">
                    {/* Original post avatar */}
                    <div className="flex-shrink-0">
                      {post.reposted_post.avatar?.avatar_url ? (
                        <img
                          src={`${getBaseUrl()}${post.reposted_post.avatar.avatar_url}`}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 ring-2 ring-gray-200">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Original post content */}
                    <div className="flex-grow min-w-0">
                      {/* If the reposted post is itself a repost, show its repost comment; otherwise show text content */}
                      {post.reposted_post.reposted_from_id ? (
                        // The reposted post is a repost
                        post.reposted_post.repost_comment ? (
                          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed mb-2">
                            {post.reposted_post.repost_comment}
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm italic mb-2">
                            Reposted without comment
                          </p>
                        )
                      ) : (
                        // The reposted post is an original post
                        <>
                          {post.reposted_post.text_content && (
                            <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed mb-2">
                              {post.reposted_post.text_content}
                            </p>
                          )}
                          {/* Original post media preview */}
                          {post.reposted_post.media && post.reposted_post.media.length > 0 && (
                            <div className="mt-2">
                              <div className="flex gap-1 overflow-hidden rounded-lg">
                                {post.reposted_post.media.slice(0, 3).map((media) => (
                                  <img
                                    key={media.id}
                                    src={`${getBaseUrl()}${media.file_url}`}
                                    alt=""
                                    className="w-20 h-20 object-cover"
                                  />
                                ))}
                                {post.reposted_post.media.length > 3 && (
                                  <div className="w-20 h-20 bg-gray-300 flex items-center justify-center text-xs text-gray-600 font-semibold">
                                    +{post.reposted_post.media.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : post.content_type === 'mixed' ? (
              renderMixedContent()
            ) : (
              <>
                {post.text_content && (
                  <p className="text-gray-800 text-sm sm:text-base whitespace-pre-wrap leading-relaxed mb-3">{post.text_content}</p>
                )}
                {renderLegacyContent()}
              </>
            )}
          </div>
        </div>
      </div>
      <ImageModal />
      {isReposting && (
        <RepostDialog
          post={post}
          onRepost={handleRepost}
          onCancel={() => setIsReposting(false)}
        />
      )}
    </>
  );
}

export default PostCard;
