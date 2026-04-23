const express = require('express');
const cors = require('cors');
const { User, PerformanceReview, FeedbackRequest } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

const asyncHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Unexpected server error.' });
  }
};

async function getDashboardPayload() {
  const [employees, reviews, assignments] = await Promise.all([
    User.find().sort({ role: 1, name: 1 }),
    PerformanceReview.find()
      .populate('subjectId', 'name email role')
      .sort({ createdAt: -1 }),
    FeedbackRequest.find()
      .populate({
        path: 'reviewId',
        populate: { path: 'subjectId', select: 'name email role' }
      })
      .populate('reviewerId', 'name email role')
      .sort({ completed: 1, createdAt: -1 })
  ]);

  return { employees, reviews, assignments };
}

// ADMIN ROUTES

app.get('/api/admin/employees', asyncHandler(async (req, res) => {
  const users = await User.find().sort({ role: 1, name: 1 });
  res.json(users);
}));

app.get('/api/admin/dashboard', asyncHandler(async (req, res) => {
  res.json(await getDashboardPayload());
}));

app.post('/api/admin/employees', asyncHandler(async (req, res) => {
  const { name, email, role = 'EMPLOYEE' } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: 'A user with this email already exists.' });
  }

  const employee = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role
  });

  res.status(201).json(employee);
}));

app.delete('/api/admin/employees/:id', asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  if (employee.role === 'ADMIN') {
    return res.status(400).json({ message: 'Admin users cannot be deleted.' });
  }

  const reviews = await PerformanceReview.find({ subjectId: employee._id }).select('_id');
  const reviewIds = reviews.map((review) => review._id);

  await Promise.all([
    reviewIds.length
      ? FeedbackRequest.deleteMany({ reviewId: { $in: reviewIds } })
      : Promise.resolve(),
    FeedbackRequest.deleteMany({ reviewerId: employee._id }),
    PerformanceReview.deleteMany({ subjectId: employee._id }),
    employee.deleteOne()
  ]);

  res.json({ message: 'Employee deleted.' });
}));

app.get('/api/admin/reviews', asyncHandler(async (req, res) => {
  const reviews = await PerformanceReview.find()
    .populate('subjectId', 'name email role')
    .sort({ createdAt: -1 });

  const reviewsWithFeedback = await Promise.all(
    reviews.map(async (review) => {
      const feedbackRequests = await FeedbackRequest.find({ reviewId: review._id })
        .populate('reviewerId', 'name email role')
        .sort({ completed: 1, createdAt: -1 });

      return { ...review.toObject(), feedbackRequests };
    })
  );

  res.json(reviewsWithFeedback);
}));

app.post('/api/admin/reviews', asyncHandler(async (req, res) => {
  const { title, subjectId } = req.body;

  if (!title?.trim() || !subjectId) {
    return res.status(400).json({ message: 'Review title and subject are required.' });
  }

  const review = await PerformanceReview.create({
    title: title.trim(),
    subjectId
  });

  res.status(201).json(review);
}));

app.post('/api/admin/assign', asyncHandler(async (req, res) => {
  const { reviewId, reviewerId } = req.body;

  if (!reviewId || !reviewerId) {
    return res.status(400).json({ message: 'Review and reviewer are required.' });
  }

  const review = await PerformanceReview.findById(reviewId);
  if (!review) {
    return res.status(404).json({ message: 'Review not found.' });
  }

  if (String(review.subjectId) === String(reviewerId)) {
    return res.status(400).json({ message: 'An employee cannot review themselves.' });
  }

  const existingAssignment = await FeedbackRequest.findOne({ reviewId, reviewerId });
  if (existingAssignment) {
    return res.status(409).json({ message: 'This reviewer is already assigned to the review.' });
  }

  const assignment = await FeedbackRequest.create({ reviewId, reviewerId });
  res.status(201).json(assignment);
}));

app.post('/api/admin/assign-review', asyncHandler(async (req, res) => {
  const { title, subjectId, reviewerId } = req.body;

  if (!title?.trim() || !subjectId || !reviewerId) {
    return res.status(400).json({ message: 'Title, subject, and reviewer are required.' });
  }

  if (String(subjectId) === String(reviewerId)) {
    return res.status(400).json({ message: 'An employee cannot review themselves.' });
  }

  const review = await PerformanceReview.create({
    title: title.trim(),
    subjectId
  });

  const assignment = await FeedbackRequest.create({
    reviewId: review._id,
    reviewerId
  });

  res.status(201).json({ review, assignment });
}));

// EMPLOYEE ROUTES

app.get('/api/employee/tasks/:userId', asyncHandler(async (req, res) => {
  const tasks = await FeedbackRequest.find({ reviewerId: req.params.userId })
    .populate({
      path: 'reviewId',
      populate: { path: 'subjectId', select: 'name email' }
    })
    .sort({ completed: 1, createdAt: -1 });

  res.json(tasks);
}));

app.get('/api/employee/summary/:userId', asyncHandler(async (req, res) => {
  const assignedReviews = await FeedbackRequest.find({ reviewerId: req.params.userId })
    .populate({
      path: 'reviewId',
      populate: { path: 'subjectId', select: 'name email' }
    })
    .sort({ completed: 1, createdAt: -1 });

  const subjectReviews = await PerformanceReview.find({ subjectId: req.params.userId }).select('_id title');
  const reviewIds = subjectReviews.map((review) => review._id);

  const feedbackAboutMe = reviewIds.length
    ? await FeedbackRequest.find({ reviewId: { $in: reviewIds } })
        .populate('reviewId', 'title')
        .populate('reviewerId', 'name email')
        .sort({ completed: 1, createdAt: -1 })
    : [];

  res.json({ assignedReviews, feedbackAboutMe });
}));

app.put('/api/employee/feedback/:taskId', asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ message: 'Feedback content is required.' });
  }

  const updatedTask = await FeedbackRequest.findByIdAndUpdate(
    req.params.taskId,
    { content: content.trim(), completed: true },
    { new: true }
  );

  if (!updatedTask) {
    return res.status(404).json({ message: 'Feedback task not found.' });
  }

  res.json(updatedTask);
}));

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));
