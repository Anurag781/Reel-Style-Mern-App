const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    text: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const commentModel = mongoose.model('comment', commentSchema);

module.exports = commentModel;
