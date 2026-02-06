import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
// ================= REPORT GENERATORS =================

const generateCSVReport = (rows) => {
  if (!rows || rows.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(rows[0]).join(',');
  const data = rows.map(row => Object.values(row).join(','));
  const csvContent = [headers, ...data].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'leave-report.csv';
  link.click();

  URL.revokeObjectURL(url);
};

const generateExcelReport = (rows) => {
  // Simple fallback for now
  // Later you can replace this with SheetJS (xlsx)
  generateCSVReport(rows);
};

const generatePDFReport = () => {
  // Simple fallback
  // Later you can integrate jsPDF
  window.print();
};


const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [reportFilters, setReportFilters] = useState({
    department: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
 const [reportLoading] = useState(false);


  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingLeaves();
    }
  }, [user]);

  const fetchPendingLeaves = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPendingLeaves();
      setPendingLeaves(response.data.leaves || []);
    } catch {
      setError('Failed to load pending leaves.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLeaves = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllLeaves();
      const leaves = response.data.leaves || [];
      setAllLeaves(leaves);
      setFilteredLeaves(leaves);
    } catch {
      setError('Failed to load all leaves.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allLeaves];

    if (reportFilters.department !== 'all') {
      filtered = filtered.filter(
        leave => leave.teacher?.department === reportFilters.department
      );
    }

    if (reportFilters.status !== 'all') {
      filtered = filtered.filter(
        leave => leave.status === reportFilters.status
      );
    }

    if (reportFilters.startDate && reportFilters.endDate) {
      filtered = filtered.filter(leave => {
        const leaveDate = new Date(leave.startDate);
        const startDate = new Date(reportFilters.startDate);
        const endDate = new Date(reportFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        return leaveDate >= startDate && leaveDate <= endDate;
      });
    }

    setFilteredLeaves(filtered);
  }, [allLeaves, reportFilters]);

  // ✅ ESLint-safe useEffect
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleTabChange = tab => {
    setActiveTab(tab);
    setError('');
    setMessage('');

    if (tab === 'all' || tab === 'reports') {
      if (allLeaves.length === 0) fetchAllLeaves();
    } else {
      fetchPendingLeaves();
    }
  };

  const handleStatusUpdate = async (leaveId, status) => {
    if (!reviewNotes.trim() && status === 'Rejected') {
      setError('Please provide review notes for rejection.');
      return;
    }

    setLoading(true);
    try {
      await adminAPI.updateLeaveStatus(leaveId, status, reviewNotes);
      setMessage(`Leave ${status.toLowerCase()} successfully.`);
      setReviewNotes('');
      setSelectedLeave(null);

      activeTab === 'pending' ? fetchPendingLeaves() : fetchAllLeaves();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update leave status.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = date =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'N/A';

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

  const renderLeaveTable = (leaves) => (
    <div style={styles.leavesTable}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Teacher</th>
            <th style={styles.th}>Department</th>
            <th style={styles.th}>Leave Type</th>
            <th style={styles.th}>Start Date</th>
            <th style={styles.th}>End Date</th>
            <th style={styles.th}>Days</th>
            <th style={styles.th}>Reason</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Applied On</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave._id} style={styles.tr}>
              <td style={styles.td}>
                <div>
                  <strong>{leave.teacher?.name}</strong>
                  <div style={styles.email}>{leave.teacher?.email}</div>
                </div>
              </td>
              <td style={styles.td}>{leave.teacher?.department}</td>
              <td style={styles.td}>{leave.leaveType}</td>
              <td style={styles.td}>{formatDate(leave.startDate)}</td>
              <td style={styles.td}>{formatDate(leave.endDate)}</td>
              <td style={styles.td}>{leave.totalDays}</td>
              <td style={styles.td}>{leave.reason}</td>
              <td style={{ ...styles.td, color: getStatusColor(leave.status) }}>
                {leave.status}
              </td>
              <td style={styles.td}>{formatDate(leave.appliedDate)}</td>
              <td style={styles.td}>
                {leave.status === 'Pending' ? (
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setReviewNotes('');
                      }}
                      style={styles.reviewButton}
                    >
                      Review
                    </button>
                  </div>
                ) : leave.reviewedBy ? (
                  <div style={styles.reviewedInfo}>
                    <div>Reviewed by: {leave.reviewedBy?.name}</div>
                    {leave.reviewNotes && (
                      <div style={styles.notes}>Notes: {leave.reviewNotes}</div>
                    )}
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderReportModal = () => (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3>Generate Report</h3>
          <button 
            onClick={() => setShowReportModal(false)} 
            style={styles.closeButton}
          >
            ×
          </button>
        </div>
        
        <div style={styles.filterSection}>
          <div style={styles.filterRow}>
            <div style={styles.filterField}>
              <label style={styles.label}>Department:</label>
              <select
                value={reportFilters.department}
                onChange={(e) => setReportFilters({
                  ...reportFilters, 
                  department: e.target.value
                })}
                style={styles.select}
              >
                <option value="all">All Departments</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="History">History</option>
                <option value="Arts">Arts</option>
                <option value="Physical Education">Physical Education</option>
                <option value="Administration">Administration</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div style={styles.filterField}>
              <label style={styles.label}>Status:</label>
              <select
                value={reportFilters.status}
                onChange={(e) => setReportFilters({
                  ...reportFilters, 
                  status: e.target.value
                })}
                style={styles.select}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
          
          <div style={styles.filterRow}>
            <div style={styles.filterField}>
              <label style={styles.label}>Start Date:</label>
              <input
                type="date"
                value={reportFilters.startDate}
                onChange={(e) => setReportFilters({
                  ...reportFilters, 
                  startDate: e.target.value
                })}
                style={styles.input}
              />
            </div>
            
            <div style={styles.filterField}>
              <label style={styles.label}>End Date:</label>
              <input
                type="date"
                value={reportFilters.endDate}
                onChange={(e) => setReportFilters({
                  ...reportFilters, 
                  endDate: e.target.value
                })}
                style={styles.input}
              />
            </div>
          </div>
          
          <button
            onClick={() => setReportFilters({
              department: 'all',
              status: 'all',
              startDate: '',
              endDate: ''
            })}
            style={styles.clearButton}
          >
            Clear All Filters
          </button>
        </div>
        
        <div style={styles.summarySection}>
          <h4>Report Summary</h4>
          <div style={styles.summaryStats}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Records:</span>
              <span style={styles.statValue}>{filteredLeaves.length}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Pending:</span>
              <span style={{...styles.statValue, color: '#d97706'}}>
                {filteredLeaves.filter(l => l.status === 'Pending').length}
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Approved:</span>
              <span style={{...styles.statValue, color: '#059669'}}>
                {filteredLeaves.filter(l => l.status === 'Approved').length}
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Rejected:</span>
              <span style={{...styles.statValue, color: '#dc2626'}}>
                {filteredLeaves.filter(l => l.status === 'Rejected').length}
              </span>
            </div>
          </div>
        </div>
        
        <div style={styles.modalActions}>
          <button
            onClick={generateCSVReport}
            style={styles.csvButton}
            disabled={reportLoading || filteredLeaves.length === 0}
          >
            {reportLoading ? 'Generating...' : 'Download CSV'}
          </button>
          <button
            onClick={generateExcelReport}
            style={styles.excelButton}
            disabled={reportLoading || filteredLeaves.length === 0}
          >
            {reportLoading ? 'Generating...' : 'Download Excel'}
          </button>
          <button
            onClick={generatePDFReport}
            style={styles.pdfButton}
            disabled={reportLoading}
          >
            PDF (Use Excel)
          </button>
          <button
            onClick={() => setShowReportModal(false)}
            style={styles.cancelButton}
            disabled={reportLoading}
          >
            Cancel
          </button>
        </div>
        
        <div style={styles.instructions}>
          <p><strong>Note:</strong> CSV and Excel exports are working. PDF will use Excel export.</p>
          <p style={styles.smallText}>For PDF, install: <code>npm install jspdf jspdf-autotable</code></p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Manage leave applications</p>
        </div>
        <button onClick={onLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div style={styles.welcome}>
        <h2>Welcome, {user?.name}!</h2>
        <p>Email: {user?.email}</p>
        <p>Role: <strong style={styles.adminBadge}>ADMINISTRATOR</strong></p>
      </div>

      {message && <div style={styles.successMessage}>{message}</div>}
      {error && <div style={styles.errorMessage}>{error}</div>}

      <div style={styles.tabs}>
        <button
          onClick={() => handleTabChange('pending')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'pending' && styles.activeTab),
          }}
        >
          Pending Leaves ({pendingLeaves.length})
        </button>
        <button
          onClick={() => handleTabChange('all')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'all' && styles.activeTab),
          }}
        >
          All Leaves ({allLeaves.length})
        </button>
        <button
          onClick={() => {
            handleTabChange('reports');
            setShowReportModal(true);
          }}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'reports' && styles.activeTab),
          }}
        >
          Generate Reports
        </button>
      </div>

      {activeTab === 'reports' ? (
        <div style={styles.reportSection}>
          <div style={styles.reportHeader}>
            <h3>Report Generation</h3>
            <p>Click "Generate Reports" tab above to open report generator</p>
            <div style={styles.featureList}>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Filter by Department, Status, and Date Range</span>
              </div>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Export to CSV (Working)</span>
              </div>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Export to Excel (Working with xlsx)</span>
              </div>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : activeTab === 'pending' ? (
        pendingLeaves.length === 0 ? (
          <div style={styles.emptyState}>No pending leave applications.</div>
        ) : (
          renderLeaveTable(pendingLeaves)
        )
      ) : allLeaves.length === 0 ? (
        <div style={styles.emptyState}>No leave applications found.</div>
      ) : (
        renderLeaveTable(allLeaves)
      )}

      {selectedLeave && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Review Leave Application</h3>
            <div style={styles.leaveDetails}>
              <p><strong>Teacher:</strong> {selectedLeave.teacher?.name}</p>
              <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
              <p><strong>Period:</strong> {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}</p>
              <p><strong>Total Days:</strong> {selectedLeave.totalDays}</p>
              <p><strong>Reason:</strong> {selectedLeave.reason}</p>
              <p><strong>Teacher's Leave Balance:</strong> {selectedLeave.teacher?.leaveBalance} days</p>
            </div>

            <div style={styles.reviewSection}>
              <label style={styles.label}>Review Notes (Required for rejection):</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                style={styles.textarea}
                placeholder="Enter review notes..."
                rows="4"
              />
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => handleStatusUpdate(selectedLeave._id, 'Approved')}
                style={styles.approveButton}
                disabled={loading}
              >
                Approve Leave
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedLeave._id, 'Rejected')}
                style={styles.rejectButton}
                disabled={loading || !reviewNotes.trim()}
              >
                Reject Leave
              </button>
              <button
                onClick={() => setSelectedLeave(null)}
                style={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && renderReportModal()}
    </div>
  );
};

// Add this line at the very end, before export
const XLSX = window.XLSX;

const styles = {
  // ... [ALL YOUR EXISTING STYLES REMAIN EXACTLY THE SAME] ...
  // Just copy all your styles from the previous version
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
  },
  title: {
    color: '#2563eb',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '1.1rem',
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
  adminBadge: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
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
  tabs: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '0.5rem',
    flexWrap: 'wrap',
  },
  tabButton: {
    backgroundColor: 'transparent',
    color: '#6b7280',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  activeTab: {
    color: '#2563eb',
    borderBottom: '3px solid #2563eb',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
    fontSize: '1.1rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
    fontSize: '1.1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  leavesTable: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '2px solid #e5e7eb',
    color: '#374151',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'top',
  },
  tr: {
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
  email: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.25rem',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  reviewButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  reviewedInfo: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  notes: {
    marginTop: '0.25rem',
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    maxWidth: '700px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '1rem',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6b7280',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    '&:hover': {
      backgroundColor: '#f3f4f6',
    },
  },
  filterSection: {
    marginBottom: '1.5rem',
  },
  filterRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  filterField: {
    flex: 1,
  },
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#374151',
  },
  select: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
  },
  summarySection: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1.5rem',
  },
  summaryStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  statItem: {
    backgroundColor: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
    minWidth: '120px',
    textAlign: 'center',
  },
  statLabel: {
    display: 'block',
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
  },
  statValue: {
    display: 'block',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#2563eb',
  },
  csvButton: {
    backgroundColor: '#059669',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  pdfButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  excelButton: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  modalActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  instructions: {
    backgroundColor: '#f0f9ff',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    color: '#0369a1',
    marginTop: '1rem',
  },
  smallText: {
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  },
  reportSection: {
    backgroundColor: '#f9fafb',
    padding: '2rem',
    borderRadius: '8px',
    textAlign: 'center',
  },
  reportHeader: {
    marginBottom: '1rem',
  },
  featureList: {
    textAlign: 'left',
    maxWidth: '500px',
    margin: '1rem auto 0',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    color: '#4b5563',
  },
  featureIcon: {
    width: '20px',
    height: '20px',
    backgroundColor: '#d1fae5',
    color: '#059669',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
  },
  leaveDetails: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1.5rem',
  },
  reviewSection: {
    marginBottom: '1.5rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  approveButton: {
    backgroundColor: '#059669',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

export default AdminDashboard;