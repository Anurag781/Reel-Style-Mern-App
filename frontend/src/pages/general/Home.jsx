import React, { useEffect, useState } from 'react'
import axios from 'axios';
import '../../styles/reels.css'
import ReelFeed from '../../components/ReelFeed'

const Home = () => {
    const [ videos, setVideos ] = useState([])
    // Autoplay behavior is handled inside ReelFeed

    useEffect(() => {
        axios.get("http://localhost:3000/api/food", { withCredentials: true })
            .then(response => {

                console.log(response.data);

                setVideos(response.data.foodItems)
            })
            .catch(() => { /* noop: optionally handle error */ })
    }, [])

    // Using local refs within ReelFeed; keeping map here for dependency parity if needed

    function addCommentToVideo(foodId, count) {
        if (typeof count === 'number') {
            setVideos((prev) => prev.map((v) => v._id === foodId ? { ...v, commentsCount: count } : v))
        } else {
            setVideos((prev) => prev.map((v) => v._id === foodId ? { ...v, commentsCount: (v.commentsCount ?? 0) + 1 } : v))
        }
    }

    function removeCommentFromVideo(foodId, count) {
        if (typeof count === 'number') {
            setVideos((prev) => prev.map((v) => v._id === foodId ? { ...v, commentsCount: Math.max(0, count) } : v))
        } else {
            setVideos((prev) => prev.map((v) => v._id === foodId ? { ...v, commentsCount: Math.max(0, (v.commentsCount ?? 1) - 1) } : v))
        }
    }

    async function likeVideo(item) {
        try {
            const response = await axios.post("http://localhost:3000/api/food/like", { foodId: item._id }, {withCredentials: true})

            if(response.data.like){
                console.log("Video liked");
                setVideos((prev) => prev.map((v) => v._id === item._id ? { ...v, likeCount: v.likeCount + 1 } : v))
            }else{
                console.log("Video unliked");
                setVideos((prev) => prev.map((v) => v._id === item._id ? { ...v, likeCount: v.likeCount - 1 } : v))
            }

            return !!response.data.like
        } catch (err) {
            console.error('likeVideo error:', err)
            return false
        }
    }

    async function saveVideo(item) {
        const response = await axios.post("http://localhost:3000/api/food/save", { foodId: item._id }, { withCredentials: true })
        
        if(response.data.save){
            setVideos((prev) => prev.map((v) => v._id === item._id ? { ...v, savesCount: v.savesCount + 1 } : v))
        }else{
            setVideos((prev) => prev.map((v) => v._id === item._id ? { ...v, savesCount: v.savesCount - 1 } : v))
        }
    }

    return (
        <ReelFeed
            items={videos}
            onLike={likeVideo}
            onSave={saveVideo}
            onCommentAdded={addCommentToVideo}
            onCommentDeleted={removeCommentFromVideo}
            emptyMessage="No videos available."
        />
    )
}

export default Home