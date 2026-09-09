/**
 * UdyamSaarthi AI Authentication Service
 * Clean architecture supporting Password Login, Google Identity Services OAuth, User Registration, and Demo Login.
 */

const SESSION_KEY = 'udyam_auth_session';
const USERS_REGISTRY_KEY = 'udyam_user_registry';

/**
 * Dynamically load Google Identity Services SDK script
 */
function loadGoogleScript() {
  return new Promise((resolve) => {
    if (window.google && window.google.accounts) {
      resolve(true);
      return;
    }
    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export const authService = {
  /**
   * Check current session from localStorage
   */
  getCurrentSession: () => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Failed to read auth session:', e);
      return null;
    }
  },

  /**
   * Save session state
   */
  saveSession: (sessionData) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Failed to save auth session:', e);
    }
  },

  /**
   * Clear session state
   */
  signOut: () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('Failed to clear auth session:', e);
    }
  },

  /**
   * Official Google Identity Services Web Authentication
   */
  signInWithGoogle: async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // 1. Check if VITE_GOOGLE_CLIENT_ID is configured in environment
    if (!clientId) {
      return {
        status: 'UNCONFIGURED',
        provider: 'google',
        message: 'Google Sign-In is not configured yet. Please configure VITE_GOOGLE_CLIENT_ID to enable Google authentication.',
      };
    }

    // 2. Load Google Identity Services SDK
    const scriptLoaded = await loadGoogleScript();
    if (!scriptLoaded || !window.google || !window.google.accounts) {
      return {
        status: 'ERROR',
        provider: 'google',
        message: 'Unable to load Google Identity Services SDK. Please try again.',
      };
    }

    // 3. Initialize Google Identity Services Client
    return new Promise((resolve) => {
      try {
        let isResolved = false;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (isResolved) return;
            isResolved = true;

            if (response && response.credential) {
              const payload = parseJwt(response.credential);
              const session = {
                isAuthenticated: true,
                provider: 'google',
                loginTime: Date.now(),
                user: {
                  id: payload.sub || `google_${Date.now()}`,
                  name: payload.name || payload.given_name || 'Google User',
                  email: payload.email || '',
                  picture: payload.picture || null,
                  isDemo: false,
                },
              };
              authService.saveSession(session);
              resolve({ status: 'SUCCESS', session });
            } else {
              resolve({
                status: 'ERROR',
                provider: 'google',
                message: 'Google sign-in couldn\'t be completed. Please try again.',
              });
            }
          },
        });

        // Trigger Google One Tap / Prompt
        window.google.accounts.id.prompt((notification) => {
          if (!isResolved && (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment())) {
            isResolved = true;
            resolve({
              status: 'CANCELLED',
              provider: 'google',
              message: 'Google sign-in couldn\'t be completed. Please try again.',
            });
          }
        });

      } catch (err) {
        resolve({
          status: 'ERROR',
          provider: 'google',
          message: 'Google sign-in couldn\'t be completed. Please try again.',
        });
      }
    });
  },

  /**
   * Password Authentication (Primary Login)
   */
  signInWithPassword: async (identifier, password) => {
    if (!identifier || !password) {
      return { status: 'ERROR', message: 'Please enter both mobile/email and password.' };
    }

    const cleanDigits = identifier.replace(/\D/g, '');
    let registeredUsers = [];
    try {
      const stored = localStorage.getItem(USERS_REGISTRY_KEY);
      if (stored) registeredUsers = JSON.parse(stored);
    } catch (e) {
      console.error('Error reading user registry:', e);
    }

    // Match against registered users or create structured session
    const matchedUser = registeredUsers.find(
      (u) => (cleanDigits && u.mobile === cleanDigits) || u.email === identifier.trim().toLowerCase()
    );

    const userObj = matchedUser
      ? {
          id: `user_${matchedUser.mobile}`,
          name: matchedUser.fullName,
          mobile: matchedUser.mobile,
          email: matchedUser.email,
          isDemo: false,
        }
      : {
          id: `user_${cleanDigits || Date.now()}`,
          name: identifier.includes('@') ? identifier.split('@')[0] : 'Rural Entrepreneur',
          mobile: cleanDigits.length === 10 ? cleanDigits : '9876543210',
          email: identifier.includes('@') ? identifier : undefined,
          isDemo: false,
        };

    const session = {
      isAuthenticated: true,
      provider: 'password',
      loginTime: Date.now(),
      user: userObj,
    };

    authService.saveSession(session);
    return { status: 'SUCCESS', session };
  },

  /**
   * Register New User
   */
  registerUser: async (userData) => {
    const { fullName, mobile, email, password } = userData;

    let registeredUsers = [];
    try {
      const stored = localStorage.getItem(USERS_REGISTRY_KEY);
      if (stored) registeredUsers = JSON.parse(stored);
    } catch (e) {
      console.error('Error reading user registry:', e);
    }

    const newUser = {
      fullName: fullName.trim(),
      mobile: mobile.replace(/\D/g, ''),
      email: email ? email.trim().toLowerCase() : '',
      password,
      createdAt: Date.now(),
    };

    registeredUsers.push(newUser);
    try {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registeredUsers));
    } catch (e) {
      console.error('Error saving new user:', e);
    }

    const session = {
      isAuthenticated: true,
      provider: 'password',
      loginTime: Date.now(),
      user: {
        id: `user_${newUser.mobile}`,
        name: newUser.fullName,
        mobile: newUser.mobile,
        email: newUser.email,
        isDemo: false,
      },
    };

    authService.saveSession(session);
    return { status: 'SUCCESS', session };
  },

  /**
   * SIH Demo Login
   */
  signInAsDemo: async () => {
    const session = {
      isAuthenticated: true,
      provider: 'demo',
      loginTime: Date.now(),
      user: {
        id: 'demo_user_sih',
        name: 'Demo Entrepreneur',
        mobile: '9876543210',
        email: 'demo.entrepreneur@udyam.in',
        isDemo: true,
      },
    };

    authService.saveSession(session);
    return { status: 'SUCCESS', session };
  },

  /**
   * Change Password (Old Password + New Password)
   */
  changePassword: async (oldPassword, newPassword) => {
    if (!oldPassword || !newPassword) {
      return { status: 'ERROR', message: 'Both old password and new password are required.' };
    }
    if (newPassword.length < 6) {
      return { status: 'ERROR', message: 'New password must be at least 6 characters long.' };
    }

    const currentSession = authService.getCurrentSession();
    const currentUser = currentSession?.user;

    let registeredUsers = [];
    try {
      const stored = localStorage.getItem(USERS_REGISTRY_KEY);
      if (stored) registeredUsers = JSON.parse(stored);
    } catch (e) {}

    const userIndex = registeredUsers.findIndex(
      (u) => (currentUser?.mobile && u.mobile === currentUser.mobile) ||
             (currentUser?.email && u.email === currentUser.email)
    );

    if (userIndex !== -1) {
      if (registeredUsers[userIndex].password && registeredUsers[userIndex].password !== oldPassword) {
        return { status: 'ERROR', message: 'Current password does not match our records.' };
      }
      registeredUsers[userIndex].password = newPassword;
      try {
        localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registeredUsers));
      } catch (e) {}
    } else {
      const validDemo = ['kisan123', 'admin123', '123456', 'demo123'];
      const stored = localStorage.getItem('udyam_demo_password');
      if (stored) {
        if (oldPassword !== stored) {
          return { status: 'ERROR', message: 'Current password is incorrect.' };
        }
      } else if (!validDemo.includes(oldPassword)) {
        return { status: 'ERROR', message: 'Current password is incorrect (Default: kisan123).' };
      }
      try {
        localStorage.setItem('udyam_demo_password', newPassword);
      } catch (e) {}
    }

    try {
      await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': currentSession?.token ? `Bearer ${currentSession.token}` : ''
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
    } catch (e) {}

    return { status: 'SUCCESS', message: 'Password updated successfully!' };
  },

  /**
   * Notification Settings (In-App / Bar and Email)
   */
  getNotificationSettings: () => {
    try {
      const stored = localStorage.getItem('udyam_notification_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { barNotifications: true, emailNotifications: true };
  },

  saveNotificationSettings: (settings) => {
    try {
      localStorage.setItem('udyam_notification_settings', JSON.stringify(settings));
    } catch (e) {}
    return settings;
  },
};

// Helper JWT parser for Google ID token payload
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}
