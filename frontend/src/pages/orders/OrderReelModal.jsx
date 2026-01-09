import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/orderreel-modal.css';

const OrderReelModal = ({ order, onClose, onReorder }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isReordering, setIsReordering] = useState(false);

  // Lock scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReorderInternal = async (e) => {
    e.stopPropagation();
    setIsReordering(true);
    await onReorder(order);
    setIsReordering(false);
  };

  if (!order) return null;

  return createPortal(
    <div className="reel-backdrop" onClick={onClose}>
      <div className="reel-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className="reel-close-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Video Section */}
        <div className="video-wrapper" onClick={togglePlay}>
          {order.food?.video ? (
            <>
              <video
                ref={videoRef}
                src={order.food.video}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                className="main-video"
              />
              <div className="video-progress-container">
                <div className="video-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              {!isPlaying && (
                <div className="play-overlay">
                  <div className="play-icon-large">▶</div>
                </div>
              )}
            </>
          ) : (
            <div className="reel-empty">No Preview Available</div>
          )}
        </div>

        {/* Footer Info & Actions */}
        <div className="reel-footer visible">
          <div className="footer-content">
            <div className="text-info">
              <span className="category-tag">Recently Ordered</span>
              <h3 className="food-name">{order.food?.name}</h3>
              <p className="order-date">
                Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            <div className="action-controls">
              <button 
                className="glass-ctrl" 
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              {/* Show pay button for unpaid orders */}
              

              <button 
                className="order-again-btn" 
                onClick={handleReorderInternal}
                disabled={isReordering}
              >
                {isReordering ? 'Placing Order...' : 'Reorder Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderReelModal;