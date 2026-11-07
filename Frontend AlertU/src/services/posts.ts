import { api } from '../lib/api'

export type PostType = 'gist' | 'news' | 'event'

export interface CampusPost {
  id: string
  type: PostType
  title: string | null
  body: string
  mediaRefs: string[]
  isPinned: boolean
  likeCount: number
  commentCount: number
  liked: boolean
  isOwner: boolean
  author: { id: string; displayName: string; role: string } | null
  createdAt: string | null
}

export interface PostComment {
  id: string
  postId: string
  body: string
  author: { id: string; displayName: string; role: string } | null
  isOwner: boolean
  createdAt: string | null
}

interface PostsResponse {
  data: CampusPost[]
}

interface PostResponse {
  data: CampusPost
}

interface LikeResponse {
  data: { liked: boolean; likeCount: number }
}

interface CommentsResponse {
  data: PostComment[]
}

interface CommentResponse {
  data: { comment: PostComment; commentCount: number }
}

export function fetchPosts(signal?: AbortSignal): Promise<CampusPost[]> {
  return api<PostsResponse>('/posts?page=1&limit=50', { signal }).then(
    (response) => response.data,
  )
}

export function createPost(input: {
  type: PostType
  title?: string
  body: string
}): Promise<CampusPost> {
  return api<PostResponse>('/posts', { method: 'POST', body: input }).then(
    (response) => response.data,
  )
}

export function setPostLiked(
  postId: string,
  liked: boolean,
): Promise<LikeResponse['data']> {
  return api<LikeResponse>(`/posts/${encodeURIComponent(postId)}/like`, {
    method: liked ? 'POST' : 'DELETE',
  }).then((response) => response.data)
}

export function fetchPostComments(
  postId: string,
): Promise<PostComment[]> {
  return api<CommentsResponse>(
    `/posts/${encodeURIComponent(postId)}/comments?page=1&limit=100`,
  ).then((response) => response.data)
}

export function addPostComment(
  postId: string,
  body: string,
): Promise<CommentResponse['data']> {
  return api<CommentResponse>(
    `/posts/${encodeURIComponent(postId)}/comments`,
    { method: 'POST', body: { body } },
  ).then((response) => response.data)
}
