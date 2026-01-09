const commentModel = require('../models/comment.model');
const foodModel = require('../models/food.model');
const socketService = require('../services/socket.service');

async function createComment(req, res) {
    const user = req.user;
    const { foodId, text } = req.body;

    if (!foodId || !text) {
        return res.status(400).json({ message: "foodId and text are required" });
    }

    const comment = await commentModel.create({
        food: foodId,
        user: user._id,
        text
    });

    // increment comments count
    await foodModel.findByIdAndUpdate(foodId, { $inc: { commentsCount: 1 } });

    // Populate comment user for broadcasting (include _id)
    const populatedComment = await commentModel.findById(comment._id).populate('user', 'fullName email _id');

    // Get updated comments count
    const food = await foodModel.findById(foodId).select('commentsCount');

    // Broadcast via socket (room: food:<id>)
    const io = socketService.getIO();
    if (io) {
        io.to(`food:${foodId}`).emit('comment:created', { comment: populatedComment, foodId, commentsCount: food?.commentsCount ?? 0 });
    }

    res.status(201).json({ message: "Comment created", comment: populatedComment });
}

async function getComments(req, res) {
    const { foodId } = req.params;

    const comments = await commentModel.find({ food: foodId })
        .sort({ createdAt: -1 })
        .populate('user', 'fullName email _id');

    res.status(200).json({ message: "Comments fetched", comments });
}

async function updateComment(req, res) {
    const user = req.user;
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ message: "text is required" });
    }

    const comment = await commentModel.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (!comment.user.equals(user._id)) {
        return res.status(403).json({ message: "Not authorized to edit this comment" });
    }

    comment.text = text;
    await comment.save();

    const populatedComment = await commentModel.findById(comment._id).populate('user', 'fullName email _id');

    // Broadcast update
    const io = socketService.getIO();
    if (io) {
        io.to(`food:${comment.food}`).emit('comment:updated', { comment: populatedComment, foodId: comment.food });
    }

    res.status(200).json({ message: "Comment updated", comment: populatedComment });
}

async function deleteComment(req, res) {
    const user = req.user;
    const { commentId } = req.params;

    const comment = await commentModel.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (!comment.user.equals(user._id)) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    const foodId = comment.food;

    await commentModel.deleteOne({ _id: commentId });

    // decrement comments count
    await foodModel.findByIdAndUpdate(foodId, { $inc: { commentsCount: -1 } });
    const food = await foodModel.findById(foodId).select('commentsCount');

    // Broadcast deletion
    const io = socketService.getIO();
    if (io) {
        io.to(`food:${foodId}`).emit('comment:deleted', { commentId, foodId, commentsCount: food?.commentsCount ?? 0 });
    }

    res.status(200).json({ message: "Comment deleted", commentId });
}

module.exports = {
    createComment,
    getComments,
    updateComment,
    deleteComment
};
