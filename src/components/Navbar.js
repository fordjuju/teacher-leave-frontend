import React from 'react';

const Navbar = ({ onNavigate, isAuthenticated, onLogout, user }) => {
  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <h2>Primary school Staff Leave System</h2>
      </div>
      <div style={styles.links}>
        {isAuthenticated ? (
          <>
            <span style={styles.userInfo}>
              <span style={styles.userName}>{user?.name}</span>
              {user?.role === 'admin' && (
                <span style={styles.adminBadge}>ADMIN</span>
              )}
            </span>
            {user?.role === 'admin' ? (
              <button onClick={() => onNavigate('admin-dashboard')} style={styles.link}>
                Admin Dashboard
              </button>
            ) : (
              <button onClick={() => onNavigate('dashboard')} style={styles.link}>
                Dashboard
              </button>
            )}
            <button onClick={onLogout} style={styles.link}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onNavigate('home')} style={styles.link}>
              Home
            </button>
            <button onClick={() => onNavigate('login')} style={styles.link}>
              Login
            </button>
            <button onClick={() => onNavigate('register')} style={styles.link}>
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  links: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  link: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginRight: '1rem',
  },
  userName: {
    fontWeight: '500',
  },
  adminBadge: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
};

export default Navbar;
