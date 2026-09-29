/**
 * ClayVista - Authentication Script (auth.js)
 * Login, Registration, Forgot Password OTP flow, Demo credentials quick-fill
 */

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
  initForgotPasswordFlow();
  initDemoCredentials();
});

// 1. User Login
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';

    try {
      const res = await fetch(`${ClayVista.apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('clayvista_token', data.token);
        localStorage.setItem('clayvista_user', JSON.stringify(data.user));
        showToast('Signed in successfully! Welcome back.', 'success');

        setTimeout(() => {
          if (data.user.role === 'admin') {
            window.location.href = '/admin/index.html';
          } else {
            // Check if there was a redirect URL
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get('redirect') || '/user-dashboard.html';
            window.location.href = redirect;
          }
        }, 800);
      } else {
        showToast(data.message || 'Invalid email or password', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    } catch (err) {
      showToast('Login server error. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}

// 2. User Registration
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPass = document.getElementById('reg-confirm-password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (password !== confirmPass) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
      const res = await fetch(`${ClayVista.apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('clayvista_token', data.token);
        localStorage.setItem('clayvista_user', JSON.stringify(data.user));
        showToast('Account created successfully! Welcome to ClayVista.', 'success');
        setTimeout(() => {
          window.location.href = '/user-dashboard.html';
        }, 1000);
      } else {
        showToast(data.message || 'Registration failed', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    } catch (err) {
      showToast('Server error during registration', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}

// 3. Forgot Password & OTP Verification
function initForgotPasswordFlow() {
  // Step 1: Send OTP
  const forgotForm = document.getElementById('forgot-password-form');
  const otpForm = document.getElementById('verify-otp-form');
  const resetForm = document.getElementById('reset-password-form');

  let resetEmail = '';

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      if (!email) return;

      const submitBtn = forgotForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending OTP...';

      try {
        const res = await fetch(`${ClayVista.apiBase}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (data.success) {
          resetEmail = email;
          showToast(data.message || 'OTP dispatched to your email', 'success');
          forgotForm.style.display = 'none';
          if (otpForm) {
            otpForm.style.display = 'block';
            document.getElementById('otp-target-email').textContent = email;
          }
        } else {
          showToast(data.message, 'error');
        }
      } catch (err) {
        showToast('Failed to send OTP code', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Verification Code';
      }
    });
  }

  // Step 2: Verify OTP & Enter New Password
  let verifiedOTP = '';
  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const otp = document.getElementById('otp-code-input').value.trim();
      if (otp.length < 4) {
        showToast('Please enter the 6-digit OTP.', 'error');
        return;
      }

      try {
        const res = await fetch(`${ClayVista.apiBase}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail, otp })
        });
        const data = await res.json();

        if (data.success) {
          verifiedOTP = otp;
          showToast('Code verified! Set your new password.', 'success');
          otpForm.style.display = 'none';
          if (resetForm) resetForm.style.display = 'block';
        } else {
          showToast(data.message || 'Invalid or expired OTP', 'error');
        }
      } catch (err) {
        showToast('Verification failed', 'error');
      }
    });
  }

  // Step 3: Reset to New Password
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('reset-new-password').value;
      const confirmPass = document.getElementById('reset-confirm-password').value;

      if (newPassword !== confirmPass) {
        showToast('Passwords do not match', 'error');
        return;
      }

      try {
        const res = await fetch(`${ClayVista.apiBase}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: resetEmail,
            otp: verifiedOTP,
            newPassword
          })
        });
        const data = await res.json();

        if (data.success) {
          showToast('Password reset! You are now logged in.', 'success');
          localStorage.setItem('clayvista_token', data.token);
          localStorage.setItem('clayvista_user', JSON.stringify(data.user));
          setTimeout(() => (window.location.href = '/user-dashboard.html'), 1000);
        } else {
          showToast(data.message || 'Reset failed', 'error');
        }
      } catch (err) {
        showToast('Error resetting password', 'error');
      }
    });
  }
}

// 4. One-Click Demo Credentials Quick Fill
function initDemoCredentials() {
  const fillCustomerBtn = document.getElementById('fill-demo-customer');
  const fillAdminBtn = document.getElementById('fill-demo-admin');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');

  if (fillCustomerBtn && emailInput && passInput) {
    fillCustomerBtn.addEventListener('click', () => {
      emailInput.value = 'customer@clayvista.com';
      passInput.value = 'Customer@12345';
      showToast('Loaded Demo Customer credentials (Priya Sharma)', 'info');
    });
  }

  if (fillAdminBtn && emailInput && passInput) {
    fillAdminBtn.addEventListener('click', () => {
      emailInput.value = 'admin@clayvista.com';
      passInput.value = 'Admin@12345';
      showToast('Loaded Master Admin credentials', 'info');
    });
  }
}
