import React from 'react';

const Home = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to Primary school Staff Leave Management System</h1>
      <p style={styles.subtitle}>Manage your leave applications efficiently</p>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    color: '#2563eb',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#666',
    marginBottom: '3rem',
  },
};

export default Home;
