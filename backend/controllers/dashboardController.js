const dashboardService = require('../services/dashboardService');

/**
 * GET /api/admin/dashboard
 * Admin only
 */
const getAdminDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getAdminDashboardData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ message: error.message || 'Lỗi lấy dữ liệu bảng điều khiển quản trị' });
  }
};

/**
 * GET /api/receptionist/dashboard
 * Receptionist only
 */
const getReceptionistDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getReceptionistDashboardData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching receptionist dashboard:', error);
    res.status(500).json({ message: error.message || 'Lỗi lấy dữ liệu bảng điều khiển lễ tân' });
  }
};

/**
 * GET /api/teacher/dashboard
 * Teacher only
 */
const getTeacherDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getTeacherDashboardData(req.user._id);
    res.json(data);
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Lỗi lấy dữ liệu bảng điều khiển giáo viên' });
  }
};

/**
 * GET /api/student/dashboard
 * Student only
 */
const getStudentDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getStudentDashboardData(req.user._id);
    res.json(data);
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Lỗi lấy dữ liệu bảng điều khiển học viên' });
  }
};

module.exports = {
  getAdminDashboard,
  getReceptionistDashboard,
  getTeacherDashboard,
  getStudentDashboard,
};
