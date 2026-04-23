const mongoose = require('mongoose');

// Connect to local MongoDB (adjust URI if needed)
mongoose.connect('mongodb://localhost:27017/sampledb')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error', err));

// 1. User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  role: { type: String, enum: ['ADMIN', 'EMPLOYEE'], default: 'EMPLOYEE' }
}, { timestamps: true });

// 2. Performance Review Schema (The "Subject" of the review)
const reviewSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// 3. Feedback Request Schema (The "Task" for reviewers)
const feedbackSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'PerformanceReview', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: "" },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const PerformanceReview = mongoose.model('PerformanceReview', reviewSchema);
const FeedbackRequest = mongoose.model('FeedbackRequest', feedbackSchema);

module.exports = { User, PerformanceReview, FeedbackRequest };
