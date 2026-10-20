// ============================================================
// FIREBASE — using CDN ES module builds (no bundler needed)
// ============================================================
import { initializeApp }                        from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAnalytics }                         from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp }
                                                from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAijjrZkGPjrMID-DKcttrxLM6EVAS0yK0",
  authDomain:        "verityaccounting.firebaseapp.com",
  databaseURL:       "https://verityaccounting-default-rtdb.firebaseio.com",
  projectId:         "verityaccounting",
  storageBucket:     "verityaccounting.firebasestorage.app",
  messagingSenderId: "361397716284",
  appId:             "1:361397716284:web:6028c0a559b1d52f248a39",
  measurementId:     "G-EBYZQ2SR7F"
};

const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db        = getFirestore(app);

// ============================================================
// MOBILE NAV TOGGLE
// ============================================================
const toggle   = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// ============================================================
// CONSULTATION FORM  (only runs on pages that have the form)
// ============================================================
const form        = document.getElementById('consultForm');
const submitBtn   = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');
const formError   = document.getElementById('formError');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearErrors();
    hideMessages();

    // Gather values
    const firstName    = form.firstName.value.trim();
    const lastName     = form.lastName.value.trim();
    const email        = form.email.value.trim();
    const phone        = form.phone.value.trim();
    const businessName = form.businessName.value.trim();
    const service      = form.service.value;
    const message      = form.message.value.trim();

    // Validate
    let valid = true;

    if (!firstName) {
      showError('firstNameError', 'First name is required.');
      valid = false;
    }
    if (!lastName) {
      showError('lastNameError', 'Last name is required.');
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('emailError', 'Please enter a valid email address.');
      valid = false;
    }
    if (!service) {
      showError('serviceError', 'Please select a service.');
      valid = false;
    }
    if (!message) {
      showError('messageError', 'Please tell us a little about what you need.');
      valid = false;
    }

    if (!valid) return;

    // Submit to Firestore
    setLoading(true);

    try {
      await addDoc(collection(db, 'consultations'), {
        firstName,
        lastName,
        email,
        phone:         phone        || null,
        businessName:  businessName || null,
        service,
        message,
        submittedAt:   serverTimestamp(),
        status:        'new'
      });

      form.reset();
      formSuccess.hidden = false;
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      console.error('Firestore error:', err);
      formError.hidden = false;
      formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
      setLoading(false);
    }
  });
}

// --- Helpers ---
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  document.querySelectorAll('.consult-form__error').forEach(el => el.textContent = '');
}

function hideMessages() {
  if (formSuccess) formSuccess.hidden = true;
  if (formError)   formError.hidden   = true;
}

function setLoading(isLoading) {
  if (!submitBtn) return;
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('loading', isLoading);
}
