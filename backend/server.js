const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const receptionistRoutes = require('./routes/receptionistRoutes');
const studentResourceRoutes = require('./routes/studentResourceRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const accountRoutes = require('./routes/accountRoutes');
const classRoutes = require('./routes/classRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const resultRoutes = require('./routes/resultRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/student', studentRoutes);

// Phase 2 VLearn Domain Routes
app.use('/api/students', studentResourceRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/accounts', accountRoutes);

// Phase 3 VLearn Domain Routes
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// Phase 4 VLearn Domain Routes
app.use('/api/schedules', scheduleRoutes);
app.use('/api/sessions', sessionRoutes);

// Phase 6 VLearn Domain Routes
app.use('/api/results', resultRoutes);

// Phase 7 VLearn Domain Routes
const tuitionRoutes = require('./routes/tuitionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/tuition/invoices', tuitionRoutes);
app.use('/api/payments', paymentRoutes);

// Phase 9 VLearn Utility Routes
const noticeRoutes = require('./routes/noticeRoutes');
const materialRoutes = require('./routes/materialRoutes');
app.use('/api/notices', noticeRoutes);
app.use('/api/materials', materialRoutes);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});
app.get("/", (req, res) => {
  res.send("VLearn English Center API is running");
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
