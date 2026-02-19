import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PostForm from './PostForm';
import AvatarUpload from './AvatarUpload';
import { avatarsApi, userApi, getBaseUrl } from '../api/client';

function Header({ onSearch, currentSearch, onViewModeChange, viewMode }) {
  const navigate = useNavigate();
  const [showPostForm, setShowPostForm] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showModeSubmenu, setShowModeSubmenu] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadAvatar();
    loadUserProfile();
  }, []);

  const loadAvatar = async () => {
    try {
      const response = await avatarsApi.getCurrentAvatar();
      setCurrentAvatar(response.data);
    } catch (error) {
      console.log('No avatar set yet');
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await userApi.getProfile();
      setUserProfile(response.data);
    } catch (error) {
      console.log('Failed to load user profile');
    }
  };

  const avatarUrl = currentAvatar?.avatar_url
    ? `${getBaseUrl()}${currentAvatar.avatar_url}`
    : null;

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onSearch('');
    setShowSearch(false);
  };

  // Sync searchInput with currentSearch when currentSearch changes externally
  useEffect(() => {
    if (currentSearch !== searchInput) {
      setSearchInput(currentSearch);
    }
  }, [currentSearch]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Normal header - title and buttons */}
          {!showSearch && (
            <div className="flex items-center justify-between">
              <h1
                onClick={() => window.location.href = '/'}
                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Orbit
              </h1>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Search"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                <div className="relative">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                    title="Menu"
                    onMouseEnter={() => setShowMenu(true)}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                        style={{ imageRendering: 'auto' }}
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-visible z-50"
                      onMouseEnter={() => setShowMenu(true)}
                      onMouseLeave={() => {
                        setShowMenu(false);
                        setShowModeSubmenu(false);
                      }}
                    >
                      {/* User info header */}
                      {userProfile && (
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="font-semibold text-gray-900 text-sm">{userProfile.username}</div>
                          {userProfile.email && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate">{userProfile.email}</div>
                          )}
                        </div>
                      )}

                      {/* Menu items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowPostForm(true);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          New Post
                        </button>
                        <button
                          onClick={() => {
                            setShowAvatarModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Change Avatar
                        </button>
                        <button
                          onClick={() => {
                            navigate('/recycle-bin');
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Recycle Bin
                        </button>
                        <div className="border-t border-gray-200 my-1" />

                        {/* Mode menu item with expandable options */}
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowModeSubmenu(!showModeSubmenu);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between text-gray-700"
                          >
                            <span className="text-sm">Mode</span>
                            <svg
                              className={`w-4 h-4 transition-transform ${showModeSubmenu ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>

                          {/* Expanded mode options */}
                          {showModeSubmenu && (
                            <div className="bg-gray-50">
                              <button
                                onClick={() => {
                                  onViewModeChange('public');
                                  setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 pl-8 hover:bg-gray-100 transition-colors flex items-center justify-between text-gray-700 text-sm"
                              >
                                <span>Public Only</span>
                                {viewMode === 'public' && (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  onViewModeChange('private');
                                  setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 pl-8 hover:bg-gray-100 transition-colors flex items-center justify-between text-gray-700 text-sm"
                              >
                                <span>Private Only</span>
                                {viewMode === 'private' && (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  onViewModeChange('all');
                                  setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 pl-8 hover:bg-gray-100 transition-colors flex items-center justify-between text-gray-700 text-sm"
                              >
                                <span>All Posts</span>
                                {viewMode === 'all' && (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search mode - full width search bar */}
          {showSearch && (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                title="Close search"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search posts..."
                className="flex-grow px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  title="Clear"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </form>
          )}
        </div>
      </header>


      {showPostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Create Post</h2>
                <button
                  onClick={() => setShowPostForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
              <PostForm onSuccess={() => setShowPostForm(false)} />
            </div>
          </div>
        </div>
      )}

      {showAvatarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Change Avatar</h2>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <AvatarUpload
              currentAvatar={currentAvatar}
              onSuccess={() => {
                loadAvatar();
                setShowAvatarModal(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
