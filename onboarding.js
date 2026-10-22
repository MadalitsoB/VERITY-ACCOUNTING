import { initializeApp }     from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
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

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Mobile nav ──────────────────────────────────────────────
const toggle   = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
    toggle.classList.remove('open');
    navLinks.classList.remove('open');
  }));
}

// ── Step navigation ──────────────────────────────────────────
let currentStep = 1;

window.goToStep = function(step) {
  // Validate current step before advancing
  if (step > currentStep && !validateStep(currentStep)) return;

  // If going to step 4, populate the review
  if (step === 4) populateReview();

  document.getElementById(`panel${currentStep}`).classList.remove('active');
  document.getElementById(`panel${step}`).classList.add('active');

  // Update step indicators
  document.querySelectorAll('.ob-step').forEach(el => {
    const n = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (n === step)  el.classList.add('active');
    if (n < step)    el.classList.add('done');
  });

  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Validation ───────────────────────────────────────────────
function validateStep(step) {
  clearErrors();
  let ok = true;
  const f = document.getElementById('onboardingForm');

  if (step === 1) {
    if (!f.firstName.value.trim())  { showErr('err_firstName', 'First name is required.');     ok = false; }
    if (!f.lastName.value.trim())   { showErr('err_lastName',  'Last name is required.');      ok = false; }
    if (!f.idNumber.value.trim() || f.idNumber.value.trim().length !== 13)
                                    { showErr('err_idNumber',  'Please enter a valid 13-digit SA ID number.'); ok = false; }
    if (!f.dob.value)               { showErr('err_dob',       'Date of birth is required.');  ok = false; }
    if (!f.email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value))
                                    { showErr('err_email',     'Please enter a valid email address.'); ok = false; }
    if (!f.phone.value.trim())      { showErr('err_phone',     'Phone number is required.');   ok = false; }
    if (!f.address.value.trim())    { showErr('err_address',   'Residential address is required.'); ok = false; }
  }

  if (step === 2) {
    if (!f.bizName.value.trim())    { showErr('err_bizName',  'Business name is required.');   ok = false; }
    if (!f.bizType.value)           { showErr('err_bizType',  'Please select a business type.'); ok = false; }
    if (!f.industry.value)          { showErr('err_industry', 'Please select an industry.');   ok = false; }
  }

  if (step === 3) {
    const checked = [...document.querySelectorAll('input[name="services"]:checked')];
    if (checked.length === 0) { showErr('err_services', 'Please select at least one service.'); ok = false; }
  }

  return ok;
}

// ── Review panel ─────────────────────────────────────────────
function populateReview() {
  const f = document.getElementById('onboardingForm');
  const services = [...document.querySelectorAll('input[name="services"]:checked')].map(c => c.value);

  const rows = [
    { section: 'Personal Details' },
    { label: 'Name',            value: `${f.title.value ? f.title.value + ' ' : ''}${f.firstName.value} ${f.lastName.value}` },
    { label: 'ID Number',       value: f.idNumber.value },
    { label: 'Date of Birth',   value: f.dob.value },
    { label: 'Email',           value: f.email.value },
    { label: 'Phone',           value: f.phone.value },
    { label: 'Address',         value: f.address.value },
    { section: 'Business Information' },
    { label: 'Business Name',   value: f.bizName.value || 'N/A' },
    { label: 'Trading Name',    value: f.tradingName.value || 'N/A' },
    { label: 'Reg. Number',     value: f.regNumber.value || 'N/A' },
    { label: 'VAT Number',      value: f.vatNumber.value || 'N/A' },
    { label: 'Business Type',   value: f.bizType.value || 'N/A' },
    { label: 'Industry',        value: f.industry.value || 'N/A' },
    { label: 'Employees',       value: f.employees.value || 'N/A' },
    { label: 'Year End',        value: f.financialYearEnd.value || 'N/A' },
    { label: 'Current Software',value: f.currentSoftware.value || 'N/A' },
    { section: 'Services Required' },
    { label: 'Services',        value: services.length ? services.join(', ') : 'None selected' },
    { label: 'Start Date',      value: f.startDate.value || 'Not specified' },
    { label: 'Notes',           value: f.additionalNotes.value || 'None' },
    { label: 'How did you hear',value: f.hearAboutUs.value || 'Not specified' },
  ];

  const container = document.getElementById('obReview');
  container.innerHTML = rows.map(row => {
    if (row.section) return `<div class="ob-review__section">${row.section}</div>`;
    return `<div class="ob-review__row"><span class="ob-review__label">${row.label}</span><span class="ob-review__value">${row.value}</span></div>`;
  }).join('');
}

// ── Form submit ──────────────────────────────────────────────
document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  if (!validateStep(3)) { goToStep(3); return; }

  const consent = document.getElementById('ob_consent');
  if (!consent.checked) {
    showErr('err_consent', 'You must confirm your consent before submitting.');
    return;
  }

  const f        = document.getElementById('onboardingForm');
  const services = [...document.querySelectorAll('input[name="services"]:checked')].map(c => c.value);
  const btn      = document.getElementById('ob_submitBtn');

  btn.disabled = true;
  btn.classList.add('loading');

  try {
    await addDoc(collection(db, 'onboardings'), {
      // Personal
      title:          f.title.value        || null,
      firstName:      f.firstName.value.trim(),
      lastName:       f.lastName.value.trim(),
      idNumber:       f.idNumber.value.trim(),
      dob:            f.dob.value,
      email:          f.email.value.trim(),
      phone:          f.phone.value.trim(),
      address:        f.address.value.trim(),
      // Business
      bizName:        f.bizName.value.trim()        || null,
      tradingName:    f.tradingName.value.trim()    || null,
      regNumber:      f.regNumber.value.trim()      || null,
      vatNumber:      f.vatNumber.value.trim()      || null,
      bizType:        f.bizType.value               || null,
      industry:       f.industry.value              || null,
      employees:      f.employees.value             || null,
      financialYearEnd: f.financialYearEnd.value    || null,
      bizAddress:     f.bizAddress.value.trim()     || null,
      currentSoftware: f.currentSoftware.value      || null,
      // Services
      services,
      startDate:      f.startDate.value             || null,
      additionalNotes: f.additionalNotes.value.trim() || null,
      hearAboutUs:    f.hearAboutUs.value            || null,
      // Meta
      submittedAt:    serverTimestamp(),
      status:         'new'
    });

    document.getElementById('ob_success').hidden = false;
    btn.style.display = 'none';
    document.querySelector('.ob-btn--back').style.display = 'none';
    document.getElementById('ob_consent').closest('.ob-field--checkbox').style.display = 'none';
    document.getElementById('obReview').style.opacity = '0.5';

  } catch (err) {
    console.error(err);
    document.getElementById('ob_error').hidden = false;
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
  }
});

// ── Helpers ──────────────────────────────────────────────────
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  document.querySelectorAll('.ob-error').forEach(el => el.textContent = '');
}
