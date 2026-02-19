import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../api/client';

export const usePosts = (page = 1, limit = 10, viewMode = 'public') => {
  return useQuery({
    queryKey: ['posts', page, limit, viewMode],
    queryFn: () => postsApi.getPosts(page, limit, viewMode).then(res => res.data),
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postData) => postsApi.createPost(postData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => postsApi.updatePost(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => postsApi.deletePost(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useRepostPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, userId, repostComment }) =>
      postsApi.repostPost(postId, { user_id: userId, repost_comment: repostComment }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useSearchPosts = (query, page = 1, limit = 10, viewMode = 'public') => {
  return useQuery({
    queryKey: ['posts', 'search', query, page, limit, viewMode],
    queryFn: () => postsApi.searchPosts(query, page, limit, viewMode).then(res => res.data),
    enabled: !!query && query.trim() !== '',
  });
};
