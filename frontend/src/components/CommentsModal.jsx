import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { io as socketIOClient } from 'socket.io-client'
import { toast } from 'react-toastify'
import '../../src/styles/order-modal.css'
import '../../src/styles/comments.css'

const CommentsModal = ({ foodId, onClose, onCommentCreated, onCommentDeleted }) => {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const socketRef = useRef(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => (document.body.style.overflow = 'auto')
  }, [])

  useEffect(() => {
    let mounted = true

    // fetch comments and current user in parallel
    axios.get(`http://localhost:3000/api/comments/${foodId}`, { withCredentials: true })
      .then(res => { if (mounted) setComments(res.data.comments) })
      .catch(() => { /* noop */ })

    axios.get('http://localhost:3000/api/auth/me/user', { withCredentials: true })
      .then(res => { if (mounted) setCurrentUserId(res.data.user._id) })
      .catch(() => { /* noop */ })

    // Setup socket and join food room
    socketRef.current = socketIOClient('http://localhost:3000', { withCredentials: true })
    socketRef.current.emit('join', `food:${foodId}`)

    const onCreated = (payload) => {
      if (!payload || payload.foodId !== foodId) return
      const incoming = payload.comment
      setComments(prev => {
        if (prev.some(c => c._id === incoming._id)) return prev
        // show toast for incoming comments by others
        if (incoming.user && incoming.user._id !== currentUserId) {
          toast.info(`${incoming.user.fullName ?? incoming.user.name ?? 'Someone'} commented`)
        }
        if (typeof onCommentCreated === 'function') onCommentCreated(foodId)
        return [incoming, ...prev]
      })
    }

    const onUpdated = (payload) => {
      if (!payload || payload.foodId !== foodId) return
      const updated = payload.comment
      let changed = false
      setComments(prev => prev.map(c => { if (c._id === updated._id) { changed = true; return updated } return c }))
      if (changed && updated.user && updated.user._id !== currentUserId) {
        toast.info('A comment was updated')
      }
    }

    const onDeleted = (payload) => {
      if (!payload || payload.foodId !== foodId) return
      const { commentId } = payload
      let removed = false
      setComments(prev => {
        if (prev.some(c => c._id === commentId)) removed = true
        return prev.filter(c => c._id !== commentId)
      })
      if (removed) {
        if (typeof onCommentDeleted === 'function') onCommentDeleted(foodId)
        toast.info('A comment was removed')
      }
    }

    socketRef.current.on('comment:created', onCreated)
    socketRef.current.on('comment:updated', onUpdated)
    socketRef.current.on('comment:deleted', onDeleted)

    return () => {
      mounted = false
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [foodId, onCommentCreated, onCommentDeleted, currentUserId])

  const postComment = async () => {
    if (!text.trim()) return
    setIsPosting(true)
    try {
      const response = await axios.post('http://localhost:3000/api/comments', { foodId, text }, { withCredentials: true })
      setComments(prev => [response.data.comment, ...prev])
      setText('')
      if (onCommentCreated) onCommentCreated(foodId)
    } catch (err) {
      console.error('Post comment failed', err)
      toast.error('Failed to post comment')
    } finally {
      setIsPosting(false)
    }
  }

  // --- edit comment ---
  const startEdit = (comment) => {
    setEditingId(comment._id)
    setEditText(comment.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = async (commentId) => {
    if (!editText.trim()) return
    // optimistic update
    const previous = comments
    setComments(prev => prev.map(c => c._id === commentId ? { ...c, text: editText } : c))
    setEditingId(null)
    setEditText('')

    try {
      await axios.patch(`http://localhost:3000/api/comments/${commentId}`, { text: editText }, { withCredentials: true })
      // server will broadcast update; no further action needed
    } catch (err) {
      console.error('Failed to update comment', err)
      toast.error('Failed to update comment')
      // revert
      setComments(previous)
    }
  }

  // --- delete comment ---
  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    // optimistic remove
    const previous = comments
    setComments(prev => prev.filter(c => c._id !== commentId))
    if (onCommentDeleted) onCommentDeleted(foodId)

    try {
      await axios.delete(`http://localhost:3000/api/comments/${commentId}`, { withCredentials: true })
      // server will broadcast deletion
    } catch (err) {
      console.error('Failed to delete comment', err)
      toast.error('Failed to delete comment')
      // revert
      setComments(previous)
      if (onCommentCreated) onCommentCreated(foodId)
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle" />
        <div className="modal-header">
          <div>
            <h2>Comments</h2>
            <p className="food-desc">Share your thoughts</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="comments-wrapper">
          <div className="comments-scroll" role="log" aria-live="polite">
            {comments.length === 0 && <p style={{ color: '#666', padding: '8px' }}>No comments yet</p>}

            {comments.map(c => {
              const isOwner = currentUserId && c.user && (c.user._id === currentUserId || c.user._id === String(currentUserId))

              const name = c.user?.fullName ?? c.user?.name ?? (c.user?.email ? c.user.email.split('@')[0] : 'Unknown')
              const initials = name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()

              return (
                <div className="comment-row" key={c._id}>
                  <div className="comment-avatar" aria-hidden>
                    {initials || 'U'}
                  </div>

                  <div className="comment-main">
                    <div className="comment-head">
                      <div className="comment-user">{name}</div>

                      <div className="comment-actions">
                        {isOwner && editingId !== c._id && (
                          <>
                            <button className="link" onClick={() => startEdit(c)}>Edit</button>
                            <button className="link danger" onClick={() => deleteComment(c._id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingId === c._id ? (
                      <div className="comment-edit-box">
                        <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                        <div className="comment-edit-actions">
                          <button className="confirm-btn" onClick={() => saveEdit(c._id)}>Save</button>
                          <button className="btn" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="comment-text">{c.text}</div>
                        <div className="comment-time">{new Date(c.createdAt).toLocaleString()}</div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="comment-input-row">
            <div className="avatar-sm" aria-hidden>U</div>
            <input className="comment-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment..." />
            <button className="comment-post-btn" onClick={postComment} disabled={!text.trim()}>{isPosting ? 'Posting...' : 'Post'}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CommentsModal
