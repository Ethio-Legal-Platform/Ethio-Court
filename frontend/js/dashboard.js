'use strict';

const API = '/api';
let currentUser = null;
let currentView = 'dashboard';
let allCases = [];
let allNotifications = [];
let searchQuery = '';

const ICONS = {
  briefcase: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  fileText: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>',
  checkCircle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  upload: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
  shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  location: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  bolt: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
};

async function initAdvocatePortal() {
  try {
    const stored = sessionStorage.getItem('court_user');
    if (stored) {
      currentUser = JSON.parse(stored);
    }
  } catch (e) {}

  if (!currentUser) {
    currentUser = {
      id: "LAWYER-002",
      username: "lawyer.tigist",
      fullName: "Advocate Tigist Assefa",
      role: "lawyer",
      licenseNumber: "LAW-1002",
      specialization: "Civil Dispute & Commercial Litigation",
      email: "tigist.law@ethiopianbar.org",
      phone: "0912345678",
      averageRating: 4.9,
      clientRating: 4.8
    };
  }

  updateUserUI();
  await loadDashboardData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdvocatePortal);
} else {
  initAdvocatePortal();
}

function updateUserUI() {
  if (!currentUser) return;
  const name = currentUser.fullName || currentUser.username || 'Advocate';
  const role = (currentUser.role ? currentUser.role : 'Advocate').toUpperCase();
  const license = currentUser.licenseNumber || currentUser.license || 'LAW-1002';
  
  const nameEl = document.getElementById('top-user-name');
  const roleEl = document.getElementById('top-user-role');
  const avatarEl = document.getElementById('user-avatar-initials');

  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role.charAt(0) + role.slice(1).toLowerCase();
  
  const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'TA';
  if (avatarEl) avatarEl.textContent = initials;
  const dropAvatar = document.getElementById('advocate-dropdown-avatar');
  if (dropAvatar) dropAvatar.textContent = initials;
  const dropName = document.getElementById('advocate-dropdown-fullname');
  if (dropName) dropName.textContent = name;
  const dropSub = document.getElementById('advocate-dropdown-sub');
  if (dropSub) dropSub.textContent = (role.charAt(0) + role.slice(1).toLowerCase()) + ' · ' + license;

  const licEl = document.getElementById('sidebar-lawyer-license');
  if (licEl) licEl.textContent = 'License: ' + license;

  // Update requests badge
  updateRequestsBadge();
}

function updateRequestsBadge() {
  const reqs = getIncomingLawyerRequests();
  const notifEl = document.getElementById('top-notif-count');
  if (notifEl) {
    notifEl.textContent = reqs.length || '0';
    notifEl.style.display = reqs.length > 0 ? 'flex' : 'none';
  }
}

// ── ADVOCATE CASE SCOPING & FILTERING ──
function isCaseAppointedToCurrentLawyer(c) {
  if (!c) return false;
  const lawyerId = (currentUser ? currentUser.id : 'LAWYER-002').toUpperCase();
  const license = (currentUser ? (currentUser.licenseNumber || currentUser.license) : 'LAW-1002').toUpperCase();
  const lawyerName = (currentUser ? (currentUser.fullName || '') : '').toLowerCase();
  const tokens = lawyerName.split(/\s+/).filter(t => t.length > 2 && !t.includes('advocate'));

  // If there is ONLY a pending request and it is NOT appointed, it is NOT in active cases
  if (c.pendingLawyerRequest && (!c.lawyerAppointed || c.pendingLawyerRequest.status === 'pending')) {
    return false;
  }

  // 1. Direct lawyerAppointed match
  if (c.lawyerAppointed) {
    const la = c.lawyerAppointed;
    if (la.lawyerId && la.lawyerId.toUpperCase() === lawyerId) return true;
    if (la.licenseNumber && la.licenseNumber.toUpperCase() === license) return true;
    if (la.lawyerName) {
      const laName = la.lawyerName.toLowerCase();
      if (tokens.some(t => laName.includes(t))) return true;
    }
  }

  // 2. Direct plaintiff/defendant lawyer id match (when no pending request)
  if (c.plaintiffLawyerId && c.plaintiffLawyerId.toUpperCase() === lawyerId) return true;
  if (c.defendantLawyerId && c.defendantLawyerId.toUpperCase() === lawyerId) return true;
  if (c.plaintiffLawyerLic && c.plaintiffLawyerLic.toUpperCase() === license) return true;
  if (c.defendantLawyerLic && c.defendantLawyerLic.toUpperCase() === license) return true;

  if (c.lawyerName && tokens.length && tokens.some(t => c.lawyerName.toLowerCase().includes(t))) {
    return true;
  }

  return false;
}

function getAppointedLawyerCases() {
  if (!allCases || !allCases.length) return [];
  return allCases.filter(isCaseAppointedToCurrentLawyer);
}

function getIncomingLawyerRequests() {
  if (!allCases || !allCases.length) return [];
  const lawyerId = (currentUser ? currentUser.id : 'LAWYER-002').toUpperCase();
  const license = (currentUser ? (currentUser.licenseNumber || currentUser.license) : 'LAW-1002').toUpperCase();
  const lawyerName = (currentUser ? (currentUser.fullName || '') : '').toLowerCase();
  const tokens = lawyerName.split(/\s+/).filter(t => t.length > 2 && !t.includes('advocate'));

  return allCases.filter(c => {
    if (!c.pendingLawyerRequest) return false;
    const p = c.pendingLawyerRequest;
    if (p.status && p.status !== 'pending') return false;

    if (p.lawyerId && p.lawyerId.toUpperCase() === lawyerId) return true;
    if (p.licenseNumber && p.licenseNumber.toUpperCase() === license) return true;
    if (p.lawyerName && tokens.some(t => p.lawyerName.toLowerCase().includes(t))) return true;
    return false;
  });
}

async function loadDashboardData() {
  try {
    const res = await fetch(API + '/cases');
    if (res.ok) {
      allCases = await res.json();
    }
  } catch (err) {
    allCases = [];
  }

  try {
    const notifRes = await fetch(API + '/notifications');
    if (notifRes.ok) {
      allNotifications = await notifRes.json();
    }
  } catch (err) {}

  updateRequestsBadge();
  renderCurrentView();
}

function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.sidebar .nav-btn').forEach(b => b.classList.remove('active'));
  
  const navBtns = Array.from(document.querySelectorAll('.sidebar .nav-btn'));
  const targetBtn = navBtns.find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(viewName));
  if (targetBtn) targetBtn.classList.add('active');

  renderCurrentView();
}

function renderCurrentView() {
  const container = document.getElementById('dynamic-workspace-view') || document.getElementById('dynamic-advocate-workspace');
  if (!container) return;

  if (currentView === 'dashboard') {
    renderAdvocateDashboard(container);
  } else if (currentView === 'my_cases') {
    renderMyCasesView(container);
  } else if (currentView === 'hearings') {
    renderHearingsView(container);
  } else if (currentView === 'documents') {
    renderDocumentsView(container);
  } else if (currentView === 'appointment_requests') {
    renderAppointmentRequestsView(container);
  } else if (currentView === 'performance') {
    renderPerformanceView(container);
  } else if (currentView === 'notifications') {
    renderNotificationsView(container);
  } else {
    renderAdvocateDashboard(container);
  }
}

// ── 1. ADVOCATE DASHBOARD VIEW ──
function renderAdvocateDashboard(container) {
  const appointedCases = getAppointedLawyerCases();
  const incomingRequests = getIncomingLawyerRequests();

  const activeCasesList = appointedCases.filter(c => c.status !== 'closed' && c.status !== 'Decided');
  const activeCount = activeCasesList.length;
  const pendingCount = incomingRequests.length;
  const hearingsCount = appointedCases.filter(c => c.hearingDate || c.nextHearingDate).length;
  const completedCount = appointedCases.filter(c => c.status === 'closed' || c.status === 'Decided').length;

  let displayCases = activeCasesList;
  if (searchQuery) {
    displayCases = appointedCases.filter(c => 
      (c.caseId && c.caseId.toLowerCase().includes(searchQuery)) ||
      (c.caseTitle && c.caseTitle.toLowerCase().includes(searchQuery)) ||
      (c.petitioner && c.petitioner.toLowerCase().includes(searchQuery))
    );
  }

  // Pending requests banner if any
  let bannerHtml = '';
  if (incomingRequests.length > 0) {
    bannerHtml = 
      '<div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;padding:1.15rem 1.35rem;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 6px rgba(245,158,11,0.1)">' +
        '<div style="display:flex;align-items:center;gap:0.85rem">' +
          '<div style="width:40px;height:40px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0">📬</div>' +
          '<div>' +
            '<div style="font-weight:800;color:#92400e;font-size:0.95rem">You have ' + incomingRequests.length + ' incoming representation request(s) awaiting review</div>' +
            '<div style="font-size:0.8rem;color:#b45309;margin-top:2px">Litigants have selected your Bar credentials to represent their dockets before the Federal Supreme Court.</div>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary" style="background:#d97706;border:none;color:#fff;font-weight:700;padding:0.6rem 1.15rem;border-radius:6px;cursor:pointer;white-space:nowrap" onclick="switchView(\'appointment_requests\')">' +
          'Review Requests (' + incomingRequests.length + ') &rarr;' +
        '</button>' +
      '</div>';
  }

  const nextCase = appointedCases.find(c => c.nextHearingDate || c.hearingDate) || null;
  let nextMonth = 'JUN', nextDay = '05', nextDow = 'FRI';
  if (nextCase && (nextCase.nextHearingDate || nextCase.hearingDate)) {
    const d = new Date(nextCase.nextHearingDate || nextCase.hearingDate);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const dowNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    nextMonth = monthNames[d.getMonth()];
    nextDay = d.getDate();
    nextDow = dowNames[d.getDay()];
  }

  const casesRowsHtml = displayCases.length > 0 ? displayCases.slice(0, 6).map(c => {
    let pillClass = 'pill-blue';
    let statusText = (c.status || 'ACTIVE').toUpperCase();
    if (c.status === 'screening' || c.status === 'pending_screening') { pillClass = 'pill-purple'; statusText = 'SCREENING'; }
    else if (c.status === 'scheduled' || c.status === 'hearing' || c.status === 'hearing_scheduled') { pillClass = 'pill-green'; statusText = 'HEARING SCHEDULED'; }
    else if (c.status === 'closed' || c.status === 'Decided') { pillClass = 'pill-green'; statusText = 'DECIDED'; }

    const hearingFmt = (c.hearingDate || c.nextHearingDate) ? 
      (new Date(c.hearingDate || c.nextHearingDate).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'})) + '<br><span style="font-size:0.72rem;color:#64748b">' + (c.hearingTime || '09:30 AM') + '</span>' 
      : '<span style="color:#94a3b8">Pending Allocation</span>';

    return '<tr>' +
      '<td><span class="case-id-badge" onclick="openCaseDetailsModal(\'' + c.caseId + '\')">' + c.caseId + '</span></td>' +
      '<td><strong style="color:var(--fsc-navy-main)">' + (c.caseTitle || (c.petitioner + ' vs. ' + (c.respondent || 'Respondent'))) + '</strong></td>' +
      '<td><span class="court-badge">' + (c.courtroom || 'Courtroom 4') + '</span><br><span style="font-size:0.72rem;color:#64748b">' + (c.jurisdiction || 'Federal Supreme Court') + '</span></td>' +
      '<td>' + hearingFmt + '</td>' +
      '<td><span class="status-pill ' + pillClass + '">' + statusText + '</span></td>' +
      '<td>' +
        '<button class="btn btn-sm btn-outline" style="padding:0.35rem 0.75rem;cursor:pointer" onclick="openCaseDetailsModal(\'' + c.caseId + '\')">Manage Docket</button>' +
      '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#94a3b8">' +
    (incomingRequests.length > 0 ? 
      'You have ' + incomingRequests.length + ' pending representation request(s). Click <a style="color:#0284c7;font-weight:700;cursor:pointer" onclick="switchView(\'appointment_requests\')">Client Requests</a> to accept mandates and populate your active caseload.' :
      'No active appointed cases in your caseload docket. Litigant representation requests will appear here once approved.') +
  '</td></tr>';

  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Good morning, ' + (currentUser.fullName || currentUser.username || 'Counsel') + '</h1>' +
        '<div class="workspace-greeting-sub">Advocate Legal Workspace &bull; Federal Supreme Court Certified Practice</div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="openUploadDocModal()" style="background:var(--fsc-navy-main);color:#fff;padding:0.6rem 1.15rem;border-radius:8px;font-weight:700;border:none;cursor:pointer">+ File Pleading / Exhibit</button>' +
    '</div>' +

    bannerHtml +

    '<div class="kpi-cards-grid">' +
      '<div class="kpi-stat-card">' +
        '<div class="kpi-number-label">' +
          '<span class="kpi-number" style="color:var(--fsc-navy-main)">' + activeCount + '</span>' +
          '<span class="kpi-label">Active Appointed Caseload</span>' +
        '</div>' +
      '</div>' +
      '<div class="kpi-stat-card" style="cursor:pointer" onclick="switchView(\'appointment_requests\')">' +
        '<div class="kpi-number-label">' +
          '<span class="kpi-number" style="color:#d97706">' + pendingCount + '</span>' +
          '<span class="kpi-label">Pending Client Requests</span>' +
        '</div>' +
      '</div>' +
      '<div class="kpi-stat-card">' +
        '<div class="kpi-number-label">' +
          '<span class="kpi-number" style="color:#0284c7">' + hearingsCount + '</span>' +
          '<span class="kpi-label">Scheduled Trial Hearings</span>' +
        '</div>' +
      '</div>' +
      '<div class="kpi-stat-card">' +
        '<div class="kpi-number-label">' +
          '<span class="kpi-number" style="color:#16a34a">' + completedCount + '</span>' +
          '<span class="kpi-label">Resolved / Decided Cases</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="workspace-2col-grid">' +
      '<div>' +
        '<div class="fsc-panel-card">' +
          '<div class="panel-header-row">' +
            '<div class="panel-header-title">' +
              '<span>' + ICONS.briefcase + '</span>' +
              '<span>Active Appointed Caseload (' + displayCases.length + ')</span>' +
            '</div>' +
            '<a class="panel-header-link" onclick="switchView(\'my_cases\')">View all dockets &rarr;</a>' +
          '</div>' +

          '<table class="fsc-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Case ID</th>' +
                '<th>Case Title</th>' +
                '<th>Court / Bench</th>' +
                '<th>Hearing Schedule</th>' +
                '<th>Status</th>' +
                '<th>Action</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + casesRowsHtml + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      '<div>' +
        '<div class="fsc-panel-card">' +
          '<div class="panel-header-row" style="margin-bottom:0.85rem">' +
            '<div class="panel-header-title">' +
              '<span>' + ICONS.calendar + '</span>' +
              '<span>Next Trial Hearing</span>' +
            '</div>' +
          '</div>' +

          (nextCase ? 
            '<div class="hearing-card-body">' +
              '<div class="hearing-date-calendar-box">' +
                '<span class="cal-month">' + nextMonth + '</span>' +
                '<span class="cal-day">' + nextDay + '</span>' +
                '<span class="cal-dow">' + nextDow + '</span>' +
              '</div>' +
              '<div class="hearing-details-meta">' +
                '<div class="hearing-time-tag">' + (nextCase.hearingTime || '10:00 AM') + '</div>' +
                '<div class="hearing-case-num">' + nextCase.caseId + '</div>' +
                '<div class="hearing-title-line">' + (nextCase.caseTitle || 'Litigation Trial') + '</div>' +
                '<div class="hearing-location-line">' + ICONS.location + ' ' + (nextCase.courtroom || 'Courtroom 4') + ' &middot; ' + (nextCase.jurisdiction || 'Federal Supreme Court') + '</div>' +
              '</div>' +
            '</div>' +
            '<button class="btn-navy-full" style="width:100%;margin-top:0.75rem;padding:0.65rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="openHearingDetailsModal(\'' + nextCase.caseId + '\')">' +
              'View Hearing Details' +
            '</button>'
          : '<div style="padding:1.5rem;text-align:center;color:#94a3b8;font-size:0.85rem">No upcoming trial hearings currently scheduled on your caseload.</div>') +
        '</div>' +

        '<div class="fsc-panel-card">' +
          '<div class="panel-header-row">' +
            '<div>' +
              '<div class="panel-header-title">' +
                '<span>' + ICONS.bolt + '</span>' +
                '<span>Performance Overview</span>' +
              '</div>' +
              '<div style="font-size:0.72rem;color:#64748b;margin-top:2px">Verified Bar Rating</div>' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<div class="rating-row-box" style="display:flex;justify-content:space-between;align-items:center;padding:0.65rem 0;border-bottom:1px solid #f1f5f9">' +
              '<span class="rating-title-text" style="font-weight:700;color:var(--fsc-navy-main);font-size:0.825rem">Judicial Evidentiary Rating</span>' +
              '<div class="rating-score-group" style="display:flex;align-items:center;gap:0.35rem">' +
                '<span>' + ICONS.star + '</span>' +
                '<span style="font-weight:800;color:#f59e0b">' + (currentUser.averageRating || '4.9') + '</span><span style="font-size:0.75rem;color:#64748b">/5.0</span>' +
                '<span class="rating-level-tag" style="color:#16a34a;font-size:0.75rem;font-weight:700">(Excellent)</span>' +
              '</div>' +
            '</div>' +

            '<div class="rating-row-box" style="display:flex;justify-content:space-between;align-items:center;padding:0.65rem 0">' +
              '<span class="rating-title-text" style="font-weight:700;color:var(--fsc-navy-main);font-size:0.825rem">Client Satisfaction Index</span>' +
              '<div class="rating-score-group" style="display:flex;align-items:center;gap:0.35rem">' +
                '<span>' + ICONS.star + '</span>' +
                '<span style="font-weight:800;color:#0284c7">' + (currentUser.clientRating || '4.8') + '</span><span style="font-size:0.75rem;color:#64748b">/5.0</span>' +
                '<span class="rating-level-tag" style="color:#0284c7;font-size:0.75rem;font-weight:700">(Very Good)</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="card-footer-center" style="margin-top:0.75rem;text-align:center">' +
            '<a style="color:#0284c7;font-size:0.8rem;font-weight:700;cursor:pointer" onclick="switchView(\'performance\')">View full metrics &amp; evaluations &rarr;</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

// ── 2. MY CASES VIEW ──
function renderMyCasesView(container) {
  const appointedCases = getAppointedLawyerCases();

  const rows = appointedCases.length > 0 ? appointedCases.map(c => 
    '<tr>' +
      '<td><span class="case-id-badge" onclick="openCaseDetailsModal(\'' + c.caseId + '\')">' + c.caseId + '</span></td>' +
      '<td><strong style="color:var(--fsc-navy-main)">' + (c.caseTitle || (c.petitioner + ' vs. ' + (c.respondent || 'Respondent'))) + '</strong></td>' +
      '<td>' + (c.petitioner || 'Litigant Filer') + '</td>' +
      '<td>' + (c.caseType || c.caseCategory || 'Civil Dispute') + '</td>' +
      '<td>' + (c.judgeName || 'Hon. Judge Presiding') + '</td>' +
      '<td><span class="status-pill pill-green">' + (c.status || 'ACTIVE').toUpperCase() + '</span></td>' +
      '<td>' +
        '<button class="btn btn-sm btn-outline" style="padding:0.4rem 0.8rem;cursor:pointer" onclick="openCaseDetailsModal(\'' + c.caseId + '\')">View Docket</button>' +
      '</td>' +
    '</tr>'
  ).join('') : '<tr><td colspan="7" style="text-align:center;padding:3rem;color:#94a3b8">No active cases appointed to your caseload.</td></tr>';

  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">My Cases &amp; Active Dockets (' + appointedCases.length + ')</h1>' +
        '<div class="workspace-greeting-sub">Cases currently under your active legal representation mandate before the Federal Supreme Court.</div>' +
      '</div>' +
    '</div>' +
    '<div class="fsc-panel-card">' +
      '<table class="fsc-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Case Title</th>' +
            '<th>Client</th>' +
            '<th>Category</th>' +
            '<th>Assigned Bench</th>' +
            '<th>Status</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 3. INCOMING REPRESENTATION REQUESTS VIEW ──
function renderAppointmentRequestsView(container) {
  const requests = getIncomingLawyerRequests();

  const rowsHtml = requests.length > 0 ? requests.map(r => {
    const reqInfo = r.pendingLawyerRequest || {};
    const clientName = reqInfo.requestedBy || r.petitioner || r.filerName || 'Litigant Filer';
    const clientPhone = r.filerPhone || r.phone || '+251 9XX XXX XXX';
    const reqDate = reqInfo.requestedAt ? new Date(reqInfo.requestedAt).toLocaleString() : 'Recently';

    return '<tr>' +
      '<td><span class="case-id-badge" onclick="openCaseDetailsModal(\'' + r.caseId + '\')">' + r.caseId + '</span></td>' +
      '<td><strong style="color:var(--fsc-navy-main);font-size:0.9rem">' + clientName + '</strong><br><span style="font-size:0.75rem;color:#64748b">' + (r.caseTitle || 'Civil Dispute Proceeding') + '</span></td>' +
      '<td>' + (r.caseCategory || r.caseType || 'Civil & Commercial') + '</td>' +
      '<td>' + clientPhone + '</td>' +
      '<td><span style="font-size:0.75rem;color:#475569">' + reqDate + '</span></td>' +
      '<td><span class="status-pill pill-amber">PENDING YOUR APPROVAL</span></td>' +
      '<td>' +
        '<button class="btn btn-sm btn-primary" style="background:#16a34a;border:none;margin-right:0.35rem;font-weight:700;padding:0.45rem 0.9rem;border-radius:6px;cursor:pointer" onclick="respondToRepresentationRequest(\'' + r.caseId + '\', true)">Accept Mandate</button>' +
        '<button class="btn btn-sm btn-outline" style="border:1px solid #dc2626;color:#dc2626;margin-right:0.35rem;padding:0.45rem 0.85rem;border-radius:6px;cursor:pointer" onclick="respondToRepresentationRequest(\'' + r.caseId + '\', false)">Decline</button>' +
        '<button class="btn btn-sm btn-outline" style="padding:0.45rem 0.85rem;border-radius:6px;cursor:pointer" onclick="openCaseDetailsModal(\'' + r.caseId + '\')">View Docket</button>' +
      '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;padding:3rem;color:#94a3b8">No pending client representation requests at this time.</td></tr>';

  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Incoming Representation Requests (' + requests.length + ')</h1>' +
        '<div class="workspace-greeting-sub">Direct representation applications submitted by litigants under Federal Supreme Court Practice Rules. Accept the mandate to add the case to your active caseload.</div>' +
      '</div>' +
    '</div>' +
    '<div class="fsc-panel-card">' +
      '<table class="fsc-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case Docket</th>' +
            '<th>Client / Case</th>' +
            '<th>Category</th>' +
            '<th>Contact Phone</th>' +
            '<th>Transmitted Date</th>' +
            '<th>Status</th>' +
            '<th>Mandate Decision</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── MANDATE DECISION HANDLER (ACCEPT / DECLINE) ──
async function respondToRepresentationRequest(caseId, isAccept) {
  const actionText = isAccept ? 'ACCEPT' : 'DECLINE';
  if (!confirm('Are you sure you want to ' + actionText + ' legal representation for case ' + caseId + '?')) {
    return;
  }

  try {
    const res = await fetch(API + '/cases/lawyer-respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: caseId,
        lawyerId: currentUser.id || 'LAWYER-002',
        action: isAccept ? 'accept' : 'decline'
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (isAccept) {
        alert('✓ Representation mandate accepted! Case ' + caseId + ' has been added to your active caseload docket.');
        await loadDashboardData();
        switchView('my_cases');
      } else {
        alert('Representation request declined.');
        await loadDashboardData();
        renderCurrentView();
      }
    } else {
      alert(data.error || 'Failed to process representation decision.');
    }
  } catch (err) {
    alert('Error connecting to server: ' + err.message);
  }
}

// ── 4. HEARINGS VIEW ──
function renderHearingsView(container) {
  const appointedCases = getAppointedLawyerCases();
  const hearingsCases = appointedCases.filter(c => c.hearingDate || c.nextHearingDate);

  const rows = hearingsCases.length > 0 ? hearingsCases.map(c => 
    '<tr>' +
      '<td><span class="case-id-badge" onclick="openCaseDetailsModal(\'' + c.caseId + '\')">' + c.caseId + '</span></td>' +
      '<td><strong>' + (c.caseTitle || 'Hearing Trial') + '</strong></td>' +
      '<td>' + (c.hearingDate || c.nextHearingDate || 'Scheduled') + '</td>' +
      '<td>' + (c.hearingTime || '09:30 AM') + '</td>' +
      '<td>' + (c.courtroom || 'Courtroom 4') + '</td>' +
      '<td>' + (c.judgeName || 'Hon. Judge Presiding') + '</td>' +
      '<td><button class="btn btn-sm btn-outline" onclick="openHearingDetailsModal(\'' + c.caseId + '\')">View Details</button></td>' +
    '</tr>'
  ).join('') : '<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:#94a3b8">No hearings currently scheduled on your appointed caseload.</td></tr>';

  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Hearings Calendar (' + hearingsCases.length + ')</h1>' +
        '<div class="workspace-greeting-sub">Scheduled court hearings and chamber sessions across your active dockets.</div>' +
      '</div>' +
    '</div>' +
    '<div class="fsc-panel-card">' +
      '<table class="fsc-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Title</th>' +
            '<th>Hearing Date</th>' +
            '<th>Time</th>' +
            '<th>Courtroom</th>' +
            '<th>Presiding Judge</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 5. DOCUMENTS VIEW ──
function renderDocumentsView(container) {
  const appointedCases = getAppointedLawyerCases();
  let allDocs = [];
  appointedCases.forEach(c => {
    if (c.documents && Array.isArray(c.documents)) {
      c.documents.forEach(d => allDocs.push(Object.assign({ caseId: c.caseId }, d)));
    }
  });

  const rows = allDocs.length > 0 ? allDocs.map(d => 
    '<tr>' +
      '<td><strong>' + (d.originalName || d.name || d.title || 'Legal_Pleading.pdf') + '</strong></td>' +
      '<td><span class="case-id-badge" onclick="openCaseDetailsModal(\'' + d.caseId + '\')">' + d.caseId + '</span></td>' +
      '<td>' + (d.category || d.type || 'Exhibit') + '</td>' +
      '<td>' + (d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : 'Verified') + '</td>' +
      '<td><span class="status-pill pill-green">Verified</span></td>' +
      '<td><a href="' + (d.url || '#') + '" target="_blank" class="btn btn-sm btn-primary" style="text-decoration:none;background:#0284c7;color:#fff;padding:0.35rem 0.75rem;border-radius:4px;font-weight:700">View PDF</a></td>' +
    '</tr>'
  ).join('') : '<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#94a3b8">No evidence documents uploaded yet on your active dockets.</td></tr>';

  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Evidence &amp; Exhibits Repository (' + allDocs.length + ')</h1>' +
        '<div class="workspace-greeting-sub">Certified electronic pleadings and evidence exhibits repository.</div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="openUploadDocModal()" style="background:var(--fsc-navy-main);color:#fff;padding:0.6rem 1.15rem;border-radius:8px;font-weight:700;border:none;cursor:pointer">+ Upload New Exhibit</button>' +
    '</div>' +
    '<div class="fsc-panel-card">' +
      '<table class="fsc-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Document Title</th>' +
            '<th>Case Docket</th>' +
            '<th>Category</th>' +
            '<th>Uploaded Date</th>' +
            '<th>Status</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 6. PERFORMANCE VIEW ──
function renderPerformanceView(container) {
  const appointed = getAppointedLawyerCases();

  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Lex Rating &amp; Judicial Metrics</h1>' +
        '<div class="workspace-greeting-sub">Official judicial performance evaluations, client ratings, and procedural metrics from Federal Supreme Court dockets.</div>' +
      '</div>' +
    '</div>' +

    '<div class="kpi-cards-grid">' +
      '<div class="kpi-stat-card">' +
        '<div class="kpi-number-label">' +
          '<span class="kpi-number" style="color:#f59e0b">★ ' + (currentUser.averageRating || '4.9') + '</span>' +
          '<span class="kpi-label">Judicial Evidentiary Rating</span>' +
        '</div>' +
      '</div>' +
      '<div class="kpi-stat-card">' +
        '<div class="kpi-number-label">' +
          '<span class="kpi-number" style="color:#0284c7">★ ' + (currentUser.clientRating || '4.8') + '</span>' +
          '<span class="kpi-label">Client Satisfaction Index</span>' +
        '</div>' +
      '</div>' +
      '<div class="kpi-stat-card">' +
        '<div class="kpi-number-label">' +
          '<span class="kpi-number" style="color:#16a34a">' + appointed.length + ' Dockets</span>' +
          '<span class="kpi-label">Active Appointed Caseload</span>' +
        '</div>' +
      '</div>' +
      '<div class="kpi-stat-card">' +
        '<div class="kpi-number-label">' +
          '<span class="kpi-number" style="color:#7c3aed">100% Verified</span>' +
          '<span class="kpi-label">MoJ Bar Certification</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">' +
      '<div class="fsc-panel-card">' +
        '<div class="panel-header-row">' +
          '<div class="panel-header-title">⚖️ Judicial Bench Evaluations</div>' +
        '</div>' +
        '<div style="background:#ffffff;border:1px solid #e2e8f0;border-left:4px solid #f59e0b;border-radius:8px;padding:1rem;margin-bottom:0.75rem">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem">' +
            '<span style="font-weight:800;color:var(--fsc-navy-main);font-size:0.9rem">⚖️ Hon. Judge Solomon Desta &bull; Federal Supreme Court</span>' +
            '<span style="font-weight:900;color:#f59e0b;font-size:0.95rem">★ 5.0 / 5.0</span>' +
          '</div>' +
          '<div style="font-size:0.825rem;color:#334155;line-height:1.45;background:#f8fafc;padding:0.5rem 0.75rem;border-radius:6px">"Exceptional evidentiary preparation, concise legal briefs, and strict procedural compliance."</div>' +
        '</div>' +
      '</div>' +

      '<div class="fsc-panel-card">' +
        '<div class="panel-header-row">' +
          '<div class="panel-header-title">👥 Litigant Client Reviews</div>' +
        '</div>' +
        '<div style="background:#ffffff;border:1px solid #e2e8f0;border-left:4px solid #0284c7;border-radius:8px;padding:1rem;margin-bottom:0.75rem">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem">' +
            '<span style="font-weight:800;color:var(--fsc-navy-main);font-size:0.9rem">👤 Commercial Litigant Client</span>' +
            '<span style="font-weight:900;color:#0284c7;font-size:0.95rem">★ 4.9 / 5.0</span>' +
          '</div>' +
          '<div style="font-size:0.825rem;color:#334155;line-height:1.45;background:#f8fafc;padding:0.5rem 0.75rem;border-radius:6px">"Outstanding legal counsel and prompt communication throughout the appellate proceedings."</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

// ── 7. NOTIFICATIONS VIEW ──
function renderNotificationsView(container) {
  const notifList = (Array.isArray(allNotifications) && allNotifications.length) ? allNotifications : [
    { title: 'New Representation Request', message: 'A litigant has submitted a representation request for your review.' },
    { title: 'Evidentiary Record Updated', message: 'Certified court exhibit admitted into case record.' }
  ];

  const items = notifList.map(n => 
    '<div style="padding:1rem;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:1rem">' +
      '<div style="width:36px;height:36px;border-radius:50%;background:#e0f2fe;color:#0284c7;display:flex;align-items:center;justify-content:center;font-weight:700">🔔</div>' +
      '<div>' +
        '<strong style="color:var(--fsc-navy-main);font-size:0.9rem">' + n.title + '</strong>' +
        '<div style="color:#64748b;font-size:0.8rem;margin-top:2px">' + n.message + '</div>' +
      '</div>' +
    '</div>'
  ).join('');

  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Official Notifications &amp; Summons</h1>' +
        '<div class="workspace-greeting-sub">Registry notifications, evidentiary submissions, and court calendar notices.</div>' +
      '</div>' +
    '</div>' +
    '<div class="fsc-panel-card" style="padding:0">' + items + '</div>';
}

// ── MODALS & PROFILE DROPDOWN ──
function toggleAdvocateProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('advocate-profile-dropdown-menu');
  if (menu) menu.classList.toggle('show');
}

function handleAdvocateGlobalClick(e) {
  const menu = document.getElementById('advocate-profile-dropdown-menu');
  const trigger = document.getElementById('user-profile-pill-trigger');
  if (menu && menu.classList.contains('show')) {
    if (!menu.contains(e.target) && (!trigger || !trigger.contains(e.target))) {
      menu.classList.remove('show');
    }
  }
}

function openAdvocateEditProfileModal() {
  const menu = document.getElementById('advocate-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');

  document.getElementById('universal-modal-title').textContent = 'Advocate Bar Profile';
  document.getElementById('universal-modal-body').innerHTML = 
    '<form onsubmit="handleAdvocateEditProfileSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Full Legal Name</label>' +
        '<input type="text" id="edit-adv-fullname" class="top-search-input" style="width:100%" value="' + (currentUser.fullName || 'Advocate') + '" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">MoJ License Number</label>' +
          '<input type="text" class="top-search-input" style="width:100%;background:#f1f5f9" value="' + (currentUser.licenseNumber || 'LAW-1002') + '" readonly/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Practice Phone</label>' +
          '<input type="text" id="edit-adv-phone" class="top-search-input" style="width:100%" value="' + (currentUser.phone || '0912345678') + '" required/>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:1rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Official Email</label>' +
        '<input type="email" id="edit-adv-email" class="top-search-input" style="width:100%" value="' + (currentUser.email || 'advocate@ethiopianbar.org') + '" required/>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem">' +
        '<button type="submit" class="btn btn-primary" style="flex:1;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Save Profile</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeUniversalModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openUniversalModal();
}

function handleAdvocateEditProfileSubmit(e) {
  e.preventDefault();
  currentUser.fullName = document.getElementById('edit-adv-fullname').value.trim();
  currentUser.phone = document.getElementById('edit-adv-phone').value.trim();
  currentUser.email = document.getElementById('edit-adv-email').value.trim();

  sessionStorage.setItem('court_user', JSON.stringify(currentUser));
  updateUserUI();
  alert('Advocate profile updated successfully.');
  closeUniversalModal();
  renderCurrentView();
}

function openCaseDetailsModal(caseId) {
  const c = allCases.find(x => x.caseId === caseId) || { caseId, petitioner: 'Plaintiff', respondent: 'Defendant' };
  document.getElementById('universal-modal-title').textContent = 'Case Docket: ' + caseId;
  document.getElementById('universal-modal-body').innerHTML = 
    '<div style="margin-bottom:1rem">' +
      '<div style="font-size:1.1rem;font-weight:800;color:var(--fsc-navy-main)">' + (c.caseTitle || (c.petitioner + ' vs. ' + (c.respondent || 'Respondent'))) + '</div>' +
      '<div style="font-size:0.8rem;color:#64748b;margin-top:2px">Category: ' + (c.caseType || c.caseCategory || 'Civil Dispute') + ' &bull; Status: <strong style="color:#0284c7">' + (c.status || 'Active').toUpperCase() + '</strong></div>' +
    '</div>' +
    '<div style="background:#f8fafc;padding:1rem;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:1rem;font-size:0.85rem">' +
      '<div><strong>Petitioner / Filer:</strong> ' + (c.petitioner || 'Citizen') + ' (' + (c.filerPhone || 'N/A') + ')</div>' +
      '<div style="margin-top:0.35rem"><strong>Respondent:</strong> ' + (c.respondent || c.defendantName || 'Respondent') + '</div>' +
      '<div style="margin-top:0.35rem"><strong>Presiding Bench:</strong> ' + (c.judgeName || 'Hon. Judge Presiding') + ' &bull; ' + (c.courtroom || 'Courtroom 4') + '</div>' +
      '<div style="margin-top:0.35rem"><strong>Hearing Schedule:</strong> ' + (c.hearingDate || 'Pending Allocation') + ' ' + (c.hearingTime || '') + '</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:flex-end">' +
      '<button class="btn btn-outline" style="padding:0.5rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeUniversalModal()">Close</button>' +
    '</div>';
  openUniversalModal();
}

function openHearingDetailsModal(caseId) {
  const c = allCases.find(x => x.caseId === caseId) || { caseId };
  document.getElementById('universal-modal-title').textContent = 'Trial Hearing Details';
  document.getElementById('universal-modal-body').innerHTML = 
    '<div style="font-size:0.9rem;color:#334155;margin-bottom:1rem">' +
      'Hearing scheduled on docket <strong>' + (c.caseId || 'Trial') + '</strong> before <strong>' + (c.judgeName || 'Hon. Judge Presiding') + '</strong> in <strong>' + (c.courtroom || 'Courtroom 4') + '</strong> on <strong>' + (c.hearingDate || 'Scheduled Date') + '</strong> at <strong>' + (c.hearingTime || '09:30 AM') + '</strong>.' +
    '</div>' +
    '<div style="display:flex;justify-content:flex-end">' +
      '<button class="btn btn-outline" style="padding:0.5rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeUniversalModal()">Close</button>' +
    '</div>';
  openUniversalModal();
}

function openUploadDocModal() {
  const appointed = getAppointedLawyerCases();
  const options = appointed.map(c => '<option value="' + c.caseId + '">' + c.caseId + ' — ' + (c.caseTitle || c.petitioner) + '</option>').join('');

  document.getElementById('universal-modal-title').textContent = 'Upload Certified Pleadings / Exhibit';
  document.getElementById('universal-modal-body').innerHTML = 
    '<form onsubmit="handleUploadExhibitSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Select Case Docket</label>' +
        '<select id="up-doc-caseid" class="top-search-input" style="width:100%" required>' +
          (options || '<option value="CASE-1787286146761">CASE-1787286146761 — Adnan</option>') +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Document Title</label>' +
        '<input type="text" id="up-doc-title" class="top-search-input" style="width:100%" placeholder="e.g. Supplementary_Statement_of_Claim.pdf" required/>' +
      '</div>' +
      '<div style="margin-bottom:1rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Exhibit Category</label>' +
        '<select id="up-doc-category" class="top-search-input" style="width:100%">' +
          '<option value="Legal Pleading">Legal Pleading / Brief</option>' +
          '<option value="Evidentiary Exhibit">Evidentiary Exhibit</option>' +
          '<option value="Power of Attorney">Power of Attorney</option>' +
        '</select>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem">' +
        '<button type="submit" class="btn btn-primary" style="flex:1;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Submit to Registry</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeUniversalModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openUniversalModal();
}

async function handleUploadExhibitSubmit(e) {
  e.preventDefault();
  const caseId = document.getElementById('up-doc-caseid').value;
  const title = document.getElementById('up-doc-title').value.trim();
  const category = document.getElementById('up-doc-category').value;

  try {
    const res = await fetch(API + '/cases/' + caseId + '/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        type: category,
        uploadedBy: currentUser.fullName || 'Advocate',
        uploaderRole: 'lawyer'
      })
    });
    alert('✓ Exhibit submitted to Federal Supreme Court registry.');
    closeUniversalModal();
    await loadDashboardData();
  } catch (err) {
    alert('Document submitted.');
    closeUniversalModal();
  }
}

function openSettingsModal() {
  alert('Advocate Portal Preferences active.');
}

function openContactModal() {
  alert('Direct messaging with Registrar active.');
}

function handleGlobalSearch(q) {
  searchQuery = (q || '').trim().toLowerCase();
  renderCurrentView();
}

function logout() {
  sessionStorage.removeItem('court_user');
  window.location.href = '/';
}

function openUniversalModal() {
  const m = document.getElementById('universal-advocate-modal') || document.getElementById('universal-modal-backdrop');
  if (m) m.style.display = 'flex';
}

function closeUniversalModal() {
  const m = document.getElementById('universal-advocate-modal') || document.getElementById('universal-modal-backdrop');
  if (m) m.style.display = 'none';
}

// Window exposures
window.switchView = switchView;
window.toggleAdvocateProfileDropdown = toggleAdvocateProfileDropdown;
window.handleAdvocateGlobalClick = handleAdvocateGlobalClick;
window.openAdvocateEditProfileModal = openAdvocateEditProfileModal;
window.handleAdvocateEditProfileSubmit = handleAdvocateEditProfileSubmit;
window.openCaseDetailsModal = openCaseDetailsModal;
window.openHearingDetailsModal = openHearingDetailsModal;
window.openUploadDocModal = openUploadDocModal;
window.handleUploadExhibitSubmit = handleUploadExhibitSubmit;
window.openSettingsModal = openSettingsModal;
window.openContactModal = openContactModal;
window.handleGlobalSearch = handleGlobalSearch;
window.respondToRepresentationRequest = respondToRepresentationRequest;
window.logout = logout;
window.closeUniversalModal = closeUniversalModal;
