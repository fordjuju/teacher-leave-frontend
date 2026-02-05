import React from 'react';

const StatisticsCard = ({ title, value, icon, color, trend }) => {
  return (
    <div style={{ ...styles.card, borderLeft: `4px solid ${color}` }}>
      <div style={styles.header}>
        <div style={{ ...styles.icon, backgroundColor: `${color}20` }}>
          {icon}
        </div>
        <div>
          <h4 style={styles.title}>{title}</h4>
          <h2 style={styles.value}>{value}</h2>
        </div>
      </div>
      {trend && (
        <div style={styles.trend}>
          <span style={{ color: trend > 0 ? '#059669' : '#dc2626' }}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </span>
          <span style={styles.trendText}> from last month</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    flex: 1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.5rem',
  },
  icon: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
  },
  title: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0,
    fontWeight: '500',
  },
  value: {
    fontSize: '1.5rem',
    color: '#111827',
    margin: '0.25rem 0 0 0',
    fontWeight: '600',
  },
  trend: {
    fontSize: '0.875rem',
    marginTop: '0.5rem',
  },
  trendText: {
    color: '#6b7280',
    marginLeft: '0.25rem',
  },
};

export default StatisticsCard;
