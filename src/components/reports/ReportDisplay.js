import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ReportDisplay = ({ report }) => {
  if (!report) return null;

  const { summary, departmentStats, monthlyTrend, leaveTypeStats, topTeachers, timePeriod } = report;

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const STATUS_COLORS = {
    'Approved': '#10b981',
    'Pending': '#f59e0b',
    'Rejected': '#ef4444'
  };

  const departmentChartData = departmentStats.map(dept => ({
    name: dept.department,
    Total: dept.total,
    Approved: dept.approved,
    Pending: dept.pending
  }));

  const leaveTypeChartData = leaveTypeStats.map(item => ({
    name: item.type,
    value: item.count
  }));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Leave Report</h2>
        <div style={styles.timePeriod}>
          <span style={styles.periodLabel}>Period:</span>
          <span>{timePeriod.startDate} to {timePeriod.endDate}</span>
          <span style={styles.departmentBadge}>{timePeriod.department}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryTitle}>Total Leaves</h3>
          <div style={styles.summaryValue}>{summary.totalLeaves}</div>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryTitle}>Approved</h3>
          <div style={{...styles.summaryValue, color: STATUS_COLORS.Approved}}>
            {summary.approvedLeaves} ({summary.approvalRate}%)
          </div>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryTitle}>Pending</h3>
          <div style={{...styles.summaryValue, color: STATUS_COLORS.Pending}}>
            {summary.pendingLeaves}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryTitle}>Total Days</h3>
          <div style={styles.summaryValue}>{summary.totalDays} days</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        <div style={styles.chartContainer}>
          <h4>Department Statistics</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total" fill="#3b82f6" />
              <Bar dataKey="Approved" fill="#10b981" />
              <Bar dataKey="Pending" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartContainer}>
          <h4>Leave Type Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leaveTypeChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {leaveTypeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div style={styles.chartContainer}>
        <h4>Monthly Trend</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Teachers Table */}
      <div style={styles.tableContainer}>
        <h4>Top 10 Teachers by Leave Days</h4>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Teacher</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Total Leaves</th>
              <th style={styles.th}>Approved Leaves</th>
              <th style={styles.th}>Total Days</th>
            </tr>
          </thead>
          <tbody>
            {topTeachers.map((teacher, index) => (
              <tr key={index} style={styles.tr}>
                <td style={styles.td}>{teacher.teacher}</td>
                <td style={styles.td}>{teacher.department}</td>
                <td style={styles.td}>{teacher.totalLeaves}</td>
                <td style={styles.td}>{teacher.approvedLeaves}</td>
                <td style={styles.td}>{teacher.totalDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    marginTop: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '1rem',
  },
  timePeriod: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    color: '#6b7280',
  },
  periodLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  departmentBadge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    padding: '1.5rem',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
  },
  summaryTitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: '0 0 0.5rem 0',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '1.5rem',
    color: '#111827',
    fontWeight: '600',
    margin: 0,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  chartContainer: {
    backgroundColor: '#f9fafb',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  tableContainer: {
    marginTop: '2rem',
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
    fontWeight: '600',
    color: '#374151',
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
};

export default ReportDisplay;
