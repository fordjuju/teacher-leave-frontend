import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LeaveChart = ({ data, title }) => {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltip}>
          <p style={styles.tooltipLabel}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.chartContainer}>
      <h3 style={styles.chartTitle}>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const styles = {
  chartContainer: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginTop: '1.5rem',
  },
  chartTitle: {
    margin: '0 0 1rem 0',
    color: '#374151',
    fontSize: '1.125rem',
    fontWeight: '600',
  },
  tooltip: {
    backgroundColor: 'white',
    padding: '0.75rem',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
  },
  tooltipLabel: {
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
    color: '#374151',
  },
};

export default LeaveChart;
