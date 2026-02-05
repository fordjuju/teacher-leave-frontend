import axios from 'axios';

const API_BASE_URL = 'https://teacher-leave-backend.onrender.com/api';



// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (teacherData) => api.post('/auth/register', teacherData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// Leave APIs
export const leaveAPI = {
  applyLeave: (leaveData) => api.post('/leaves/apply', leaveData),
  getMyLeaves: () => api.get('/leaves/my-leaves'),
};

// Admin APIs
export const adminAPI = {
  getPendingLeaves: () => api.get('/admin/leaves/pending'),
  getAllLeaves: () => api.get('/admin/leaves/all'),
  updateLeaveStatus: (leaveId, status, reviewNotes) => 
    api.put(`/admin/leaves/${leaveId}/status`, { status, reviewNotes }),
};

// Report APIs
export const reportAPI = {
  generateSummaryReport: (params) => api.get('/reports/summary', { params }),
  exportCSV: (params) => api.get('/reports/export/csv', { 
    params,
    responseType: 'blob' // Important for file download
  }),
};

export default api;
