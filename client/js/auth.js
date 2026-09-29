/**
 * ClayVista - Luxury Authentication & Password Recovery Controller
 * Supports dual Email & Mobile Phone login, 6-digit OTP recovery,
 * password visibility toggling, password strength analytics, and demo evaluation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
  initForgotPasswordFlow();
  initDemoCredentials();
  initPasswordToggles();
});

// Helper to get safe API base
function getApiBase() {
  return (window.ClayVista && window.ClayVista.apiBase) || '/api';
}

// -------------------------------------------------------------
// 1. Password Visibility Eye Toggles
// -------------------------------------------------------------
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle-btn');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.auth-input-wrap');
      if (!wrap) return;
      const input = wrap.querySelector('input');
      if (!input) return;

      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';

      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');

      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPass ? 'none' : 'block';
        eyeClosed.style.display = isPass ? 'block' : 'none';
      }
    });
  });
}

// -------------------------------------------------------------
// 2. User Sign In (Supports Email OR Mobile Number)
// -------------------------------------------------------------
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const identifierInput = document.getElementById('login-identifier');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = identifierInput ? identifierInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!identifier || !password) {
      if (typeof showToast === 'function') {
        showToast('Please enter both your email/phone and password.', 'error');
      } else {
        alert('Please enter both your email/phone and password.');
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner"></span> Authenticating...';

    try {
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('clayvista_token', data.token);
        localStorage.setItem('clayvista_user', JSON.stringify(data.user));

        if (typeof showToast === 'function') {
          showToast(`Welcome back, ${data.user.name || 'Connoisseur'}!`, 'success');
        }

        setTimeout(() => {
          if (data.user.role === 'admin') {
            window.location.href = '/admin/index.html';
          } else {
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get('redirect') || '/user-dashboard.html';
            window.location.href = redirect;
          }
        }, 600);
      } else {
        if (typeof showToast === 'function') {
          showToast(data.message || 'Invalid credentials. Please verify your details.', 'error');
        } else {
          alert(data.message || 'Invalid credentials.');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    } catch (err) {
      console.error('Login error:', err);
      if (typeof showToast === 'function') {
        showToast('Unable to connect to authentication server.', 'error');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}

// -------------------------------------------------------------
// 3. One-Click Demo Credentials Quick Fillers
// -------------------------------------------------------------
function initDemoCredentials() {
  const loginIdentifier = document.getElementById('login-identifier');
  const loginPassword = document.getElementById('login-password');

  // Customer (Email)
  const btnCustomer = document.getElementById('fill-demo-customer');
  if (btnCustomer && loginIdentifier && loginPassword) {
    btnCustomer.addEventListener('click', () => {
      loginIdentifier.value = 'customer@clayvista.com';
      loginPassword.value = 'Customer@12345';
      if (typeof showToast === 'function') {
        showToast('Loaded Demo Customer credentials (Priya Sharma)', 'info');
      }
    });
  }

  // Customer (Mobile)
  const btnCustomerPhone = document.getElementById('fill-demo-customer-phone');
  if (btnCustomerPhone && loginIdentifier && loginPassword) {
    btnCustomerPhone.addEventListener('click', () => {
      loginIdentifier.value = '+91 98111 22334';
      loginPassword.value = 'Customer@12345';
      if (typeof showToast === 'function') {
        showToast('Loaded Demo Mobile (+91 98111 22334)', 'info');
      }
    });
  }

  // Master Admin
  const btnAdmin = document.getElementById('fill-demo-admin');
  if (btnAdmin && loginIdentifier && loginPassword) {
    btnAdmin.addEventListener('click', () => {
      loginIdentifier.value = 'admin@clayvista.com';
      loginPassword.value = 'Admin@12345';
      if (typeof showToast === 'function') {
        showToast('Loaded Master Admin credentials', 'info');
      }
    });
  }

  // Forgot password quick testers
  const forgotIdentifier = document.getElementById('forgot-identifier');
  const btnForgotEmail = document.getElementById('fill-forgot-email');
  const btnForgotPhone = document.getElementById('fill-forgot-phone');
  const tabEmail = document.getElementById('tab-channel-email');
  const tabSms = document.getElementById('tab-channel-sms');

  if (btnForgotEmail && forgotIdentifier) {
    btnForgotEmail.addEventListener('click', () => {
      if (tabEmail) tabEmail.click();
      forgotIdentifier.value = 'customer@clayvista.com';
      if (typeof showToast === 'function') {
        showToast('Loaded demo email (customer@clayvista.com)', 'info');
      }
    });
  }

  if (btnForgotPhone && forgotIdentifier) {
    btnForgotPhone.addEventListener('click', () => {
      if (tabSms) tabSms.click();
      forgotIdentifier.value = '+91 98111 22334';
      if (typeof showToast === 'function') {
        showToast('Loaded demo mobile (+91 98111 22334)', 'info');
      }
    });
  }
}

// -------------------------------------------------------------
// 4. Interactive 3-Step Forgot Password & OTP Flow
// -------------------------------------------------------------
function initForgotPasswordFlow() {
  const step1Container = document.getElementById('forgot-step-1');
  const step2Container = document.getElementById('forgot-step-2');
  const step3Container = document.getElementById('forgot-step-3');

  if (!step1Container) return;

  const tabEmail = document.getElementById('tab-channel-email');
  const tabSms = document.getElementById('tab-channel-sms');
  const identifierInput = document.getElementById('forgot-identifier');
  const inputLabel = document.getElementById('identifier-input-label');
  const inputIcon = document.getElementById('identifier-input-icon');

  let selectedChannel = 'email';
  let activeIdentifier = '';
  let verifiedOTPCode = '';
  let resendInterval = null;

  // Toggle Email vs Mobile channel tabs
  if (tabEmail && tabSms) {
    tabEmail.addEventListener('click', () => {
      selectedChannel = 'email';
      tabEmail.classList.add('active');
      tabEmail.setAttribute('aria-selected', 'true');
      tabSms.classList.remove('active');
      tabSms.setAttribute('aria-selected', 'false');

      if (inputLabel) inputLabel.textContent = 'Registered Email Address *';
      if (identifierInput) {
        identifierInput.placeholder = 'customer@clayvista.com';
        identifierInput.type = 'email';
      }
      if (inputIcon) {
        inputIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>';
      }
    });

    tabSms.addEventListener('click', () => {
      selectedChannel = 'sms';
      tabSms.classList.add('active');
      tabSms.setAttribute('aria-selected', 'true');
      tabEmail.classList.remove('active');
      tabEmail.setAttribute('aria-selected', 'false');

      if (inputLabel) inputLabel.textContent = 'Registered Mobile Phone Number *';
      if (identifierInput) {
        identifierInput.placeholder = '+91 98111 22334 or 9811122334';
        identifierInput.type = 'tel';
      }
      if (inputIcon) {
        inputIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>';
      }
    });
  }

  // Stepper Indicator Helper
  function setStepper(stepNumber) {
    const s1 = document.getElementById('step-indicator-1');
    const s2 = document.getElementById('step-indicator-2');
    const s3 = document.getElementById('step-indicator-3');

    [s1, s2, s3].forEach((s) => s && s.classList.remove('active', 'completed'));

    if (stepNumber === 1) {
      if (s1) s1.classList.add('active');
    } else if (stepNumber === 2) {
      if (s1) s1.classList.add('completed');
      if (s2) s2.classList.add('active');
    } else if (stepNumber === 3) {
      if (s1) s1.classList.add('completed');
      if (s2) s2.classList.add('completed');
      if (s3) s3.classList.add('active');
    }
  }

  // Resend Timer (60s countdown)
  function startResendTimer() {
    clearInterval(resendInterval);
    let secondsLeft = 60;
    const countdownEl = document.getElementById('resend-countdown-text');
    const secondsEl = document.getElementById('resend-timer-seconds');
    const resendBtn = document.getElementById('btn-resend-otp');

    if (countdownEl) countdownEl.style.display = 'inline';
    if (resendBtn) resendBtn.style.display = 'none';
    if (secondsEl) secondsEl.textContent = secondsLeft;

    resendInterval = setInterval(() => {
      secondsLeft--;
      if (secondsEl) secondsEl.textContent = secondsLeft;
      if (secondsLeft <= 0) {
        clearInterval(resendInterval);
        if (countdownEl) countdownEl.style.display = 'none';
        if (resendBtn) resendBtn.style.display = 'inline';
      }
    }, 1000);
  }

  // Resend Button Action
  const btnResend = document.getElementById('btn-resend-otp');
  if (btnResend) {
    btnResend.addEventListener('click', async () => {
      btnResend.disabled = true;
      btnResend.textContent = 'Dispatching new OTP...';
      try {
        const res = await fetch(`${getApiBase()}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: activeIdentifier, channel: selectedChannel })
        });
        const data = await res.json();
        if (data.success) {
          if (typeof showToast === 'function') {
            showToast('New 6-digit OTP dispatched successfully!', 'success');
          }
          if (data.demoOtp) {
            const demoEl = document.getElementById('demo-otp-helper');
            const codeEl = document.getElementById('demo-otp-code');
            if (demoEl && codeEl) {
              codeEl.textContent = data.demoOtp;
              demoEl.style.display = 'block';
            }
          }
          startResendTimer();
        } else {
          if (typeof showToast === 'function') showToast(data.message, 'error');
        }
      } catch (err) {
        if (typeof showToast === 'function') showToast('Failed to resend code', 'error');
      } finally {
        btnResend.disabled = false;
        btnResend.textContent = 'Resend Verification Code Now';
      }
    });
  }

  // Change Identifier (back to step 1)
  const changeBtn = document.getElementById('change-destination-btn');
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      step2Container.style.display = 'none';
      step1Container.style.display = 'block';
      setStepper(1);
    });
  }

  // ---------------------------------------------------------
  // STEP 1 SUBMISSION: Request OTP
  // ---------------------------------------------------------
  const requestForm = document.getElementById('request-otp-form');
  const btnSendOtp = document.getElementById('btn-send-otp');

  if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = identifierInput ? identifierInput.value.trim() : '';

      if (!identifier) {
        if (typeof showToast === 'function') showToast('Please enter your email or mobile number.', 'error');
        return;
      }

      btnSendOtp.disabled = true;
      btnSendOtp.innerHTML = '<span class="btn-spinner"></span> Dispatching Code...';

      try {
        const res = await fetch(`${getApiBase()}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, channel: selectedChannel })
        });
        const data = await res.json();

        if (data.success) {
          activeIdentifier = identifier;
          if (typeof showToast === 'function') {
            showToast(data.message || 'Verification code dispatched successfully!', 'success');
          }

          // Populate destination text
          const targetEl = document.getElementById('target-destination-text');
          if (targetEl) targetEl.textContent = data.destination || identifier;

          // If in development mode, reveal helper code
          if (data.demoOtp) {
            const demoEl = document.getElementById('demo-otp-helper');
            const codeEl = document.getElementById('demo-otp-code');
            if (demoEl && codeEl) {
              codeEl.textContent = data.demoOtp;
              demoEl.style.display = 'block';
            }
          }

          // Move to Step 2
          step1Container.style.display = 'none';
          step2Container.style.display = 'block';
          setStepper(2);
          startResendTimer();

          // Focus first digit box
          const firstBox = document.querySelector('.otp-box');
          if (firstBox) firstBox.focus();
        } else {
          if (typeof showToast === 'function') {
            showToast(data.message || 'No registered account found.', 'error');
          } else {
            alert(data.message);
          }
        }
      } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Failed to contact verification server.', 'error');
      } finally {
        btnSendOtp.disabled = false;
        btnSendOtp.textContent = 'Send 6-Digit Verification Code';
      }
    });
  }

  // ---------------------------------------------------------
  // STEP 2 OTP DIGIT BOXES LOGIC
  // ---------------------------------------------------------
  const otpBoxes = Array.from(document.querySelectorAll('.otp-box'));
  otpBoxes.forEach((box, index) => {
    // Typing single digit
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      box.value = val ? val[val.length - 1] : '';

      if (box.value && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });

    // Backspace navigation
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!box.value && index > 0) {
          otpBoxes[index - 1].focus();
          otpBoxes[index - 1].value = '';
        }
      }
    });

    // Handle full paste
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (pasteData) {
        for (let i = 0; i < otpBoxes.length; i++) {
          otpBoxes[i].value = pasteData[i] || '';
        }
        const lastFilled = Math.min(pasteData.length, otpBoxes.length) - 1;
        if (lastFilled >= 0 && otpBoxes[lastFilled]) {
          otpBoxes[lastFilled].focus();
        }
      }
    });
  });

  // Auto-Fill Demo OTP button
  const btnAutoFill = document.getElementById('btn-autofill-otp');
  const demoCodeEl = document.getElementById('demo-otp-code');
  if (btnAutoFill && demoCodeEl) {
    btnAutoFill.addEventListener('click', () => {
      const code = demoCodeEl.textContent.trim();
      if (code && code.length >= 6) {
        for (let i = 0; i < 6; i++) {
          if (otpBoxes[i]) otpBoxes[i].value = code[i] || '';
        }
        if (typeof showToast === 'function') {
          showToast('Code auto-filled into verification boxes!', 'info');
        }
      }
    });
  }

  // ---------------------------------------------------------
  // STEP 2 SUBMISSION: Verify OTP
  // ---------------------------------------------------------
  const verifyForm = document.getElementById('verify-otp-form');
  const btnVerifyOtp = document.getElementById('btn-verify-otp');

  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const enteredOtp = otpBoxes.map((b) => b.value).join('').trim();

      if (enteredOtp.length < 6) {
        if (typeof showToast === 'function') {
          showToast('Please enter the complete 6-digit code.', 'error');
        }
        return;
      }

      btnVerifyOtp.disabled = true;
      btnVerifyOtp.innerHTML = '<span class="btn-spinner"></span> Verifying Code...';

      try {
        const res = await fetch(`${getApiBase()}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: activeIdentifier, otp: enteredOtp })
        });
        const data = await res.json();

        if (data.success) {
          verifiedOTPCode = enteredOtp;
          clearInterval(resendInterval);

          if (typeof showToast === 'function') {
            showToast('Code verified successfully! Choose your new password.', 'success');
          }

          // Move to Step 3
          step2Container.style.display = 'none';
          step3Container.style.display = 'block';
          setStepper(3);

          const newPassInput = document.getElementById('reset-new-password');
          if (newPassInput) newPassInput.focus();
        } else {
          if (typeof showToast === 'function') {
            showToast(data.message || 'Invalid or expired OTP code.', 'error');
          } else {
            alert(data.message);
          }
        }
      } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Error during code verification.', 'error');
      } finally {
        btnVerifyOtp.disabled = false;
        btnVerifyOtp.textContent = 'Verify Code & Continue';
      }
    });
  }

  // ---------------------------------------------------------
  // STEP 3 PASSWORD STRENGTH ANALYZER
  // ---------------------------------------------------------
  const newPassInput = document.getElementById('reset-new-password');
  const confirmPassInput = document.getElementById('reset-confirm-password');
  const bar1 = document.getElementById('pwd-bar-1');
  const bar2 = document.getElementById('pwd-bar-2');
  const bar3 = document.getElementById('pwd-bar-3');
  const bar4 = document.getElementById('pwd-bar-4');
  const strengthLabel = document.getElementById('pwd-strength-label');

  if (newPassInput) {
    newPassInput.addEventListener('input', () => {
      const val = newPassInput.value;
      let score = 0;

      if (val.length >= 6) score++;
      if (val.length >= 9) score++;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
      if (/\d/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

      const bars = [bar1, bar2, bar3, bar4];
      bars.forEach((b) => {
        if (b) b.style.backgroundColor = 'var(--color-border)';
      });

      const colors = ['#E53935', '#FB8C00', '#FDD835', '#43A047'];
      const textLabels = ['Too weak', 'Fair', 'Strong', 'Excellent security'];

      for (let i = 0; i < score; i++) {
        if (bars[i]) bars[i].style.backgroundColor = colors[score - 1];
      }

      if (strengthLabel) {
        strengthLabel.textContent = val.length === 0
          ? 'Password strength: Minimum 6 characters'
          : `Security Level: ${textLabels[score - 1] || 'Too weak'}`;
        strengthLabel.style.color = colors[score - 1] || 'var(--color-text-muted)';
      }
    });
  }

  // ---------------------------------------------------------
  // STEP 3 SUBMISSION: Reset Password
  // ---------------------------------------------------------
  const resetForm = document.getElementById('reset-password-form');
  const btnResetPassword = document.getElementById('btn-reset-password');

  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = newPassInput ? newPassInput.value : '';
      const confirmPassword = confirmPassInput ? confirmPassInput.value : '';

      if (newPassword.length < 6) {
        if (typeof showToast === 'function') {
          showToast('Password must be at least 6 characters long.', 'error');
        }
        return;
      }

      if (newPassword !== confirmPassword) {
        if (typeof showToast === 'function') {
          showToast('Passwords do not match. Please verify.', 'error');
        }
        return;
      }

      btnResetPassword.disabled = true;
      btnResetPassword.innerHTML = '<span class="btn-spinner"></span> Updating Password...';

      try {
        const res = await fetch(`${getApiBase()}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: activeIdentifier,
            otp: verifiedOTPCode,
            newPassword
          })
        });
        const data = await res.json();

        if (data.success) {
          if (data.token) {
            localStorage.setItem('clayvista_token', data.token);
            localStorage.setItem('clayvista_user', JSON.stringify(data.user));
          }

          if (typeof showToast === 'function') {
            showToast('Password updated! Redirecting to your account...', 'success');
          }

          setTimeout(() => {
            window.location.href = '/user-dashboard.html';
          }, 1000);
        } else {
          if (typeof showToast === 'function') {
            showToast(data.message || 'Failed to update password.', 'error');
          }
          btnResetPassword.disabled = false;
          btnResetPassword.textContent = 'Update Password & Sign In';
        }
      } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Server connection error.', 'error');
        btnResetPassword.disabled = false;
        btnResetPassword.textContent = 'Update Password & Sign In';
      }
    });
  }
}

// -------------------------------------------------------------
// 5. User Registration Form
// -------------------------------------------------------------
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone') ? document.getElementById('reg-phone').value.trim() : '';
    const password = document.getElementById('reg-password').value;
    const confirmPass = document.getElementById('reg-confirm-password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (password !== confirmPass) {
      if (typeof showToast === 'function') showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      if (typeof showToast === 'function') showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner"></span> Creating Account...';

    try {
      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('clayvista_token', data.token);
        localStorage.setItem('clayvista_user', JSON.stringify(data.user));
        if (typeof showToast === 'function') {
          showToast('Account created successfully! Welcome to ClayVista.', 'success');
        }
        setTimeout(() => {
          window.location.href = '/user-dashboard.html';
        }, 800);
      } else {
        if (typeof showToast === 'function') showToast(data.message || 'Registration failed', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    } catch (err) {
      if (typeof showToast === 'function') showToast('Server error during registration', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}
