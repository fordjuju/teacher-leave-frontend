import React, { useState } from 'react';
import { reportAPI } from '../../services/api';

const ReportGenerator = ({ onReportGenerated, departments }) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleGenerateReport = async () => {
    if (!filters.startDate && filters.endDate) {
      setError('Please select both start and end dates or leave both empty.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await reportAPI.generateSummaryReport(filters);
      onReportGenerated(response.data.report);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!filters.startDate && filters.endDate) {
      setError('Please select both start and end dates or leave both empty.');
      return;
    }

    setExporting(true);
    setError('');

    try {
      const response = await reportAPI.exportCSV(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leave_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to export report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Generate Report</h3>
      
      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Start Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            style={styles.input}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>End Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            style={styles.input}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Department</label>
          <select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            style={styles.select}
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.helpText}>
        <p>Leave dates empty for all-time report. Select both dates for date range.</p>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.buttonGroup}>
        <button
          onClick={handleGenerateReport}
          style={styles.generateButton}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
        
        <button
          onClick={handleExportCSV}
          style={styles.exportButton}
          disabled={exporting || loading}
        >
          {exporting ? 'Exporting...' : 'Export as CSV'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  title: {
    margin: '0 0 1.5rem 0',
    color: '#374151',
    fontSize: '1.25rem',
    fontWeight: '600',
  },
  filterRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  filterGroup: {
    flex: 1,
    minWidth: '200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontWeight: '500',
    color: '#374151',
    fontSize: '0.875rem',
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
  },
  helpText: {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    fontStyle: 'italic',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  generateButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    flex: 1,
  },
  exportButton: {
    backgroundColor: '#059669',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    flex: 1,
  },
};

export default ReportGenerator;
