const mongoose = require('mongoose');
const { User, PerformanceReview, FeedbackRequest } = require('./db');

async function seed() {
  try {
    await User.deleteMany({});
    await PerformanceReview.deleteMany({});
    await FeedbackRequest.deleteMany({});

    // 1. Create Users
    const admin = await User.create({ name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' });
    const alice = await User.create({ name: 'Alice Smith', email: 'alice@test.com', role: 'EMPLOYEE' });
    const bob = await User.create({ name: 'Bob Jones', email: 'bob@test.com', role: 'EMPLOYEE' });

    // 2. Create a Review for Alice
    const review = await PerformanceReview.create({ 
      title: "Annual Review 2026", 
      subjectId: alice._id 
    });

    // 3. Assign Bob to review Alice
    await FeedbackRequest.create({
      reviewId: review._id,
      reviewerId: bob._id
    });

    console.log("MongoDB Seeded Successfully!");
    process.exit();
  } catch (error) {
    console.error("Seed Error:", error);
    process.exit(1);
  }
}

seed();