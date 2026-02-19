import { useState, useEffect, useRef } from 'react';

function YouTubeMusicPlayer({ videoId, title }) {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(100);
  const [videoTitle, setVideoTitle] = useState(title || 'YouTube Audio');
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const userActionRef = useRef(false); // Track if user just clicked play/pause

  // Fetch video title from YouTube oEmbed API
  useEffect(() => {
    const fetchVideoTitle = async () => {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (response.ok) {
          const data = await response.json();
          setVideoTitle(data.title || title || 'YouTube Audio');
        }
      } catch (error) {
        console.error('Failed to fetch video title:', error);
        setVideoTitle(title || 'YouTube Audio');
      }
    };

    fetchVideoTitle();
  }, [videoId, title]);

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    // Initialize callback queue if it doesn't exist
    if (!window.youtubeAPICallbacks) {
      window.youtubeAPICallbacks = [];
    }

    // Add this player's init function to the queue
    window.youtubeAPICallbacks.push(initPlayer);

    // Load the API if not already loading or loaded
    if (!window.youtubeAPILoading && !window.YT) {
      window.youtubeAPILoading = true;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        // Call all queued init functions
        if (window.youtubeAPICallbacks) {
          window.youtubeAPICallbacks.forEach(callback => callback());
          window.youtubeAPICallbacks = [];
        }
      };
    }
  }, [videoId]);

  const initPlayer = () => {
    if (!playerRef.current || !window.YT) return;

    const newPlayer = new window.YT.Player(playerRef.current, {
      height: '0',
      width: '0',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: (event) => {
          const playerInstance = event.target;
          setPlayer(playerInstance);
          // Get duration after player is ready
          const videoDuration = playerInstance.getDuration();
          setDuration(videoDuration);
        },
        onStateChange: (event) => {
          // Don't override UI state if user just clicked (within 500ms)
          if (userActionRef.current) {
            return;
          }

          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            startProgressTracking(event.target);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            stopProgressTracking();
          }
        },
      },
    });
  };

  const startProgressTracking = (playerInstance) => {
    if (intervalRef.current) return;
    const targetPlayer = playerInstance || player;
    if (!targetPlayer) return;

    intervalRef.current = setInterval(() => {
      if (targetPlayer && targetPlayer.getCurrentTime) {
        const time = targetPlayer.getCurrentTime();
        setCurrentTime(time);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (player && player.destroy) {
        player.destroy();
      }
    };
  }, [player]);

  const togglePlayPause = () => {
    if (!player) return;

    // Set flag to prevent state change event from overriding UI
    userActionRef.current = true;

    // Immediately toggle UI state for better responsiveness
    if (isPlaying) {
      setIsPlaying(false);
      player.pauseVideo();
    } else {
      setIsPlaying(true);
      player.playVideo();
      // Start tracking immediately when user clicks play
      if (!intervalRef.current) {
        startProgressTracking(player);
      }
    }

    // Clear flag after a short delay to allow API events again
    setTimeout(() => {
      userActionRef.current = false;
    }, 500);
  };

  const handleSeek = (e) => {
    if (!player) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    player.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    if (!player) return;
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    player.setVolume(newVolume);

    // Unmute if volume is increased from 0
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      player.unMute();
    }
    // Mute if volume is set to 0
    if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
      player.mute();
    }
  };

  const toggleMute = () => {
    if (!player) return;

    if (isMuted) {
      // Unmute: restore previous volume
      setIsMuted(false);
      player.unMute();
      const restoreVolume = previousVolume > 0 ? previousVolume : 50;
      setVolume(restoreVolume);
      player.setVolume(restoreVolume);
    } else {
      // Mute: save current volume and set to 0
      setIsMuted(true);
      player.mute();
      setPreviousVolume(volume);
      setVolume(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getThumbnail = () => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef} className="bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 rounded-xl shadow-md border border-red-100/50 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-red-200/70">
      {/* Hidden YouTube Player */}
      <div ref={playerRef} style={{ display: 'none' }} />

      <div className="flex items-center gap-4 p-4">
        {/* Thumbnail */}
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 shadow-md ring-2 ring-white/50 hover:ring-red-300 transition-all cursor-pointer group/thumbnail"
          title="Open in YouTube"
        >
          <img
            src={getThumbnail()}
            alt="Thumbnail"
            className="w-full h-full object-cover transition-transform group-hover/thumbnail:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover/thumbnail:from-black/40 transition-all" />
          {/* Play icon overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumbnail:opacity-100 transition-opacity">
            <div className="w-10 h-10 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
          {/* YouTube logo overlay */}
          <div className="absolute bottom-1 right-1 bg-red-600 rounded px-1 py-0.5 shadow-sm">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
        </a>

        {/* Player Controls & Info */}
        <div className="flex-grow min-w-0">
          {/* Title */}
          <div className="text-sm font-semibold text-gray-800 truncate mb-2 hover:text-red-700 transition-colors">
            {videoTitle}
          </div>

          {/* Progress Bar */}
          <div
            className="w-full h-2 bg-red-100/60 rounded-full cursor-pointer mb-3 group relative shadow-inner"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all group-hover:from-red-600 group-hover:to-red-700 shadow-sm"
              style={{ width: `${Math.max(progress, 0)}%` }}
            />
            {/* Progress indicator dot */}
            {progress > 0 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md ring-2 ring-red-500"
                style={{ left: `${Math.max(progress, 0)}%`, transform: 'translate(-50%, -50%)' }}
              />
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!player}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ marginLeft: '1px' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Time Display */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-red-700 font-mono tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <span className="text-xs text-gray-400">/</span>
                <span className="text-xs text-gray-500 font-mono tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="relative flex items-center gap-1">
              <div className="relative group/volume">
                <button
                  onClick={toggleMute}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : volume < 50 ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 8.929a1 1 0 011.414 0A4.978 4.978 0 0117 12a4.978 4.978 0 01-.929 2.929 1 1 0 11-1.414-1.414A2.987 2.987 0 0015 12c0-.551-.102-1.082-.293-1.571a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Volume slider - shows on hover of button only */}
                <div className="absolute right-0 bottom-full mb-3 bg-white rounded-xl shadow-xl p-3 border border-red-100 opacity-0 invisible group-hover/volume:opacity-100 group-hover/volume:visible transition-all duration-200 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs font-semibold text-gray-600 tabular-nums">{volume}%</div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${volume}%, #fee2e2 ${volume}%, #fee2e2 100%)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default YouTubeMusicPlayer;
