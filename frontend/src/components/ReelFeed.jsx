import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import '../../src/styles/reels.css'
import OrderModal from '../pages/orders/OrderModal.jsx'
import CommentsModal from './CommentsModal'
import { io as socketIOClient } from 'socket.io-client'

const ReelFeed = ({ items = [], onLike, onSave, onCommentAdded, onCommentDeleted, emptyMessage = 'No videos yet.' }) => {
  const videoRefs = useRef(new Map())
  const [selectedFood, setSelectedFood] = useState(null)
  const [commentTarget, setCommentTarget] = useState(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  // transient list of item ids currently showing the center heart animation
  const [burstIds, setBurstIds] = useState([])
  const navigate = useNavigate()
  const socketRef = useRef(null)

  // Setup socket to listen for comment broadcasts and join food rooms
  useEffect(() => {
    try {
      socketRef.current = socketIOClient('http://localhost:3000', { withCredentials: true })

      socketRef.current.on('connect', () => {
        // join rooms for current items
        items.forEach(i => socketRef.current.emit('join', `food:${i._id}`))
      })

      socketRef.current.on('comment:created', (payload) => {
        if (!payload || !payload.foodId) return
        if (typeof onCommentAdded === 'function') {
          if (typeof payload.commentsCount === 'number') onCommentAdded(payload.foodId, payload.commentsCount)
          else onCommentAdded(payload.foodId)
        }
      })

      socketRef.current.on('comment:updated', (payload) => {
        // no count change required for updates; UI components may re-fetch or listen separately
        if (!payload || !payload.foodId) return
      })

      socketRef.current.on('comment:deleted', (payload) => {
        if (!payload || !payload.foodId) return
        if (typeof onCommentDeleted === 'function') {
          if (typeof payload.commentsCount === 'number') onCommentDeleted(payload.foodId, payload.commentsCount)
          else onCommentDeleted(payload.foodId)
        }
      })
    } catch (err) {
      console.error('Socket connection error (reels):', err)
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep rooms in sync when items change (join new rooms)
  useEffect(() => {
    if (!socketRef.current) return
    try {
      items.forEach(i => socketRef.current.emit('join', `food:${i._id}`))
    } catch (err) {
      // noop
    }
  }, [items])

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await axios.get("http://localhost:3000/api/auth/user/logout", { withCredentials: true })
      toast.info("Logged out successfully")
      navigate("/user/login")
    } catch (error) {
      toast.error("Logout failed")
      console.error(error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target
          if (!(video instanceof HTMLVideoElement)) return
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.play().catch(() => { })
          } else {
            video.pause()
          }
        })
      },
      { threshold: [0, 0.25, 0.6, 0.9, 1] }
    )

    videoRefs.current.forEach((vid) => observer.observe(vid))
    return () => observer.disconnect()
  }, [items])

  const setVideoRef = (id) => (el) => {
    if (!el) {
      videoRefs.current.delete(id)
      return
    }
    videoRefs.current.set(id, el)
  }

  // Trigger a short-lived heart burst animation for a specific item id
  const triggerBurst = (id) => {
    if (!id) return
    setBurstIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    window.setTimeout(() => setBurstIds((prev) => prev.filter((x) => x !== id)), 900)
  }

  return (
    <div className="reels-page">
      {/* --- BRAND LOGO --- */}
      <div className="reel-brand-logo">
        Foodie<span>.</span>
      </div>

      {/* --- LOGOUT BUTTON --- */}
      <button
        className="reel-logout-trigger"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span className="logout-text">
          {isLoggingOut ? "..." : "Logout"}
        </span>
      </button>

      <div className="reels-feed" role="list">
        {items.length === 0 && (
          <div className="empty-state">
            <p>{emptyMessage}</p>
          </div>
        )}

        {items.map((item) => (
          <section key={item._id} className="reel" role="listitem">
            <video
              ref={setVideoRef(item._id)}
              className="reel-video"
              src={item.video}
              muted
              playsInline
              loop
              preload="metadata"
              onDoubleClick={async (e) => {
                e.preventDefault()
                if (!onLike) return
                const liked = await onLike(item)
                if (liked) triggerBurst(item._id)
              }}
            />

            <div className="reel-overlay">
              <div className="reel-overlay-gradient" aria-hidden="true" />

              {burstIds.includes(item._id) && (
                <div className="reel-heart-burst" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="#ff4757" width="120" height="120" aria-hidden="true">
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                  </svg>
                </div>
              )}

              <div className="reel-actions">
                {/* LIKE - Updated to check multiple possible count keys */}
                <div className="reel-action-group">
                  <button
                    onClick={onLike ? async (e) => {
                      e.stopPropagation()
                      const liked = await onLike(item)
                      if (liked) triggerBurst(item._id)
                    } : undefined}
                    className={`reel-action ${item.isLiked ? 'active' : ''}`}
                    aria-label="Like"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={item.isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">
                    {item.likesCount ?? item.likeCount ?? item.likes ?? 0}
                  </div>
                </div>

                {/* SAVE - Updated to check multiple possible count keys */}
                <div className="reel-action-group">
                  <button 
                    className={`reel-action ${item.isSaved ? 'active' : ''}`} 
                    onClick={onSave ? () => onSave(item) : undefined} 
                    aria-label="Bookmark"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={item.isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">
                    {item.savesCount ?? item.saveCount ?? item.saves ?? 0}
                  </div>
                </div>

                {/* COMMENTS */}
                <div className="reel-action-group">
                  <button className="reel-action" aria-label="Comments" onClick={(e) => { e.stopPropagation(); setCommentTarget(item) }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">
                    {item.commentsCount ?? item.comments?.length ?? 0}
                  </div>
                </div>

                {/* ORDER */}
                <div className="reel-action-group">
                  <button className="reel-action order-action" onClick={(e) => { e.stopPropagation(); setSelectedFood(item) }} aria-label="Order Food">
                    🍽️
                  </button>
                  <div className="reel-action__count">Order</div>
                </div>
              </div>

              <div className="reel-content">
                <p className="reel-description" title={item.description}>{item.description}</p>
                {item.foodPartner && (
                  <Link className="reel-btn" to={"/food-partner/" + item.foodPartner}>
                    Visit store
                  </Link>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
      {selectedFood && <OrderModal food={selectedFood} onClose={() => setSelectedFood(null)} />}
      {commentTarget && (
        <CommentsModal
          foodId={commentTarget._id}
          onClose={() => setCommentTarget(null)}
          onCommentCreated={(foodId) => {
            if (typeof onCommentAdded === 'function') onCommentAdded(foodId)
          }}
          onCommentDeleted={(foodId) => {
            if (typeof onCommentDeleted === 'function') onCommentDeleted(foodId)
          }}
        />
      )}
    </div>
  )
}

export default ReelFeed