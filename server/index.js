const express = require('express');
const cors = require('cors');
const { User, PerformanceReview, FeedbackRequest } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// --- ADMIN: CRUD EMPLOYEES ---

// 1. CREATE Employee
app.post('/api/admin/employees', async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: "Email might already exist" });
  }
});

// 2. READ All Employees
app.get('/api/admin/employees', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// 3. DELETE Employee
app.delete('/api/admin/employees/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  // Cleanup associated reviews
  await PerformanceReview.deleteMany({ subjectId: req.params.id });
  await FeedbackRequest.deleteMany({ reviewerId: req.params.id });
  res.json({ message: "Employee deleted" });
});

// --- ADMIN: ASSIGNMENT LOGIC ---

app.post('/api/admin/assign-review', async (req, res) => {
  const { title, subjectId, reviewerId } = req.body;
  
  // Create the review cycle
  const review = await PerformanceReview.create({ title, subjectId });
  
  // Assign a coworker to it
  const assignment = await FeedbackRequest.create({ 
    reviewId: review._id, 
    reviewerId 
  });
  
  res.status(201).json(assignment);
});

// --- EMPLOYEE: VIEW TASKS ---
app.get('/api/employee/tasks/:userId', async (req, res) => {
  const tasks = await FeedbackRequest.find({ reviewerId: req.params.userId, completed: false })
    .populate({
      path: 'reviewId',
      populate: { path: 'subjectId', select: 'name' }
    });
  res.json(tasks);
});

app.listen(3000, () => console.log('Admin CRUD Server running on port 3000'));