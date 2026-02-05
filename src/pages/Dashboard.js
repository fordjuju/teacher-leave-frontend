import React, { useState, useEffect, useCallback } from 'react';
import { leaveAPI } from '../services/api';
import StatisticsCard from '../components/statistics/StatisticsCard';
import LeaveChart from '../components/statistics/LeaveChart';
import MonthlyChart from '../components/statistics/MonthlyChart';

// Leave Types with specific rules
const LEAVE_TYPES = [
  {
    value: 'Sick Leave',
    label: 'Sick Leave',
    maxDays: 7,
    requiresDocumentation: false,
    description: 'For health-related absences',
    color: '#3b82f6',
    icon: '🤒'
  },
  {
    value: 'Casual Leave',
    label: 'Casual Leave',
    maxDays: 5,
    requiresDocumentation: false,
    description: 'For personal or casual reasons',
    color: '#10b981',
    icon: '😊'
  },
  {
    value: 'Annual Leave',
    label: 'Annual Leave',
    maxDays: 30,
    requiresDocumentation: false,
    description: 'Paid annual vacation',
    color: '#8b5cf6',
    icon: '🏖️'
  },
  {
    value: 'Maternity Leave',
    label: 'Maternity Leave',
    maxDays: 90,
    requiresDocumentation: true,
    description: 'For expecting mothers',
    color: '#ec4899',
    icon: '🤰'
  },
  {
    value: 'Study Leave',
    label: 'Study Leave',
    maxDays: 30,
    requiresDocumentation: true,
    description: 'For educational purposes',
    color: '#6366f1',
    icon: '📚'
  }
];

const Dashboard = ({ user, onLogout }) => {
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showLeavesList, setShowLeavesList] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    totalDays: 1,
    reason: '',
  });
  const [leaves, setLeaves] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [stats, setStats] = useState({
    totalLeaves: 0,
    approvedLeaves: 0,
    pendingLeaves: 0,
    rejectedLeaves: 0,
    usedDays: 0,
    remainingDays: 0, // We'll calculate this differently
  });
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);

  // Fetch leaves when component loads
  useEffect(() => {
    fetchLeaves();
  }, []);

  const calculateStatistics = useCallback(() => {
    const totalLeaves = leaves.length;
    const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
    const rejectedLeaves = leaves.filter(l => l.status === 'Rejected').length;
    
    const usedDays = leaves
      .filter(l => l.status === 'Approved')
      .reduce((sum, leave) => sum + leave.totalDays, 0);

    setStats({
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      usedDays,
      remainingDays: 0, // Not using balance system
    });
  }, [leaves]);

  useEffect(() => {
    if (leaves.length > 0) {
      calculateStatistics();
    }
  }, [leaves, calculateStatistics]);

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const response = await leaveAPI.getMyLeaves();
      const leavesData = response.data.leaves || [];
      setLeaves(leavesData);
    } catch (err) {
      setError('Failed to load leave applications.');
    } finally {
      setLoadingLeaves(false);
    }
  };

  // Prepare chart data
  const getStatusChartData = () => {
    return [
      { name: 'Status', Pending: stats.pendingLeaves, Approved: stats.approvedLeaves, Rejected: stats.rejectedLeaves }
    ];
  };

  const getMonthlyChartData = () => {
    // Group leaves by month
    const monthlyData = {};
    
    leaves.forEach(leave => {
      const date = new Date(leave.appliedDate);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      monthlyData[monthYear]++;
    });

    return Object.keys(monthlyData)
      .map(month => ({
        month,
        leaves: monthlyData[month]
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6); // Last 6 months
  };

  const handleLeaveFormChange = (e) => {
    const { name, value } = e.target;
    setLeaveForm({
      ...leaveForm,
      [name]: value,
    });
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    console.log('=== DEBUGGING LEAVE SUBMISSION ===');
    console.log('1. Submitting leave form data:', leaveForm);

    // VALIDATION
    if (!leaveForm.leaveType) {
      setError('Please select a leave type.');
      setLoading(false);
      return;
    }

    const selectedType = LEAVE_TYPES.find(t => t.value === leaveForm.leaveType);
    if (!selectedType) {
      setError('Invalid leave type selected.');
      setLoading(false);
      return;
    }

    // ONLY validate max days for this leave type (no balance check)
    if (leaveForm.totalDays > selectedType.maxDays) {
      setError(`${selectedType.label} cannot exceed ${selectedType.maxDays} days.`);
      setLoading(false);
      return;
    }

    // Check if documentation is required
    if (selectedType.requiresDocumentation) {
      // Note: You can add file upload functionality here later
      console.log('Note: This leave type requires documentation');
    }

    try {
      console.log('2. About to call leaveAPI.applyLeave');
      
      const response = await leaveAPI.applyLeave(leaveForm);
      
      console.log('3. API Response received:', response);
      console.log('4. Response data:', response.data);
      
      setMessage('Leave application submitted successfully!');
      setLeaveForm({
        leaveType: '',
        startDate: '',
        endDate: '',
        totalDays: 1,
        reason: '',
      });
      setSelectedLeaveType(null);
      setShowLeaveForm(false);
      
      // Refresh leaves list
      fetchLeaves();
      
    } catch (err) {
      console.log('5. ERROR CAUGHT ==================');
      console.log('Error object:', err);
      console.log('Response data:', err.response?.data);
      console.log('Status:', err.response?.status);
      
      let errorMsg = 'Failed to submit leave application. ';
      if (err.response?.data?.error) {
        errorMsg += err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg += err.response.data.message;
      } else if (err.response?.status === 500) {
        errorMsg += 'Server error (500).';
      } else {
        errorMsg += err.message || 'Unknown error';
      }
      
      setError(errorMsg);
    } finally {
      console.log('6. Finally - setting loading to false');
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (leaveForm.startDate && leaveForm.endDate) {
      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setLeaveForm(prev => ({ ...prev, totalDays: diffDays }));
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return '#059669';
      case 'Rejected':
        return '#dc2626';
      default:
        return '#d97706';
    }
  };

  // Get tomorrow's date for min date (can't apply for leave for today)
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Staff Dashboard</h1>
        <button onClick={onLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
      
      <div style={styles.welcome}>
        <h2>Welcome, {user?.name}!</h2>
        <p>Email: {user?.email} • Department: {user?.department}</p>
      </div>

      {message && <div style={styles.successMessage}>{message}</div>}
      {error && <div style={styles.errorMessage}>{error}</div>}

      {/* Statistics Cards - REMOVED Leave Balance card */}
      <div style={styles.statsGrid}>
        <StatisticsCard
          title="Used Leave Days"
          value={stats.usedDays}
          icon="⏳"
          color="#f59e0b"
          subtitle={`${stats.approvedLeaves} approved leaves`}
        />
        <StatisticsCard
          title="Total Applications"
          value={stats.totalLeaves}
          icon="📝"
          color="#10b981"
          subtitle={`${stats.pendingLeaves} pending`}
        />
        <StatisticsCard
          title="Pending Approvals"
          value={stats.pendingLeaves}
          icon="⏰"
          color="#8b5cf6"
          subtitle={`${stats.rejectedLeaves} rejected`}
        />
        <StatisticsCard
          title="Leave History"
          value={leaves.length}
          icon="📊"
          color="#3b82f6"
          subtitle={`${stats.approvedLeaves} approved`}
        />
      </div>

      {/* Charts Section */}
      <div style={styles.chartsRow}>
        <div style={styles.chartColumn}>
          <LeaveChart 
            data={getStatusChartData()} 
            title="Leave Applications Status" 
          />
        </div>
        <div style={styles.chartColumn}>
          <MonthlyChart 
            data={getMonthlyChartData()} 
            title="Leaves Trend (Last 6 Months)" 
          />
        </div>
      </div>

      <div style={styles.section}>
        <h3>Quick Actions</h3>
        <div style={styles.actions}>
          <button 
            onClick={() => {
              setShowLeaveForm(!showLeaveForm);
              setShowLeavesList(false);
              setError('');
              setMessage('');
              setSelectedLeaveType(null);
            }} 
            style={styles.actionButton}
          >
            {showLeaveForm ? 'Cancel Leave Application' : 'Apply for Leave'}
          </button>
          <button 
            onClick={() => {
              setShowLeavesList(!showLeavesList);
              setShowLeaveForm(false);
              setError('');
              setMessage('');
            }}
            style={styles.actionButton}
          >
            {showLeavesList ? 'Hide My Leaves' : 'View My Leaves'}
          </button>
        </div>
      </div>

      {showLeaveForm && (
        <div style={styles.leaveFormSection}>
          <h3>Apply for Leave</h3>
          <form onSubmit={handleApplyLeave} style={styles.leaveForm}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Leave Type *</label>
                <select
                  name="leaveType"
                  value={leaveForm.leaveType}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLeaveForm({
                      ...leaveForm,
                      leaveType: value
                    });
                    // Set the selected leave type for rules
                    const type = LEAVE_TYPES.find(t => t.value === value);
                    setSelectedLeaveType(type);
                    
                    // Reset days if they exceed the new max
                    if (type && leaveForm.totalDays > type.maxDays) {
                      setLeaveForm(prev => ({
                        ...prev,
                        totalDays: type.maxDays
                      }));
                    }
                  }}
                  style={styles.select}
                  disabled={loading}
                  required
                >
                  <option value="">Select Leave Type</option>
                  {LEAVE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label} (Max: {type.maxDays} days)
                    </option>
                  ))}
                </select>
                
                {/* Leave type info display */}
                {selectedLeaveType && (
                  <div style={styles.leaveTypeInfo}>
                    <p style={{ margin: '5px 0', color: selectedLeaveType.color }}>
                      <strong>{selectedLeaveType.label}:</strong> {selectedLeaveType.description}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                      {selectedLeaveType.requiresDocumentation ? '📄 Documentation required' : 'No documentation required'}
                    </p>
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Total Days *</label>
                <input
                  type="number"
                  name="totalDays"
                  value={leaveForm.totalDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value) || 1;
                    // Get max days based on selected leave type
                    const maxDays = selectedLeaveType ? selectedLeaveType.maxDays : 365;
                    // Cap the days at the maximum allowed for this leave type
                    const cappedDays = Math.min(days, maxDays);
                    setLeaveForm(prev => ({ 
                      ...prev, 
                      totalDays: cappedDays 
                    }));
                  }}
                  style={styles.input}
                  min="1"
                  max={selectedLeaveType ? selectedLeaveType.maxDays : 365}
                  disabled={loading}
                  required
                />
                <small style={styles.helpText}>
                  {selectedLeaveType 
                    ? `Maximum: ${selectedLeaveType.maxDays} days for ${selectedLeaveType.label}`
                    : 'Select a leave type to see max days'
                  }
                  {selectedLeaveType?.requiresDocumentation && ' • 📄 Documentation required'}
                </small>
                
                {/* Progress bar for visual feedback */}
                {selectedLeaveType && (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressBar}>
                      <div style={{
                        width: `${Math.min((leaveForm.totalDays / selectedLeaveType.maxDays) * 100, 100)}%`,
                        backgroundColor: leaveForm.totalDays > selectedLeaveType.maxDays ? '#dc2626' : selectedLeaveType.color,
                        height: '100%',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <div style={styles.progressText}>
                      <span>{leaveForm.totalDays} / {selectedLeaveType.maxDays} days</span>
                      <span>{Math.round((leaveForm.totalDays / selectedLeaveType.maxDays) * 100)}% of limit</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={leaveForm.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setLeaveForm({
                      ...leaveForm,
                      startDate: newStartDate,
                      // Clear end date if it's before the new start date
                      endDate: leaveForm.endDate && new Date(leaveForm.endDate) < new Date(newStartDate) 
                        ? '' 
                        : leaveForm.endDate
                    });
                    // Recalculate days if both dates are set
                    if (leaveForm.endDate && new Date(leaveForm.endDate) >= new Date(newStartDate)) {
                      calculateDays();
                    }
                  }}
                  style={styles.input}
                  required
                  disabled={loading}
                  min={getTomorrowDate()}
                />
                <small style={styles.helpText}>Select a future date (tomorrow or later)</small>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={leaveForm.endDate}
                  onChange={(e) => {
                    const newEndDate = e.target.value;
                    setLeaveForm({
                      ...leaveForm,
                      endDate: newEndDate
                    });
                    // Recalculate days
                    if (leaveForm.startDate) {
                      const start = new Date(leaveForm.startDate);
                      const end = new Date(newEndDate);
                      if (end >= start) {
                        const diffTime = Math.abs(end - start);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        setLeaveForm(prev => ({ ...prev, totalDays: diffDays }));
                      }
                    }
                  }}
                  style={styles.input}
                  required
                  disabled={loading || !leaveForm.startDate}
                  min={leaveForm.startDate || getTomorrowDate()}
                />
                <small style={styles.helpText}>
                  {leaveForm.startDate 
                    ? `Must be on or after ${formatDate(leaveForm.startDate)}`
                    : 'Select start date first'
                  }
                </small>
                {leaveForm.endDate && leaveForm.startDate && new Date(leaveForm.endDate) < new Date(leaveForm.startDate) && (
                  <small style={{...styles.helpText, color: '#dc2626'}}>
                    End date cannot be before start date
                  </small>
                )}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Reason *</label>
              <textarea
                name="reason"
                value={leaveForm.reason}
                onChange={handleLeaveFormChange}
                style={styles.textarea}
                placeholder="Please provide a reason for your leave"
                rows="4"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={
                loading || 
                !leaveForm.leaveType || 
                !leaveForm.startDate || 
                !leaveForm.endDate || 
                new Date(leaveForm.endDate) < new Date(leaveForm.startDate)
              }
            >
              {loading ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </form>
        </div>
      )}

      {showLeavesList && (
        <div style={styles.leavesSection}>
          <h3>My Leave Applications ({leaves.length})</h3>
          {loadingLeaves ? (
            <p style={styles.loadingText}>Loading leaves...</p>
          ) : leaves.length === 0 ? (
            <p style={styles.placeholder}>No leave applications yet.</p>
          ) : (
            <div style={styles.leavesTable}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Leave Type</th>
                    <th style={styles.th}>Start Date</th>
                    <th style={styles.th}>End Date</th>
                    <th style={styles.th}>Days</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave._id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.leaveTypeCell}>
                          {LEAVE_TYPES.find(t => t.value === leave.leaveType)?.icon || '📄'} {leave.leaveType}
                        </div>
                      </td>
                      <td style={styles.td}>{formatDate(leave.startDate)}</td>
                      <td style={styles.td}>{formatDate(leave.endDate)}</td>
                      <td style={styles.td}>{leave.totalDays}</td>
                      <td style={styles.td}>{leave.reason}</td>
                      <td style={{ ...styles.td, color: getStatusColor(leave.status) }}>
                        {leave.status}
                      </td>
                      <td style={styles.td}>{formatDate(leave.appliedDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    color: '#2563eb',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  welcome: {
    backgroundColor: '#f3f4f6',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  chartColumn: {
    flex: 1,
  },
  section: {
    marginBottom: '2rem',
  },
  successMessage: {
    backgroundColor: '#d1fae5',
    color: '#059669',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  actionButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  leaveFormSection: {
    backgroundColor: '#f8fafc',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '1px solid #e2e8f0',
  },
  leavesSection: {
    backgroundColor: '#f8fafc',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '1px solid #e2e8f0',
  },
  leaveForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
  },
  formGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
    backgroundColor: 'white',
    fontFamily: 'inherit',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  leaveTypeInfo: {
    backgroundColor: '#f0f9ff',
    padding: '10px',
    borderRadius: '6px',
    marginTop: '8px',
    borderLeft: '3px solid #3b82f6'
  },
  progressContainer: {
    marginTop: '8px'
  },
  progressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '4px'
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#6b7280'
  },
  submitButton: {
    backgroundColor: '#059669',
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  placeholder: {
    color: '#666',
    fontStyle: 'italic',
  },
  helpText: {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  },
  loadingText: {
    color: '#666',
    textAlign: 'center',
    padding: '2rem',
  },
  leavesTable: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
  },
  th: {
    backgroundColor: '#e5e7eb',
    padding: '0.75rem',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #d1d5db',
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #e5e7eb',
  },
  tr: {
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
  leaveTypeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

export default Dashboard;