import axios from 'axios';

// All requests go through /api — the proxy layer (Vite dev server or nginx)
// handles forwarding to the actual backend.
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Returns the base URL (without /api) used to construct media file URLs.
// With the proxy approach, media is served through the same origin, so this is always ''.
export const getBaseUrl = () => '';

// Posts API
export const postsApi = {
  getPosts: (page = 1, limit = 20, viewMode = 'public') =>
    apiClient.get('/posts', { params: { page, limit, view_mode: viewMode } }),

  getPost: (id) =>
    apiClient.get(`/posts/${id}`),

  createPost: (data) =>
    apiClient.post('/posts', data),

  updatePost: (id, data) =>
    apiClient.put(`/posts/${id}`, data),

  deletePost: (id) =>
    apiClient.delete(`/posts/${id}`),

  repostPost: (id, data) =>
    apiClient.post(`/posts/${id}/repost`, data),

  searchPosts: (query, page = 1, limit = 20, viewMode = 'public') =>
    apiClient.get('/posts/search', { params: { q: query, page, limit, view_mode: viewMode } }),

  getDeletedPosts: (page = 1, limit = 20) =>
    apiClient.get('/posts/deleted', { params: { page, limit } }),

  restorePost: (id) =>
    apiClient.post(`/posts/${id}/restore`),

  permanentlyDeletePost: (id) =>
    apiClient.delete(`/posts/${id}/permanent`),
};

// Media API
export const mediaApi = {
  uploadMedia: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteMedia: (id) =>
    apiClient.delete(`/media/${id}`),
};

// User API
export const userApi = {
  getProfile: () =>
    apiClient.get('/user/profile'),

  updateProfile: (data) =>
    apiClient.put('/user/profile', data),
};

// Avatars API
export const avatarsApi = {
  getAvatars: () =>
    apiClient.get('/avatars'),

  getCurrentAvatar: () =>
    apiClient.get('/avatars/current'),

  uploadAvatar: (file, setCurrent = true) => {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('set_current', setCurrent);
    return apiClient.post('/avatars', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  setCurrentAvatar: (id) =>
    apiClient.put(`/avatars/${id}/current`),
};

export default apiClient;
