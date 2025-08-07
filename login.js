import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBT0GAKu5lf7FGAm6ke30LkB9eKJMPzfgo",
  authDomain: "expense-tracker-ba256.firebaseapp.com",
  projectId: "expense-tracker-ba256",
  storageBucket: "expense-tracker-ba256.firebasestorage.app",
  messagingSenderId: "356012048141",
  appId: "1:356012048141:web:1844bf126a742523acfa44",
  measurementId: "G-4SRG49YJCZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginSuccess = document.getElementById('loginSuccess');
const resetPasswordLink = document.getElementById('resetPasswordLink');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  loginSuccess.classList.add('hidden');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginSuccess.textContent = 'Login successful! Redirecting...';
    loginSuccess.classList.remove('hidden');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 900);
  } catch (err) {
    loginError.textContent = err.message.replace('Firebase: ', '');
    loginError.classList.remove('hidden');
  }
});

resetPasswordLink.addEventListener('click', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  loginSuccess.classList.add('hidden');
  const email = document.getElementById('email').value.trim();
  if (!email) {
    loginError.textContent = 'Please enter your email above to reset password.';
    loginError.classList.remove('hidden');
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    loginSuccess.textContent = 'Password reset email sent! Check your inbox.';
    loginSuccess.classList.remove('hidden');
  } catch (err) {
    loginError.textContent = err.message.replace('Firebase: ', '');
    loginError.classList.remove('hidden');
  }
});