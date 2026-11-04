const mongoose = require('mongoose');

const UserJobSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    job_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    status: {
        type: String,
        enum: ['applied', 'offered', 'hired', 'rejected', 'completed', 'left', 'terminated'],
        required: true
    },
    date_applied: {
        type: Date,
        required: true
    },
    date_offered: {
        type: Date
    },
    date_of_joining: {
        type: Date
    },
    date_of_leaving: {
        type: Date
    },
    leaves_taken: {
        type: Number
    },
    payment_status: {
        type: String,
        enum: ['pending', 'paid', 'disputed']
    },
    rating_given_by_user: {
        type: Number,
        min: 1,
        max: 5
    },
    rating_given_to_user: {
        type: Number,
        min: 1,
        max: 5
    },
    feedback: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserJob', UserJobSchema);
