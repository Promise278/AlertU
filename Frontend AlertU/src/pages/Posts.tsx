import { useEffect, useState, type FormEvent } from 'react'

import { useAuth } from '../context/auth-context'
import {
  addPostComment,
  createPost,
  fetchPostComments,
  fetchPosts,
  setPostLiked,
  type CampusPost,
  type PostComment,
  type PostType,
} from '../services/posts'

import './Posts.css'

const postTypeLabels: Record<PostType, string> = {
  gist: 'Campus post',
  news: 'News',
  event: 'Event',
}

function formatPostDate(value: string | null) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function Posts() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CampusPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<PostType>('gist')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busyLikes, setBusyLikes] = useState<Set<string>>(new Set())
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [loadedComments, setLoadedComments] = useState<Set<string>>(new Set())
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [postingComment, setPostingComment] = useState<Set<string>>(new Set())

  useEffect(() => {
    const controller = new AbortController()
    fetchPosts(controller.signal)
      .then(setPosts)
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return
        setError(loadError instanceof Error ? loadError.message : 'Could not load posts.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!body.trim()) return
    if (type !== 'gist' && title.trim().length < 3) {
      setError('News and event posts need a title of at least 3 characters.')
      return
    }

    setIsPosting(true)
    try {
      const post = await createPost({
        type,
        ...(type === 'gist' ? {} : { title: title.trim() }),
        body: body.trim(),
      })
      setPosts((current) => [post, ...current])
      setBody('')
      setTitle('')
      setType('gist')
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : 'Could not publish your post.')
    } finally {
      setIsPosting(false)
    }
  }

  async function handleLike(post: CampusPost) {
    if (busyLikes.has(post.id)) return
    setError('')
    setBusyLikes((current) => new Set(current).add(post.id))
    try {
      const result = await setPostLiked(post.id, !post.liked)
      setPosts((current) => current.map((item) =>
        item.id === post.id
          ? { ...item, liked: result.liked, likeCount: result.likeCount }
          : item,
      ))
    } catch (likeError) {
      setError(likeError instanceof Error ? likeError.message : 'Could not update your like.')
    } finally {
      setBusyLikes((current) => {
        const next = new Set(current)
        next.delete(post.id)
        return next
      })
    }
  }

  async function toggleComments(postId: string) {
    const isOpen = openComments.has(postId)
    setOpenComments((current) => {
      const next = new Set(current)
      if (isOpen) next.delete(postId)
      else next.add(postId)
      return next
    })
    if (isOpen || loadedComments.has(postId)) return

    setError('')
    try {
      const comments = await fetchPostComments(postId)
      setCommentsByPost((current) => ({ ...current, [postId]: comments }))
      setLoadedComments((current) => new Set(current).add(postId))
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Could not load comments.')
    }
  }

  async function handleComment(postId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const draft = (commentDrafts[postId] || '').trim()
    if (!draft || postingComment.has(postId)) return

    setError('')
    setPostingComment((current) => new Set(current).add(postId))
    try {
      const result = await addPostComment(postId, draft)
      setCommentsByPost((current) => ({
        ...current,
        [postId]: [...(current[postId] || []), result.comment],
      }))
      setCommentDrafts((current) => ({ ...current, [postId]: '' }))
      setPosts((current) => current.map((post) =>
        post.id === postId ? { ...post, commentCount: result.commentCount } : post,
      ))
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Could not post your comment.')
    } finally {
      setPostingComment((current) => {
        const next = new Set(current)
        next.delete(postId)
        return next
      })
    }
  }

  return (
    <div className="posts-page">
      <header className="posts-heading">
        <div>
          <p className="posts-eyebrow">YOUR CAMPUS COMMUNITY</p>
          <h1>Posts</h1>
          <p>Share updates, ask questions, and join the conversation on campus.</p>
        </div>
      </header>

      <form className="post-composer" onSubmit={handleCreatePost}>
        <div className="post-composer-heading">
          <span className="post-avatar" aria-hidden="true">
            {user?.displayName.trim().charAt(0).toUpperCase() || 'S'}
          </span>
          <div>
            <strong>{user?.displayName || 'Student'}</strong>
            <span>Posting to your campus</span>
          </div>
        </div>
        <label className="sr-only" htmlFor="post-type">Post type</label>
        <select
          id="post-type"
          value={type}
          onChange={(event) => setType(event.target.value as PostType)}
          disabled={isPosting}
        >
          <option value="gist">Campus post</option>
          <option value="news">News</option>
          <option value="event">Event</option>
        </select>
        {type !== 'gist' && (
          <input
            className="post-title-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={type === 'event' ? 'Event title' : 'News headline'}
            maxLength={160}
            minLength={3}
            required
            disabled={isPosting}
          />
        )}
        <label className="sr-only" htmlFor="post-body">Write a post</label>
        <textarea
          id="post-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What would you like to share with your campus?"
          maxLength={5000}
          rows={4}
          required
          disabled={isPosting}
        />
        <div className="post-composer-footer">
          <span>{body.length}/5000</span>
          <button type="submit" disabled={isPosting || !body.trim()}>
            {isPosting ? 'Publishing…' : 'Publish post'}
          </button>
        </div>
      </form>

      {error && <p className="posts-error" role="alert">{error}</p>}

      <section className="posts-feed" aria-label="Campus posts">
        {isLoading ? (
          <div className="posts-empty">Loading campus posts…</div>
        ) : posts.length === 0 ? (
          <div className="posts-empty">
            <h2>Start the conversation</h2>
            <p>There are no posts yet. Share the first update with your campus.</p>
          </div>
        ) : posts.map((post) => (
          <article className="post-card" key={post.id}>
            <div className="post-author-row">
              <span className="post-avatar" aria-hidden="true">
                {post.author?.displayName.trim().charAt(0).toUpperCase() || 'A'}
              </span>
              <div className="post-author-info">
                <strong>{post.author?.displayName || 'AlertU member'}</strong>
                <span>{formatPostDate(post.createdAt)}</span>
              </div>
              <span className="post-type-badge">{postTypeLabels[post.type]}</span>
              {post.isPinned && <span className="post-pinned-badge">Pinned</span>}
            </div>
            {post.title && <h2 className="post-card-title">{post.title}</h2>}
            <p className="post-card-body">{post.body}</p>
            {post.mediaRefs.length > 0 && (
              <div className="post-media-grid">
                {post.mediaRefs.map((imageUrl, index) => (
                  <a href={imageUrl} target="_blank" rel="noreferrer" key={imageUrl}>
                    <img src={imageUrl} alt={`Post attachment ${index + 1}`} />
                  </a>
                ))}
              </div>
            )}
            <div className="post-engagement-summary">
              <span>{post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}</span>
              <button type="button" onClick={() => void toggleComments(post.id)}>
                {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
              </button>
            </div>
            <div className="post-actions">
              <button
                type="button"
                className={post.liked ? 'post-action liked' : 'post-action'}
                onClick={() => void handleLike(post)}
                disabled={busyLikes.has(post.id)}
                aria-pressed={post.liked}
              >
                <span aria-hidden="true">♥</span> {post.liked ? 'Liked' : 'Like'}
              </button>
              <button
                type="button"
                className="post-action"
                onClick={() => void toggleComments(post.id)}
                aria-expanded={openComments.has(post.id)}
              >
                <span aria-hidden="true">◷</span> Comment
              </button>
            </div>
            {openComments.has(post.id) && (
              <div className="post-comments">
                <div className="post-comment-list">
                  {(commentsByPost[post.id] || []).map((comment) => (
                    <div className="post-comment" key={comment.id}>
                      <strong>{comment.author?.displayName || 'Campus member'}</strong>
                      <p>{comment.body}</p>
                      <span>{formatPostDate(comment.createdAt)}</span>
                    </div>
                  ))}
                  {loadedComments.has(post.id) && !commentsByPost[post.id]?.length && (
                    <p className="post-no-comments">No comments yet. Add the first one.</p>
                  )}
                </div>
                <form onSubmit={(event) => void handleComment(post.id, event)}>
                  <label className="sr-only" htmlFor={`comment-${post.id}`}>
                    Write a comment
                  </label>
                  <input
                    id={`comment-${post.id}`}
                    value={commentDrafts[post.id] || ''}
                    onChange={(event) => setCommentDrafts((current) => ({
                      ...current,
                      [post.id]: event.target.value,
                    }))}
                    placeholder="Write a comment…"
                    maxLength={1000}
                    required
                    disabled={postingComment.has(post.id)}
                  />
                  <button
                    type="submit"
                    disabled={postingComment.has(post.id) || !(commentDrafts[post.id] || '').trim()}
                  >
                    {postingComment.has(post.id) ? 'Sending…' : 'Comment'}
                  </button>
                </form>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}

export default Posts
