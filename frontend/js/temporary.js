'use strict';

const API = '/api';
let currentLitigant = {
  id: "TEMP-USR-101",
  username: "abebe.kebede",
  fullName: "Abebe Kebede",
  role: "client",
  accountType: "Temporary (Plaintiff)",
  phone: "+251 911 123 456",
  email: "abebe.kebede@email.com",
  pin: "8821",
  expiresAt: new Date(Date.now() + 29 * 24 * 3600 * 1000 + 14 * 3600 * 1000 + 23 * 60 * 1000)
};

let currentLitigantView = 'dashboard';
let pinVisible = false;
let allCases = [];

const ICONS = {
  checkCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  calendar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>',
  scales: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
  info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>',
  fileText: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>',
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  upload: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
  folder: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
  clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  creditCard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
  shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = sessionStorage.getItem('court_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role === 'client' || u.role === 'litigant' || u.role === 'temporary') {
        currentLitigant = Object.assign(currentLitigant, u);
      }
    }
  } catch (e) {}

  updateLitigantHeaderUI();
  startCountdownTicker();
  await loadLitigantData();
});

function startCountdownTicker() {
  function tick() {
    const now = new Date().getTime();
    const expiry = new Date(currentLitigant.expiresAt || (Date.now() + 29 * 24 * 3600 * 1000)).getTime();
    const diff = Math.max(0, expiry - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const countdownEl = document.getElementById('sidebar-countdown');
    if (countdownEl) {
      countdownEl.textContent = days + 'd : ' + hours + 'h : ' + minutes + 'm';
    }
  }
  tick();
  setInterval(tick, 1000);
}

function updateLitigantHeaderUI() {
  const name = currentLitigant.fullName || "Abebe Kebede";
  const initials = name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() || "AK";
  
  const initialsEl = document.getElementById('litigant-avatar-initials');
  if (initialsEl) initialsEl.textContent = initials;

  const dropInitialsEl = document.getElementById('litigant-dropdown-avatar');
  if (dropInitialsEl) dropInitialsEl.textContent = initials;

  const dropNameEl = document.getElementById('litigant-dropdown-fullname');
  if (dropNameEl) dropNameEl.textContent = name;

  const topNameEl = document.getElementById('top-litigant-name');
  if (topNameEl) topNameEl.textContent = name;
}

function toggleLitigantProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('litigant-profile-dropdown-menu');
  if (menu) menu.classList.toggle('show');
}

function handleLitigantGlobalClick(e) {
  const menu = document.getElementById('litigant-profile-dropdown-menu');
  const trigger = document.getElementById('litigant-profile-pill-trigger');
  if (menu && menu.classList.contains('show')) {
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
      menu.classList.remove('show');
    }
  }
}

function openLitigantEditProfileModal() {
  const menu = document.getElementById('litigant-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');

  document.getElementById('litigant-modal-title').textContent = 'Litigant Account Information';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<form onsubmit="handleLitigantEditProfileSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Full Legal Name</label>' +
        '<input type="text" id="edit-lit-fullname" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentLitigant.fullName || 'Abebe Kebede') + '" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Verified Mobile Phone</label>' +
          '<input type="text" id="edit-lit-phone" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentLitigant.phone || '+251 911 123 456') + '" required/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Email Address</label>' +
          '<input type="email" id="edit-lit-email" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentLitigant.email || 'abebe.kebede@email.com') + '" required/>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;margin-top:1rem">' +
        '<button type="submit" class="btn btn-primary" style="flex:1;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Save Contact Info</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeLitigantModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openLitigantModal();
}

function handleLitigantEditProfileSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('edit-lit-fullname').value.trim();
  const phone = document.getElementById('edit-lit-phone').value.trim();
  const email = document.getElementById('edit-lit-email').value.trim();

  currentLitigant.fullName = fullName;
  currentLitigant.phone = phone;
  currentLitigant.email = email;

  sessionStorage.setItem('court_user', JSON.stringify(currentLitigant));
  updateLitigantHeaderUI();
  alert('Account profile updated.');
  closeLitigantModal();
  renderLitigantCurrentView();
}

function openChangePinModal() {
  const menu = document.getElementById('litigant-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');

  document.getElementById('litigant-modal-title').textContent = 'Change Temporary Access PIN';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<form onsubmit="handleChangePinSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Current Access PIN</label>' +
        '<input type="password" id="curr-pin" class="top-search-input" style="border-radius:6px;width:100%" placeholder="••••" maxlength="4" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">New 4-Digit PIN</label>' +
        '<input type="password" id="new-pin" class="top-search-input" style="border-radius:6px;width:100%" placeholder="••••" maxlength="4" required/>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Update Access PIN</button>' +
    '</form>';
  openLitigantModal();
}

function handleChangePinSubmit(e) {
  e.preventDefault();
  const newPin = document.getElementById('new-pin').value.trim();
  currentLitigant.pin = newPin;
  sessionStorage.setItem('court_user', JSON.stringify(currentLitigant));
  alert('Access PIN updated successfully.');
  closeLitigantModal();
  renderLitigantCurrentView();
}

function togglePinVisibility() {
  pinVisible = !pinVisible;
  const pinEl = document.getElementById('account-pin-val');
  if (pinEl) {
    pinEl.textContent = pinVisible ? (currentLitigant.pin || '8821') : '••••';
  }
}

function copyCaseId(id) {
  navigator.clipboard.writeText(id).then(() => {
    alert('Case ID ' + id + ' copied to clipboard!');
  }).catch(() => {
    alert('Case ID: ' + id);
  });
}

function logoutLitigant() {
  const menu = document.getElementById('litigant-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');
  sessionStorage.removeItem('court_user');
  window.location.href = '/';
}

async function loadLitigantData() {
  try {
    const res = await fetch(API + '/cases').catch(() => null);
    if (res && res.ok) allCases = await res.json();
  } catch (err) {}

  renderLitigantCurrentView();
}

function switchLitigantView(viewName) {
  currentLitigantView = viewName;
  document.querySelectorAll('.header-nav-tab').forEach(tab => tab.classList.remove('active'));
  const activeTab = Array.from(document.querySelectorAll('.header-nav-tab')).find(t => 
    t.textContent.toLowerCase().includes(viewName.replace('_', ' '))
  );
  if (activeTab) activeTab.classList.add('active');

  document.querySelectorAll('.litigant-nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.litigant-nav-btn')).find(b => 
    b.textContent.toLowerCase().includes(viewName.replace('_', ' '))
  );
  if (activeBtn) activeBtn.classList.add('active');

  renderLitigantCurrentView();
}

function renderLitigantCurrentView() {
  const container = document.getElementById('dynamic-litigant-workspace');
  if (!container) return;

  if (currentLitigantView === 'dashboard') {
    renderLitigantDashboard(container);
  } else if (currentLitigantView === 'my_cases') {
    renderMyCasesView(container);
  } else if (currentLitigantView === 'documents') {
    renderDocumentsView(container);
  } else if (currentLitigantView === 'hearings') {
    renderHearingsView(container);
  } else if (currentLitigantView === 'messages') {
    renderMessagesView(container);
  } else if (currentLitigantView === 'notifications') {
    renderNotificationsView(container);
  } else {
    renderLitigantDashboard(container);
  }
}

function renderLitigantDashboard(container) {
  container.innerHTML = 
    '<div class="litigant-greeting-row">' +
      '<h1 class="litigant-greeting-title">Welcome, ' + (currentLitigant.fullName || 'Abebe Kebede') + '</h1>' +
      '<div class="litigant-greeting-sub">Here\'s an overview of your case and important updates.</div>' +
    '</div>' +

    '<div class="case-progress-card">' +
      '<div class="case-progress-top-row">' +
        '<div>' +
          '<div class="case-id-header-label">Case ID</div>' +
          '<div class="case-id-title-val">' +
            '<span>CASE-178721596417</span>' +
            '<button style="background:transparent;border:none;cursor:pointer;color:#64748b" title="Copy Case ID" onclick="copyCaseId(\'CASE-178721596417\')">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>' +
            '</button>' +
            '<span class="status-pill" style="background:#e0f2fe;color:#0284c7;font-size:0.65rem;margin-left:0.35rem">ACTIVE</span>' +
          '</div>' +
          '<div class="case-id-header-label" style="margin-top:0.4rem">Case Title</div>' +
          '<div class="case-title-line">Awash International Bank vs. Blue Nile Holdings</div>' +
        '</div>' +

        '<div>' +
          '<div class="case-id-header-label">Case Progress</div>' +
          '<div class="case-stepper-6">' +
            '<div class="step-item-wrap">' +
              '<div class="step-circle-icon completed">' + ICONS.checkCircle + '</div>' +
              '<div class="step-label-title">Filed</div>' +
              '<div class="step-label-sub">May 17, 2026</div>' +
            '</div>' +

            '<div class="step-item-wrap">' +
              '<div class="step-circle-icon completed">' + ICONS.checkCircle + '</div>' +
              '<div class="step-label-title">Screening</div>' +
              '<div class="step-label-sub">May 18, 2026</div>' +
            '</div>' +

            '<div class="step-item-wrap">' +
              '<div class="step-circle-icon completed">' + ICONS.checkCircle + '</div>' +
              '<div class="step-label-title">Assigned</div>' +
              '<div class="step-label-sub">May 19, 2026</div>' +
            '</div>' +

            '<div class="step-item-wrap">' +
              '<div class="step-circle-icon active">4</div>' +
              '<div class="step-label-title" style="color:#2563eb">Evidence</div>' +
              '<div class="step-label-sub" style="color:#2563eb;font-weight:700">Current Stage</div>' +
            '</div>' +

            '<div class="step-item-wrap">' +
              '<div class="step-circle-icon">5</div>' +
              '<div class="step-label-title">Hearing</div>' +
              '<div class="step-label-sub">Upcoming</div>' +
            '</div>' +

            '<div class="step-item-wrap">' +
              '<div class="step-circle-icon">6</div>' +
              '<div class="step-label-title">Verdict</div>' +
              '<div class="step-label-sub">Pending</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="case-meta-bottom-row">' +
        '<div class="meta-col-item">' +
          '<span class="meta-col-label">Case Type</span>' +
          '<span class="meta-col-val">Civil / Corporate</span>' +
        '</div>' +
        '<div class="meta-col-item">' +
          '<span class="meta-col-label">Jurisdiction</span>' +
          '<span class="meta-col-val">Federal Supreme Court</span>' +
        '</div>' +
        '<div class="meta-col-item">' +
          '<span class="meta-col-label">Assigned Judge</span>' +
          '<span class="meta-col-val">Hon. Judge Bekele Seyoum</span>' +
        '</div>' +
        '<div class="meta-col-item">' +
          '<span class="meta-col-label">Courtroom</span>' +
          '<span class="meta-col-val">Courtroom 4</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="litigant-2col-layout">' +

      '<div>' +

        '<div class="litigant-panel-card">' +
          '<div class="litigant-panel-header">' +
            '<div class="litigant-panel-title">Case At a Glance</div>' +
          '</div>' +

          '<div class="glance-2x2-grid">' +
            '<div class="glance-box-item">' +
              '<div>' +
                '<div class="glance-box-label">' + ICONS.calendar + ' Next Hearing</div>' +
                '<div class="glance-highlight-title">May 27, 2026 (Tuesday)</div>' +
                '<div style="font-weight:700;color:var(--fsc-navy-main);font-size:0.8rem">09:30 AM</div>' +
                '<div class="glance-subtext">&bull; Preliminary Hearing<br/>Courtroom 4, Federal Supreme Court</div>' +
              '</div>' +
              '<button class="btn-glance-action" onclick="openHearingDetailsModal()">View Hearing Details</button>' +
            '</div>' +

            '<div class="glance-box-item">' +
              '<div>' +
                '<div class="glance-box-label">' + ICONS.scales + ' Your Advocate</div>' +
                '<div style="display:flex;align-items:center;justify-content:space-between">' +
                  '<span class="glance-highlight-title">Kebede Haile Mariam</span>' +
                  '<span class="status-pill" style="background:#dcfce7;color:#16a34a;font-size:0.65rem">ACTIVE</span>' +
                '</div>' +
                '<div style="font-size:0.75rem;color:#64748b;margin:0.2rem 0">License No: LAW-1001</div>' +
                '<div class="glance-subtext">Criminal Law / Federal Supreme Court</div>' +
              '</div>' +
              '<button class="btn-glance-action" onclick="openAdvocateProfileModal()">View Advocate Profile</button>' +
            '</div>' +

            '<div class="glance-box-item">' +
              '<div>' +
                '<div class="glance-box-label">' + ICONS.info + ' Case Status</div>' +
                '<div class="glance-subtext" style="font-size:0.785rem;color:var(--fsc-navy-main);margin-top:0.2rem">' +
                  'Your case is at the Evidence stage. Both parties are exchanging evidence and preparing for hearing.' +
                '</div>' +
              '</div>' +
              '<a class="litigant-panel-link" style="font-size:0.75rem;margin-top:0.4rem" onclick="openCaseTimelineModal()">View Case Timeline &rarr;</a>' +
            '</div>' +

            '<div class="glance-box-item">' +
              '<div>' +
                '<div class="glance-box-label">' + ICONS.fileText + ' Recent Update</div>' +
                '<div style="font-size:0.785rem;font-weight:700;color:var(--fsc-navy-main);margin-top:0.2rem">' +
                  'Evidence_02.pdf uploaded by your advocate.' +
                '</div>' +
                '<div style="font-size:0.72rem;color:#64748b;margin-top:0.2rem">May 24, 2026 - 10:32 AM</div>' +
              '</div>' +
              '<a class="litigant-panel-link" style="font-size:0.75rem;margin-top:0.4rem" onclick="switchLitigantView(\'documents\')">View All Updates &rarr;</a>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="split-2col-subcards">' +

          '<div class="litigant-panel-card" style="margin-bottom:0">' +
            '<div class="litigant-panel-header">' +
              '<div class="litigant-panel-title">Evidence Overview</div>' +
              '<a class="litigant-panel-link" onclick="switchLitigantView(\'documents\')">View all documents &rarr;</a>' +
            '</div>' +

            '<div>' +
              '<div class="evidence-stage-box">' +
                '<div class="stage-box-header">' +
                  '<span class="stage-title-text"><span style="color:#16a34a">&#10003;</span> Stage 1: Initial Filing (You)</span>' +
                '</div>' +
                '<div class="doc-row-item"><span class="doc-row-left" onclick="alert(\'Opening Complaint.pdf\')">Complaint.pdf</span><span class="doc-row-meta">May 17, 2026 &bull; 2.4 MB</span></div>' +
                '<div class="doc-row-item"><span class="doc-row-left" onclick="alert(\'Opening Contract.pdf\')">Contract.pdf</span><span class="doc-row-meta">May 17, 2026 &bull; 5.1 MB</span></div>' +
                '<div class="doc-row-item"><span class="doc-row-left" onclick="alert(\'Opening Witness_Statement.pdf\')">Witness_Statement.pdf</span><span class="doc-row-meta">May 17, 2026 &bull; 1.2 MB</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.35rem;font-size:0.7rem">' +
                  '<span style="color:#64748b">3 Documents</span>' +
                  '<span class="status-pill" style="background:#dcfce7;color:#16a34a;font-size:0.65rem">COMPLETE</span>' +
                '</div>' +
              '</div>' +

              '<div class="evidence-stage-box">' +
                '<div class="stage-box-header">' +
                  '<span class="stage-title-text"><span style="color:#2563eb">&#9679;</span> Stage 2: Trial Exchange</span>' +
                '</div>' +
                '<div class="doc-row-item"><span class="doc-row-left" onclick="alert(\'Opening Defense_Response.pdf\')">Defense_Response.pdf</span><span class="doc-row-meta">May 21, 2026 &bull; 3.2 MB</span></div>' +
                '<div class="doc-row-item"><span class="doc-row-left" onclick="alert(\'Opening Expert_Report.pdf\')">Expert_Report.pdf</span><span class="doc-row-meta">May 22, 2026 &bull; 4.8 MB</span></div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.35rem;font-size:0.7rem">' +
                  '<span style="color:#64748b">2 Documents</span>' +
                  '<span class="status-pill" style="background:#e0f2fe;color:#0284c7;font-size:0.65rem">IN PROGRESS</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="litigant-panel-card" style="margin-bottom:0">' +
            '<div class="litigant-panel-header">' +
              '<div class="litigant-panel-title">Messages</div>' +
              '<a class="litigant-panel-link" onclick="switchLitigantView(\'messages\')">View all messages &rarr;</a>' +
            '</div>' +

            '<div>' +
              '<div class="msg-feed-item">' +
                '<div class="msg-feed-avatar">CC</div>' +
                '<div style="flex:1">' +
                  '<div class="msg-feed-title"><span>Court Clerk</span><span class="msg-feed-time">May 24, 10:32 AM</span></div>' +
                  '<div class="msg-feed-text">Please note that new evidence has been submitted by the defendant...</div>' +
                '</div>' +
                '<span class="badge-blue-pill" style="margin-left:0.35rem">2</span>' +
              '</div>' +

              '<div class="msg-feed-item">' +
                '<div class="msg-feed-avatar">YA</div>' +
                '<div style="flex:1">' +
                  '<div class="msg-feed-title"><span>Your Advocate</span><span class="msg-feed-time">May 23, 04:15 PM</span></div>' +
                  '<div class="msg-feed-text">I have reviewed the new documents. We will prepare our response...</div>' +
                '</div>' +
              '</div>' +

              '<div class="msg-feed-item">' +
                '<div class="msg-feed-avatar">CN</div>' +
                '<div style="flex:1">' +
                  '<div class="msg-feed-title"><span>Court Notification</span><span class="msg-feed-time">May 19, 11:20 AM</span></div>' +
                  '<div class="msg-feed-text">Your case has been assigned to Hon. Judge Bekele Seyoum.</div>' +
                '</div>' +
              '</div>' +

              '<button class="btn-compose-full" onclick="openComposeMessageModal()">Compose Message</button>' +
            '</div>' +
          '</div>' +

        '</div>' +

      '</div>' +

      '<div>' +

        '<div class="litigant-panel-card">' +
          '<div class="litigant-panel-header">' +
            '<div class="litigant-panel-title">' + ICONS.user + ' My Account</div>' +
          '</div>' +

          '<div>' +
            '<div class="account-meta-row">' +
              '<span class="account-meta-label">Account Type</span>' +
              '<span class="account-meta-val" style="color:#2563eb">Temporary (Plaintiff)</span>' +
            '</div>' +

            '<div class="account-meta-row">' +
              '<span class="account-meta-label">Phone Number</span>' +
              '<div class="account-meta-val">' +
                '<span>+251 911 123 456</span>' +
                '<span class="status-pill" style="background:#dcfce7;color:#16a34a;font-size:0.65rem">Verified</span>' +
              '</div>' +
            '</div>' +

            '<div class="account-meta-row">' +
              '<span class="account-meta-label">Email</span>' +
              '<div class="account-meta-val">' +
                '<span style="font-size:0.75rem">abebe.kebede@email.com</span>' +
                '<span class="status-pill" style="background:#dcfce7;color:#16a34a;font-size:0.65rem">Verified</span>' +
              '</div>' +
            '</div>' +

            '<div class="account-meta-row">' +
              '<span class="account-meta-label">Access PIN</span>' +
              '<div class="account-meta-val">' +
                '<span id="account-pin-val">••••</span>' +
                '<button style="background:transparent;border:none;cursor:pointer;color:#64748b;display:flex;align-items:center" title="Toggle PIN" onclick="togglePinVisibility()">' +
                  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>' +
                '</button>' +
              '</div>' +
            '</div>' +

            '<div class="account-meta-row">' +
              '<span class="account-meta-label">Account Expires</span>' +
              '<span class="account-meta-val" style="color:#ea580c;font-size:0.75rem">Jun 24, 2026 (29 days left)</span>' +
            '</div>' +

            '<button class="btn-extend-access" onclick="openExtendAccessModal()">Extend Access</button>' +

            '<div style="text-align:center;margin-top:0.65rem">' +
              '<a class="litigant-panel-link" onclick="openLitigantEditProfileModal()">Account Settings &rarr;</a>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="litigant-panel-card">' +
          '<div class="litigant-panel-header">' +
            '<div class="litigant-panel-title">Important Notifications</div>' +
            '<a class="litigant-panel-link" onclick="switchLitigantView(\'notifications\')">View all</a>' +
          '</div>' +

          '<div>' +
            '<div class="notif-item-wrap">' +
              '<div class="notif-icon-circle" style="background:#dcfce7;color:#16a34a">' + ICONS.fileText + '</div>' +
              '<div>' +
                '<div class="notif-text-title">New document uploaded in your case</div>' +
                '<div class="notif-text-sub">Evidence_02.pdf was uploaded.</div>' +
                '<div class="notif-text-time">2 hours ago</div>' +
              '</div>' +
            '</div>' +

            '<div class="notif-item-wrap">' +
              '<div class="notif-icon-circle" style="background:#e0f2fe;color:#0284c7">' + ICONS.calendar + '</div>' +
              '<div>' +
                '<div class="notif-text-title">Hearing scheduled</div>' +
                '<div class="notif-text-sub">May 27, 2026 at 09:30 AM in Courtroom 4.</div>' +
                '<div class="notif-text-time">1 day ago</div>' +
              '</div>' +
            '</div>' +

            '<div class="notif-item-wrap">' +
              '<div class="notif-icon-circle" style="background:#ffedd5;color:#ea580c">' + ICONS.user + '</div>' +
              '<div>' +
                '<div class="notif-text-title">Reminder</div>' +
                '<div class="notif-text-sub">Ensure all evidence is submitted before hearing.</div>' +
                '<div class="notif-text-time">2 days ago</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="litigant-panel-card">' +
          '<div class="litigant-panel-header">' +
            '<div class="litigant-panel-title">Quick Actions</div>' +
          '</div>' +

          '<div class="quick-actions-3x2">' +
            '<div class="action-tile-btn" onclick="openUploadEvidenceModal()">' +
              '<div style="color:#475569">' + ICONS.upload + '</div>' +
              '<span>Upload Document</span>' +
            '</div>' +

            '<div class="action-tile-btn" onclick="openCaseDetailsModal()">' +
              '<div style="color:#475569">' + ICONS.folder + '</div>' +
              '<span>View Case Details</span>' +
            '</div>' +

            '<div class="action-tile-btn" onclick="openPostponementModal()">' +
              '<div style="color:#475569">' + ICONS.clock + '</div>' +
              '<span>Request Postponement</span>' +
            '</div>' +

            '<div class="action-tile-btn" onclick="openPaymentModal()">' +
              '<div style="color:#475569">' + ICONS.creditCard + '</div>' +
              '<span>Make Payment</span>' +
            '</div>' +

            '<div class="action-tile-btn" onclick="openAdvocateProfileModal()">' +
              '<div style="color:#475569">' + ICONS.user + '</div>' +
              '<span>Contact Advocate</span>' +
            '</div>' +

            '<div class="action-tile-btn" onclick="openAppealModal()">' +
              '<div style="color:#475569">' + ICONS.scales + '</div>' +
              '<span>File an Appeal</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="security-notice-card">' +
          '<div style="color:#2563eb">' + ICONS.shield + '</div>' +
          '<div>' +
            '<div style="font-size:0.785rem;font-weight:700;color:var(--fsc-navy-main)">Security Notice</div>' +
            '<div style="font-size:0.725rem;color:#475569;margin-top:2px;line-height:1.35">' +
              'Do not share your PIN with anyone. The court will never ask for your PIN via phone or email.' +
            '</div>' +
          '</div>' +
        '</div>' +

      '</div>' +

    '</div>';
}

/* Subviews */
function renderMyCasesView(container) {
  renderLitigantDashboard(container);
}

function renderDocumentsView(container) {
  container.innerHTML = 
    '<div class="litigant-greeting-row">' +
      '<h1 class="litigant-greeting-title">Documents &amp; Evidentiary Exhibits</h1>' +
      '<div class="litigant-greeting-sub">Verified legal filings and evidentiary annexes for CASE-178721596417.</div>' +
    '</div>' +
    '<div class="litigant-panel-card">' +
      '<table class="fsc-table">' +
        '<thead><tr><th>File Name</th><th>Stage</th><th>Submitted On</th><th>File Size</th><th>Action</th></tr></thead>' +
        '<tbody>' +
          '<tr><td><strong>Complaint.pdf</strong></td><td><span class="status-pill" style="background:#dcfce7;color:#16a34a">Initial Filing</span></td><td>May 17, 2026</td><td>2.4 MB</td><td><button class="btn-glance-action" onclick="alert(\'Viewing Complaint.pdf\')">Download</button></td></tr>' +
          '<tr><td><strong>Contract.pdf</strong></td><td><span class="status-pill" style="background:#dcfce7;color:#16a34a">Initial Filing</span></td><td>May 17, 2026</td><td>5.1 MB</td><td><button class="btn-glance-action" onclick="alert(\'Viewing Contract.pdf\')">Download</button></td></tr>' +
          '<tr><td><strong>Witness_Statement.pdf</strong></td><td><span class="status-pill" style="background:#dcfce7;color:#16a34a">Initial Filing</span></td><td>May 17, 2026</td><td>1.2 MB</td><td><button class="btn-glance-action" onclick="alert(\'Viewing Witness_Statement.pdf\')">Download</button></td></tr>' +
          '<tr><td><strong>Defense_Response.pdf</strong></td><td><span class="status-pill" style="background:#e0f2fe;color:#0284c7">Trial Exchange</span></td><td>May 21, 2026</td><td>3.2 MB</td><td><button class="btn-glance-action" onclick="alert(\'Viewing Defense_Response.pdf\')">Download</button></td></tr>' +
          '<tr><td><strong>Expert_Report.pdf</strong></td><td><span class="status-pill" style="background:#e0f2fe;color:#0284c7">Trial Exchange</span></td><td>May 22, 2026</td><td>4.8 MB</td><td><button class="btn-glance-action" onclick="alert(\'Viewing Expert_Report.pdf\')">Download</button></td></tr>' +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderHearingsView(container) {
  renderLitigantDashboard(container);
}

function renderMessagesView(container) {
  renderLitigantDashboard(container);
}

function renderNotificationsView(container) {
  renderLitigantDashboard(container);
}

/* Modals */
function openHearingDetailsModal() {
  document.getElementById('litigant-modal-title').textContent = 'Preliminary Hearing Notice';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<h3 style="font-size:1.05rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.5rem">Court Hearing Session</h3>' +
      '<div><strong>Date &amp; Time:</strong> May 27, 2026 (Tuesday) at 09:30 AM</div>' +
      '<div><strong>Bench / Chamber:</strong> Courtroom 4, Federal Supreme Court (Sidist Kilo)</div>' +
      '<div><strong>Presiding Judge:</strong> Hon. Judge Bekele Seyoum</div>' +
      '<div><strong>Purpose:</strong> Evidence Examination &amp; Witness Verification</div>' +
      '<div style="margin-top:1rem">' +
        '<button class="btn btn-primary" style="width:100%;padding:0.65rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="closeLitigantModal()">Close</button>' +
      '</div>' +
    '</div>';
  openLitigantModal();
}

function openAdvocateProfileModal() {
  document.getElementById('litigant-modal-title').textContent = 'Your Retained Legal Counsel';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:#0b1a30;color:#dfb15b;display:flex;align-items:center;justify-content:center;font-weight:800">KH</div>' +
        '<div>' +
          '<h3 style="font-size:1.05rem;font-weight:800;color:var(--fsc-navy-main)">Kebede Haile Mariam</h3>' +
          '<div style="font-size:0.75rem;color:#64748b">MoJ License: LAW-1001 (Federal Supreme Court)</div>' +
        '</div>' +
      '</div>' +
      '<div><strong>Specialization:</strong> Criminal, Commercial &amp; Corporate Litigation</div>' +
      '<div><strong>Contact Direct:</strong> +251 91 122 3344</div>' +
      '<div><strong>Chamber:</strong> Addis Ababa Law Chambers, Churchill Rd</div>' +
      '<div style="margin-top:1rem;display:flex;gap:0.5rem">' +
        '<button class="btn btn-primary" style="flex:1;padding:0.65rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="openComposeMessageModal()">Send Message to Advocate</button>' +
        '<button class="btn btn-outline" style="padding:0.65rem 1rem;cursor:pointer" onclick="closeLitigantModal()">Close</button>' +
      '</div>' +
    '</div>';
  openLitigantModal();
}

function openCaseTimelineModal() {
  document.getElementById('litigant-modal-title').textContent = 'Case Timeline & Docket History';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<div style="line-height:1.8">' +
      '<div><strong>May 17, 2026:</strong> Initial Complaint &amp; Statement of Claim filed by Plaintiff.</div>' +
      '<div><strong>May 18, 2026:</strong> Filing screened and accepted by Screening Officer Tesfaye.</div>' +
      '<div><strong>May 19, 2026:</strong> Assigned to Hon. Judge Bekele Seyoum (Courtroom 4).</div>' +
      '<div><strong>May 21, 2026:</strong> Statement of Defense submitted by Defendant.</div>' +
      '<div><strong>May 24, 2026:</strong> Additional Evidence Exhibit 02 uploaded by Advocate.</div>' +
      '<div><strong>May 27, 2026:</strong> Scheduled Preliminary Evidence Hearing.</div>' +
      '<button class="btn btn-outline" style="width:100%;margin-top:1rem;padding:0.6rem;cursor:pointer" onclick="closeLitigantModal()">Close Timeline</button>' +
    '</div>';
  openLitigantModal();
}

function openComposeMessageModal() {
  document.getElementById('litigant-modal-title').textContent = 'Send Secure Message';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<form onsubmit="handleSendMessageSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Recipient</label>' +
        '<select class="top-search-input" style="border-radius:6px;width:100%">' +
          '<option>Advocate Kebede Haile Mariam</option>' +
          '<option>Court Registry Clerk</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Message</label>' +
        '<textarea class="top-search-input" style="border-radius:6px;width:100%;height:80px;padding:0.5rem" required placeholder="Type your message regarding CASE-178721596417..."></textarea>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Send Message</button>' +
    '</form>';
  openLitigantModal();
}

function handleSendMessageSubmit(e) {
  e.preventDefault();
  alert('Secure message dispatched.');
  closeLitigantModal();
}

function openExtendAccessModal() {
  document.getElementById('litigant-modal-title').textContent = 'Request Access Extension';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<p>Your current access expires on <strong>June 24, 2026</strong>. Request a 30-day extension until the next judicial stage concludes:</p>' +
      '<button class="btn btn-primary" style="width:100%;margin-top:1rem;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Access extended by 30 days.\'); closeLitigantModal();">Grant 30-Day Extension</button>' +
    '</div>';
  openLitigantModal();
}

function openUploadEvidenceModal() {
  document.getElementById('litigant-modal-title').textContent = 'Upload Evidentiary Document';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<form onsubmit="handleUploadEvidenceSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Document Description</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="e.g. Bank Statement receipt.pdf" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Attach File (PDF, max 10MB)</label>' +
        '<input type="file" class="top-search-input" style="border-radius:6px;width:100%;padding:0.35rem" required/>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Upload &amp; Submit to Court</button>' +
    '</form>';
  openLitigantModal();
}

function handleUploadEvidenceSubmit(e) {
  e.preventDefault();
  alert('Document submitted to registry.');
  closeLitigantModal();
}

function openCaseDetailsModal() {
  openHearingDetailsModal();
}

function openPostponementModal() {
  document.getElementById('litigant-modal-title').textContent = 'Petition for Hearing Postponement';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<form onsubmit="handlePostponementSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Reason for Adjournment Request</label>' +
        '<textarea class="top-search-input" style="border-radius:6px;width:100%;height:80px;padding:0.5rem" required placeholder="Specify medical emergency, counsel engagement, or settlement discussions..."></textarea>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Submit Postponement Petition</button>' +
    '</form>';
  openLitigantModal();
}

function handlePostponementSubmit(e) {
  e.preventDefault();
  alert('Postponement petition transmitted to Presiding Judge.');
  closeLitigantModal();
}

function openPaymentModal() {
  document.getElementById('litigant-modal-title').textContent = 'Court Statutory Fee Payment';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<div style="padding:1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:1rem">' +
        '<div style="font-size:0.75rem;color:#64748b">Outstanding Statutory Court Fee</div>' +
        '<div style="font-size:1.35rem;font-weight:800;color:var(--fsc-navy-main)">250.00 ETB</div>' +
      '</div>' +
      '<button class="btn btn-primary" style="width:100%;padding:0.75rem;background:#16a34a;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Redirecting to Telebirr Payment Gateway...\'); closeLitigantModal();">Pay via Telebirr</button>' +
    '</div>';
  openLitigantModal();
}

function openAppealModal() {
  document.getElementById('litigant-modal-title').textContent = 'File Cassation / Appellate Petition';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<p>Petitions to the Federal Supreme Court Cassation Division must cite fundamental errors of law under Proclamation 1234/2021.</p>' +
      '<button class="btn btn-primary" style="width:100%;margin-top:1rem;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Opening Cassation filing studio...\'); closeLitigantModal();">Proceed with Appellate Filing</button>' +
    '</div>';
  openLitigantModal();
}

function openLitigantHelpModal() {
  document.getElementById('litigant-modal-title').textContent = 'Court Assistance &amp; Help Desk';
  document.getElementById('litigant-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<div><strong>Supreme Court Helpdesk:</strong> +251 11 551 7700</div>' +
      '<div><strong>Email Support:</strong> support@fsc.gov.et</div>' +
      '<div><strong>Working Hours:</strong> Monday – Friday, 8:30 AM – 5:30 PM</div>' +
      '<button class="btn btn-outline" style="width:100%;margin-top:1rem;padding:0.6rem;cursor:pointer" onclick="closeLitigantModal()">Close</button>' +
    '</div>';
  openLitigantModal();
}

function openLitigantModal() {
  const modal = document.getElementById('universal-litigant-modal');
  if (modal) modal.style.display = 'flex';
}

function closeLitigantModal() {
  const modal = document.getElementById('universal-litigant-modal');
  if (modal) modal.style.display = 'none';
}
