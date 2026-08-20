'use strict';

const API = '/api';
let currentUser = null;
let currentView = 'dashboard';
let allCases = [];
let allNotifications = [];
let verifiedLicenses = [];
let searchQuery = '';

// Self-contained inline SVGs for client-side rendering
const ICONS = {
  folder: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
  clock: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  calendar: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>',
  gavel: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>',
  scales: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
  star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  doc: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  bolt: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  location: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  phone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = sessionStorage.getItem('court_user');
    if (stored) {
      currentUser = JSON.parse(stored);
      if (currentUser.role === 'judge') {
        window.location.href = '/judge';
        return;
      }
    } else {
      currentUser = {
        id: "LAW-1001",
        username: "qalalew",
        fullName: "Kebede Haile Mariam",
        role: "lawyer",
        licenseNumber: "LAW-1001",
        specialization: "Criminal & Commercial",
        rating: 4.9,
        clientRating: 4.7
      };
      sessionStorage.setItem('court_user', JSON.stringify(currentUser));
    }
  } catch (e) {
    currentUser = { fullName: "Kebede Haile Mariam", role: "lawyer", licenseNumber: "LAW-1001", rating: 4.9, clientRating: 4.7 };
  }

  updateUserUI();
  await loadDashboardData();
});

function updateUserUI() {
  const name = (currentUser && (currentUser.fullName || currentUser.username)) || 'Kebede Haile Mariam';
  const role = (currentUser && currentUser.role ? currentUser.role : 'Advocate').toUpperCase();
  
  const nameEl = document.getElementById('top-user-name');
  const roleEl = document.getElementById('top-user-role');
  const avatarEl = document.getElementById('user-avatar-initials');

  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role.charAt(0) + role.slice(1).toLowerCase();
  
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  if (avatarEl) avatarEl.textContent = initials || 'KH';
  const dropAvatar = document.getElementById('advocate-dropdown-avatar');
  if (dropAvatar) dropAvatar.textContent = initials || 'KH';
  const dropName = document.getElementById('advocate-dropdown-fullname');
  if (dropName) dropName.textContent = name;
  const dropSub = document.getElementById('advocate-dropdown-sub');
  if (dropSub) dropSub.textContent = role + ' · ' + (currentUser.licenseNumber || 'LAW-1001');
}

async function loadDashboardData() {
  try {
    const [casesRes, notifsRes, licRes] = await Promise.all([
      fetch(API + '/cases').catch(() => null),
      fetch(API + '/notifications').catch(() => null),
      fetch(API + '/licenses?status=ACTIVE').catch(() => null)
    ]);

    if (casesRes && casesRes.ok) allCases = await casesRes.json();
    if (notifsRes && notifsRes.ok) allNotifications = await notifsRes.json();
    if (licRes && licRes.ok) verifiedLicenses = await licRes.json();
    
    const badge = document.getElementById('top-notif-count');
    if (badge) badge.textContent = (allNotifications && allNotifications.length) ? allNotifications.length : '3';
  } catch (err) {
    console.warn('Dashboard data fetch warning:', err);
  }
  renderCurrentView();
}

function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  const targetId = 'btn-nav-' + viewName.replace('appointment_', '').replace('my_', '');
  const activeBtn = document.getElementById(targetId) ||
                    Array.from(document.querySelectorAll('.sidebar-btn')).find(b => b.textContent.toLowerCase().includes(viewName.replace('_', ' ')));
  if (activeBtn) activeBtn.classList.add('active');

  renderCurrentView();
}

function handleGlobalSearch(q) {
  searchQuery = (q || '').toLowerCase().trim();
  renderCurrentView();
}

function renderCurrentView() {
  const container = document.getElementById('dynamic-workspace-view');
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

function renderAdvocateDashboard(container) {
  const activeCasesList = (allCases && allCases.length) ? allCases.filter(c => c.status !== 'closed' && c.status !== 'Decided') : [];
  const activeCount = activeCasesList.length || 8;
  const pendingCount = 3;
  const hearingsCount = 4;
  const completedCount = (allCases && allCases.length) ? allCases.filter(c => c.status === 'closed' || c.status === 'Decided').length : 27;

  let displayCases = activeCasesList.length ? activeCasesList : allCases;
  if (searchQuery) {
    displayCases = allCases.filter(c => 
      (c.caseId && c.caseId.toLowerCase().includes(searchQuery)) ||
      (c.caseTitle && c.caseTitle.toLowerCase().includes(searchQuery)) ||
      (c.jurisdiction && c.jurisdiction.toLowerCase().includes(searchQuery))
    );
  }

  const nextCase = (allCases && allCases.find(c => c.nextHearingDate || (c.appointments && c.appointments.length))) || (allCases && allCases[0]) || { caseId: 'CASE-178721596417', caseTitle: 'Awash International Bank vs. Blue Nile Holdings', jurisdiction: 'Federal Supreme Court', courtroom: 'Courtroom 4', hearingTime: '09:30 AM' };
  const hearingDateObj = nextCase.nextHearingDate ? new Date(nextCase.nextHearingDate) : new Date("2026-05-27T09:30:00Z");
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const dowNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const nextMonth = monthNames[hearingDateObj.getMonth()];
  const nextDay = hearingDateObj.getDate();
  const nextDow = dowNames[hearingDateObj.getDay()];

  const casesRowsHtml = displayCases.slice(0, 5).map(c => {
    let pillClass = 'pill-amber';
    let statusText = (c.status || 'EVIDENCE STAGE').toUpperCase();
    if (c.status === 'assigned') { pillClass = 'pill-blue'; statusText = 'ASSIGNED'; }
    else if (c.status === 'screening') { pillClass = 'pill-purple'; statusText = 'SCREENING'; }
    else if (c.status === 'hearing_scheduled') { pillClass = 'pill-green'; statusText = 'HEARING SCHEDULED'; }
    else if (c.status === 'Decided' || c.status === 'closed') { pillClass = 'pill-green'; statusText = 'DECIDED'; }
    else if (c.status === 'evidence_stage') { pillClass = 'pill-amber'; statusText = 'EVIDENCE STAGE'; }

    const hearingFmt = c.hearingTime ? 
      (c.nextHearingDate ? new Date(c.nextHearingDate).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'}) : 'May 27, 2026') + '<br><span style="font-size:0.72rem;color:#64748b">' + c.hearingTime + '</span>' 
      : 'May 27, 2026<br><span style="font-size:0.72rem;color:#64748b">09:30 AM</span>';

    const titleParts = (c.caseTitle || 'Court Case').split('vs.');
    const plaintiffPart = titleParts[0] ? titleParts[0].trim() : '';
    const defPart = titleParts[1] ? titleParts[1].trim() : '';

    return '<tr>' +
      '<td><span class="case-id-badge" onclick="openCaseDetailsModal(\'' + c.caseId + '\')">' + c.caseId + '</span></td>' +
      '<td><strong>' + plaintiffPart + '</strong>' + (defPart ? '<br><span style="font-size:0.75rem;color:#64748b">vs. ' + defPart + '</span>' : '') + '</td>' +
      '<td><span class="court-bench-name">' + (c.jurisdiction || 'Federal Supreme Court') + '</span></td>' +
      '<td><span class="hearing-date-time">' + hearingFmt + '</span></td>' +
      '<td><span class="status-pill ' + pillClass + '">' + statusText + '</span></td>' +
      '<td style="text-align:right"><button class="icon-action-btn" style="width:26px;height:26px;font-size:0.75rem" onclick="openCaseDetailsModal(\'' + c.caseId + '\')">⋮</button></td>' +
    '</tr>';
  }).join('');

  const notifRowsHtml = (allNotifications && allNotifications.length ? allNotifications : [
    { title: 'New document uploaded in CASE-178721596417', message: 'Evidence_02.pdf was uploaded by the court.' },
    { title: 'Hearing scheduled for CASE-178721596417', message: 'May 27, 2026 at 09:30 AM in Courtroom 4.' },
    { title: 'New representation request received', message: 'Hana Tesfaye has requested your legal representation.' }
  ]).slice(0, 3).map((n, i) => {
    let iconSvg = ICONS.doc;
    let iconBg = '#dcfce7';
    let iconColor = '#16a34a';
    let timeStr = '2 hours ago';
    if (i === 1) { iconSvg = ICONS.calendar; iconBg = '#e0f2fe'; iconColor = '#0284c7'; timeStr = '1 day ago'; }
    if (i === 2) { iconSvg = ICONS.user; iconBg = '#ffedd5'; iconColor = '#ea580c'; timeStr = '2 days ago'; }

    return '<div class="notif-item-row">' +
      '<div class="notif-icon-circle" style="background:' + iconBg + ';color:' + iconColor + '">' + iconSvg + '</div>' +
      '<div class="notif-content-wrap">' +
        '<div class="notif-title-text">' + (n.title || '') + '</div>' +
        '<div class="notif-sub-text">' + (n.message || '') + '</div>' +
      '</div>' +
      '<div class="notif-timestamp-tag">' + timeStr + '</div>' +
    '</div>';
  }).join('');

  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Good morning, ' + (currentUser.fullName || 'Kebede Haile') + '</h1>' +
        '<div class="workspace-greeting-sub">Here is what is happening with your cases today.</div>' +
      '</div>' +
      '<div class="workspace-date-location">' +
        '<span>May 24, 2026</span>' +
        '<span>Addis Ababa, Ethiopia</span>' +
      '</div>' +
    '</div>' +

    '<div class="kpi-cards-grid">' +
      '<div class="kpi-stat-card">' +
        '<div class="kpi-top-row">' +
          '<div class="kpi-icon-box kpi-icon-blue">' + ICONS.folder + '</div>' +
          '<div class="kpi-number-label">' +
            '<span class="kpi-number">' + activeCount + '</span>' +
            '<span class="kpi-label">Active Cases</span>' +
          '</div>' +
        '</div>' +
        '<a class="kpi-card-link" onclick="switchView(\'my_cases\')">View all cases &rarr;</a>' +
      '</div>' +

      '<div class="kpi-stat-card">' +
        '<div class="kpi-top-row">' +
          '<div class="kpi-icon-box kpi-icon-orange">' + ICONS.clock + '</div>' +
          '<div class="kpi-number-label">' +
            '<span class="kpi-number">' + pendingCount + '</span>' +
            '<span class="kpi-label">Pending Requests</span>' +
          '</div>' +
        '</div>' +
        '<a class="kpi-card-link" onclick="switchView(\'appointment_requests\')">View requests &rarr;</a>' +
      '</div>' +

      '<div class="kpi-stat-card">' +
        '<div class="kpi-top-row">' +
          '<div class="kpi-icon-box kpi-icon-green">' + ICONS.calendar + '</div>' +
          '<div class="kpi-number-label">' +
            '<span class="kpi-number">' + hearingsCount + '</span>' +
            '<span class="kpi-label">Hearings This Week</span>' +
          '</div>' +
        '</div>' +
        '<a class="kpi-card-link" onclick="switchView(\'hearings\')">View calendar &rarr;</a>' +
      '</div>' +

      '<div class="kpi-stat-card">' +
        '<div class="kpi-top-row">' +
          '<div class="kpi-icon-box kpi-icon-purple">' + ICONS.gavel + '</div>' +
          '<div class="kpi-number-label">' +
            '<span class="kpi-number">' + completedCount + '</span>' +
            '<span class="kpi-label">Completed Cases</span>' +
          '</div>' +
        '</div>' +
        '<a class="kpi-card-link" onclick="switchView(\'my_cases\')">View history &rarr;</a>' +
      '</div>' +
    '</div>' +

    '<div class="dashboard-2col-grid">' +
      '<div>' +
        '<div class="fsc-panel-card">' +
          '<div class="panel-header-row">' +
            '<div class="panel-header-title">' +
              '<span>' + ICONS.scales + '</span>' +
              '<span>Active Cases</span>' +
            '</div>' +
            '<a class="panel-header-link" onclick="switchView(\'my_cases\')">View all cases &rarr;</a>' +
          '</div>' +

          '<div style="overflow-x:auto">' +
            '<table class="fsc-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Case ID</th>' +
                  '<th>Case Title</th>' +
                  '<th>Court</th>' +
                  '<th>Next Hearing</th>' +
                  '<th>Status</th>' +
                  '<th></th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                casesRowsHtml +
              '</tbody>' +
            '</table>' +
          '</div>' +

          '<div class="card-footer-center">' +
            '<a onclick="switchView(\'my_cases\')">View all active cases &rarr;</a>' +
          '</div>' +
        '</div>' +

        '<div class="fsc-panel-card">' +
          '<div class="panel-header-row">' +
            '<div class="panel-header-title">' +
              '<span>' + ICONS.bell + '</span>' +
              '<span>Recent Notifications</span>' +
            '</div>' +
          '</div>' +

          '<div>' +
            notifRowsHtml +
          '</div>' +

          '<div class="card-footer-center">' +
            '<a onclick="switchView(\'notifications\')">View all notifications &rarr;</a>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div>' +
        '<div class="fsc-panel-card">' +
          '<div class="panel-header-row" style="margin-bottom:0.85rem">' +
            '<div class="panel-header-title">' +
              '<span>' + ICONS.calendar + '</span>' +
              '<span>Next Hearing</span>' +
            '</div>' +
          '</div>' +

          '<div class="hearing-card-body">' +
            '<div class="hearing-date-calendar-box">' +
              '<span class="cal-month">' + nextMonth + '</span>' +
              '<span class="cal-day">' + nextDay + '</span>' +
              '<span class="cal-dow">' + nextDow + '</span>' +
            '</div>' +
            '<div class="hearing-details-meta">' +
              '<div class="hearing-time-tag">' + (nextCase.hearingTime || '09:30 AM') + '</div>' +
              '<div class="hearing-case-num">' + (nextCase.caseId || 'CASE-178721596417') + '</div>' +
              '<div class="hearing-title-line">' + (nextCase.caseTitle || 'Awash International Bank vs. Blue Nile Holdings') + '</div>' +
              '<div class="hearing-location-line">' + ICONS.location + ' ' + (nextCase.courtroom || 'Courtroom 4') + ' &middot; ' + (nextCase.jurisdiction || 'Federal Supreme Court') + '</div>' +
            '</div>' +
          '</div>' +

          '<button class="btn-navy-full" onclick="openHearingDetailsModal(\'' + (nextCase.caseId || 'CASE-178721596417') + '\')">' +
            'View Hearing Details' +
          '</button>' +
        '</div>' +

        '<div class="fsc-panel-card">' +
          '<div class="panel-header-row">' +
            '<div>' +
              '<div class="panel-header-title">' +
                '<span>' + ICONS.bolt + '</span>' +
                '<span>Performance Overview</span>' +
              '</div>' +
              '<div style="font-size:0.72rem;color:#64748b;margin-top:2px">This Month</div>' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<div class="rating-row-box">' +
              '<span class="rating-title-text">Judicial Rating</span>' +
              '<div class="rating-score-group">' +
                '<span>' + ICONS.star + '</span>' +
                '<span>' + (currentUser.rating || '4.9') + '</span><span style="font-size:0.75rem;color:#64748b">/5.0</span>' +
                '<span class="rating-level-tag">(Excellent)</span>' +
              '</div>' +
            '</div>' +

            '<div class="rating-row-box">' +
              '<span class="rating-title-text">Client Rating</span>' +
              '<div class="rating-score-group">' +
                '<span>' + ICONS.star + '</span>' +
                '<span>' + (currentUser.clientRating || '4.7') + '</span><span style="font-size:0.75rem;color:#64748b">/5.0</span>' +
                '<span class="rating-level-tag" style="color:#0284c7">(Very Good)</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="card-footer-center">' +
            '<a onclick="switchView(\'performance\')">View full performance &rarr;</a>' +
          '</div>' +
        '</div>' +

        '<div class="fsc-panel-card">' +
          '<div class="panel-header-row">' +
            '<div class="panel-header-title">' +
              '<span>' + ICONS.bolt + '</span>' +
              '<span>Quick Actions</span>' +
            '</div>' +
          '</div>' +

          '<div>' +
            '<a class="quick-action-link" onclick="openUploadDocModal()">' +
              '<div class="quick-action-link-left">' +
                '<span>' + ICONS.doc + '</span>' +
                '<span>Upload Document</span>' +
              '</div>' +
              '<span>' + ICONS.chevronRight + '</span>' +
            '</a>' +
            '<a class="quick-action-link" onclick="openPostponeModal()">' +
              '<div class="quick-action-link-left">' +
                '<span>' + ICONS.calendar + '</span>' +
                '<span>Request Postponement</span>' +
              '</div>' +
              '<span>' + ICONS.chevronRight + '</span>' +
            '</a>' +
            '<a class="quick-action-link" onclick="switchView(\'hearings\')">' +
              '<div class="quick-action-link-left">' +
                '<span>' + ICONS.calendar + '</span>' +
                '<span>View Court Calendar</span>' +
              '</div>' +
              '<span>' + ICONS.chevronRight + '</span>' +
            '</a>' +
            '<a class="quick-action-link" onclick="openContactModal()">' +
              '<div class="quick-action-link-left">' +
                '<span>' + ICONS.phone + '</span>' +
                '<span>Contact Court Registry</span>' +
              '</div>' +
              '<span>' + ICONS.chevronRight + '</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +

    '</div>';
}

function renderMyCasesView(container) {
  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">My Case Docket</h1>' +
        '<div class="workspace-greeting-sub">Comprehensive real-time docket registry of all assigned cases.</div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="openUploadDocModal()" style="background:var(--fsc-navy-main);color:#fff;padding:0.6rem 1rem;border-radius:8px;font-weight:700;border:none;cursor:pointer">+ Submit Legal Motion</button>' +
    '</div>' +

    '<div class="fsc-panel-card">' +
      '<table class="fsc-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Title &amp; Parties</th>' +
            '<th>Division</th>' +
            '<th>Presiding Judge</th>' +
            '<th>Status</th>' +
            '<th>Actions</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          allCases.slice(0, 15).map(c => 
            '<tr>' +
              '<td><span class="case-id-badge" onclick="openCaseDetailsModal(\'' + c.caseId + '\')">' + c.caseId + '</span></td>' +
              '<td><strong>' + (c.caseTitle || '') + '</strong><br><span style="font-size:0.75rem;color:#64748b">' + (c.filer && c.filer.name ? c.filer.name : 'Plaintiff') + ' v. ' + (c.defendant && c.defendant.name ? c.defendant.name : 'Defendant') + '</span></td>' +
              '<td>' + (c.jurisdiction || 'Federal Supreme Court') + '</td>' +
              '<td>' + (c.judgeName || 'Hon. Judge Bekele Seyoum') + '</td>' +
              '<td><span class="status-pill ' + (c.status === 'closed' || c.status === 'Decided' ? 'pill-green' : 'pill-amber') + '">' + (c.status || 'Active').toUpperCase() + '</span></td>' +
              '<td><button class="btn btn-sm btn-outline" style="padding:0.35rem 0.65rem;border:1px solid #cbd5e1;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer" onclick="openCaseDetailsModal(\'' + c.caseId + '\')">View File</button></td>' +
            '</tr>'
          ).join('') +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderHearingsView(container) {
  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Court Hearing Calendar</h1>' +
        '<div class="workspace-greeting-sub">Scheduled oral arguments, pre-trial conferences, and judgment sessions.</div>' +
      '</div>' +
    '</div>' +

    '<div class="fsc-panel-card">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1rem">' +
        allCases.filter(c => c.nextHearingDate || (c.appointments && c.appointments.length)).slice(0, 6).map(c => {
          const dt = new Date(c.nextHearingDate || Date.now());
          const m = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][dt.getMonth()];
          const d = dt.getDate();
          const dow = ["SUN","MON","TUE","WED","THU","FRI","SAT"][dt.getDay()];
          return '<div class="hearing-card-body" style="background:#ffffff;border:1px solid #cbd5e1;cursor:pointer" onclick="openHearingDetailsModal(\'' + c.caseId + '\')">' +
            '<div class="hearing-date-calendar-box">' +
              '<span class="cal-month">' + m + '</span>' +
              '<span class="cal-day">' + d + '</span>' +
              '<span class="cal-dow">' + dow + '</span>' +
            '</div>' +
            '<div class="hearing-details-meta">' +
              '<div class="hearing-time-tag">' + (c.hearingTime || '09:30 AM') + '</div>' +
              '<div class="hearing-case-num">' + c.caseId + '</div>' +
              '<div class="hearing-title-line">' + (c.caseTitle || '') + '</div>' +
              '<div class="hearing-location-line">' + ICONS.location + ' ' + (c.courtroom || 'Courtroom 4') + ' &middot; ' + (c.jurisdiction || 'Federal Supreme Court') + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
}

function renderDocumentsView(container) {
  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Evidentiary Documents &amp; Pleadings</h1>' +
        '<div class="workspace-greeting-sub">Two-stage evidence discovery registry and confidential submissions.</div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="openUploadDocModal()" style="background:var(--fsc-navy-main);color:#fff;padding:0.6rem 1rem;border-radius:8px;font-weight:700;border:none;cursor:pointer">+ Upload New Evidence</button>' +
    '</div>' +

    '<div class="fsc-panel-card">' +
      '<table class="fsc-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Document Title</th>' +
            '<th>Case ID</th>' +
            '<th>Stage</th>' +
            '<th>Classification</th>' +
            '<th>File Status</th>' +
            '<th>Action</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          '<tr>' +
            '<td><strong>Commercial Bond Agreement (Exhibit A)</strong></td>' +
            '<td><span class="case-id-badge" onclick="openCaseDetailsModal(\'CASE-178721596417\')">CASE-178721596417</span></td>' +
            '<td><span class="status-pill pill-blue">Stage 1 Discovery</span></td>' +
            '<td><span class="status-pill pill-green">Public Record</span></td>' +
            '<td>Admitted by Court</td>' +
            '<td><button class="btn btn-sm btn-outline" onclick="alert(\'Viewing Bond_Agreement_2025.pdf\')">Download PDF</button></td>' +
          '</tr>' +
          '<tr>' +
            '<td><strong>Bank Default Notice &amp; Audit (Exhibit B)</strong></td>' +
            '<td><span class="case-id-badge" onclick="openCaseDetailsModal(\'CASE-178721596417\')">CASE-178721596417</span></td>' +
            '<td><span class="status-pill pill-amber">Stage 2 Trial</span></td>' +
            '<td><span class="status-pill pill-purple">Confidential Financial</span></td>' +
            '<td>Admitted by Court</td>' +
            '<td><button class="btn btn-sm btn-outline" onclick="alert(\'Viewing Evidence_02.pdf\')">Download PDF</button></td>' +
          '</tr>' +
          '<tr>' +
            '<td><strong>Ethio Telecom Infrastructure Lease Agreement</strong></td>' +
            '<td><span class="case-id-badge" onclick="openCaseDetailsModal(\'CASE-178719224815\')">CASE-178719224815</span></td>' +
            '<td><span class="status-pill pill-blue">Stage 1 Discovery</span></td>' +
            '<td><span class="status-pill pill-green">Public Record</span></td>' +
            '<td>Pending Screening</td>' +
            '<td><button class="btn btn-sm btn-outline" onclick="alert(\'Viewing Lease_Contract_2026.pdf\')">Download PDF</button></td>' +
          '</tr>' +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderAppointmentRequestsView(container) {
  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Client Representation Requests</h1>' +
        '<div class="workspace-greeting-sub">Review incoming requests from citizens and corporations seeking your counsel.</div>' +
      '</div>' +
    '</div>' +

    '<div class="fsc-panel-card">' +
      '<div style="display:grid;gap:1rem">' +
        '<div style="border:1px solid var(--fsc-border);border-radius:var(--fsc-radius-md);padding:1.25rem;display:flex;justify-content:space-between;align-items:center" id="req-card-1">' +
          '<div>' +
            '<span class="status-pill pill-purple" style="margin-bottom:0.4rem">COMMERCIAL CLAIM</span>' +
            '<h3 style="font-size:1.05rem;font-weight:700;color:var(--fsc-navy-main);margin-top:2px">Hana Tesfaye v. Commercial Bank of Ethiopia</h3>' +
            '<div style="font-size:0.8125rem;color:#64748b;margin-top:3px">Client: Hana Tesfaye (0911447788) &middot; Federal High Court Division</div>' +
          '</div>' +
          '<div style="display:flex;gap:0.5rem">' +
            '<button style="background:#16a34a;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;font-weight:700;cursor:pointer" onclick="acceptRequest(\'req-card-1\', \'Hana Tesfaye\')">Accept</button>' +
            '<button style="background:#fff;border:1px solid #cbd5e1;padding:0.5rem 1rem;border-radius:6px;font-weight:600;cursor:pointer" onclick="declineRequest(\'req-card-1\')">Decline</button>' +
          '</div>' +
        '</div>' +

        '<div style="border:1px solid var(--fsc-border);border-radius:var(--fsc-radius-md);padding:1.25rem;display:flex;justify-content:space-between;align-items:center" id="req-card-2">' +
          '<div>' +
            '<span class="status-pill pill-amber" style="margin-bottom:0.4rem">PROPERTY DISPUTE</span>' +
            '<h3 style="font-size:1.05rem;font-weight:700;color:var(--fsc-navy-main);margin-top:2px">Yared Girma v. Addis Ababa Housing Agency</h3>' +
            '<div style="font-size:0.8125rem;color:#64748b;margin-top:3px">Client: Yared Girma (0922339900) &middot; Federal Supreme Court</div>' +
          '</div>' +
          '<div style="display:flex;gap:0.5rem">' +
            '<button style="background:#16a34a;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;font-weight:700;cursor:pointer" onclick="acceptRequest(\'req-card-2\', \'Yared Girma\')">Accept</button>' +
            '<button style="background:#fff;border:1px solid #cbd5e1;padding:0.5rem 1rem;border-radius:6px;font-weight:600;cursor:pointer" onclick="declineRequest(\'req-card-2\')">Decline</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function acceptRequest(cardId, clientName) {
  const el = document.getElementById(cardId);
  if (el) el.innerHTML = '<div style="color:#16a34a;font-weight:700">Representation accepted for ' + clientName + '. Client has been notified via SMS.</div>';
  const badge = document.getElementById('sidebar-req-badge');
  if (badge) badge.textContent = Math.max(0, parseInt(badge.textContent || '1') - 1);
}

function declineRequest(cardId) {
  const el = document.getElementById(cardId);
  if (el) el.innerHTML = '<div style="color:#64748b;font-style:italic">Representation request declined.</div>';
  const badge = document.getElementById('sidebar-req-badge');
  if (badge) badge.textContent = Math.max(0, parseInt(badge.textContent || '1') - 1);
}

function renderPerformanceView(container) {
  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Advocate Performance Scorecard</h1>' +
        '<div class="workspace-greeting-sub">Official judicial evaluations from presiding judges and client review history.</div>' +
      '</div>' +
    '</div>' +

    '<div class="fsc-panel-card" style="margin-bottom:1.5rem">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:1rem">Judicial Evaluations (Presiding Judges)</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">' +
        '<div style="background:#f8fafc;padding:1.25rem;border-radius:8px;border:1px solid var(--fsc-border)">' +
          '<div style="font-size:0.825rem;color:#64748b">Overall Judicial Standing</div>' +
          '<div style="font-size:2rem;font-weight:800;color:var(--fsc-navy-main);margin:0.25rem 0;display:flex;align-items:center;gap:0.4rem">' + ICONS.star + ' ' + (currentUser.rating || '4.9') + ' <span style="font-size:1rem;color:#64748b">/ 5.0</span></div>' +
          '<span class="status-pill pill-green">Federal Supreme Bar Elite</span>' +
        '</div>' +
        '<div style="background:#f8fafc;padding:1.25rem;border-radius:8px;border:1px solid var(--fsc-border)">' +
          '<div style="font-size:0.825rem;color:#64748b">Client Satisfaction Rating</div>' +
          '<div style="font-size:2rem;font-weight:800;color:var(--fsc-navy-main);margin:0.25rem 0;display:flex;align-items:center;gap:0.4rem">' + ICONS.star + ' ' + (currentUser.clientRating || '4.7') + ' <span style="font-size:1rem;color:#64748b">/ 5.0</span></div>' +
          '<span class="status-pill pill-blue">High Client Confidence</span>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function renderNotificationsView(container) {
  container.innerHTML = 
    '<div class="workspace-header-row">' +
      '<div>' +
        '<h1 class="workspace-greeting-title">Notifications &amp; Summons</h1>' +
        '<div class="workspace-greeting-sub">Real-time alerts, document orders, and hearing updates.</div>' +
      '</div>' +
    '</div>' +

    '<div class="fsc-panel-card">' +
      (allNotifications && allNotifications.length ? allNotifications.map(n => 
        '<div class="notif-item-row">' +
          '<div class="notif-icon-circle" style="background:#e0f2fe;color:#0284c7">' + ICONS.bell + '</div>' +
          '<div class="notif-content-wrap">' +
            '<div class="notif-title-text">' + (n.title || n.message || 'Court Notification') + '</div>' +
            '<div class="notif-sub-text">Case: ' + (n.caseId || 'Federal Court') + ' &middot; ' + (n.message || '') + '</div>' +
          '</div>' +
          '<div class="notif-timestamp-tag">' + new Date(n.createdAt || Date.now()).toLocaleDateString() + '</div>' +
        '</div>'
      ).join('') : '<div style="padding:1.5rem;text-align:center;color:#64748b">No new notifications.</div>') +
    '</div>';
}

/* Modal Handlers */
function openHearingDetailsModal(caseId) {
  const c = allCases.find(it => it.caseId === caseId) || allCases[0] || {};
  document.getElementById('modal-title').textContent = 'Hearing Details — ' + (c.caseId || 'CASE-178721596417');
  document.getElementById('modal-body').innerHTML = 
    '<div style="line-height:1.6">' +
      '<div style="font-size:1.05rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.5rem">' + (c.caseTitle || 'Awash International Bank vs. Blue Nile Holdings') + '</div>' +
      '<p style="color:#64748b;margin-bottom:1rem">' + (c.description || 'Commercial contract bond guarantee trial session.') + '</p>' +
      '<div style="background:#f8fafc;border:1px solid var(--fsc-border);border-radius:8px;padding:1rem;margin-bottom:1rem">' +
        '<div><strong>Date:</strong> Wednesday, May 27, 2026</div>' +
        '<div><strong>Time:</strong> ' + (c.hearingTime || '09:30 AM') + ' (East Africa Time)</div>' +
        '<div><strong>Venue:</strong> ' + (c.courtroom || 'Courtroom 4') + ', ' + (c.jurisdiction || 'Federal Supreme Judicial Complex') + '</div>' +
        '<div><strong>Presiding Judge:</strong> ' + (c.judgeName || 'Hon. Judge Bekele Seyoum') + '</div>' +
      '</div>' +
      '<button class="btn btn-primary btn-full" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="closeModal()">Close Hearing File</button>' +
    '</div>';
  openModal();
}

function openCaseDetailsModal(caseId) {
  const c = allCases.find(it => it.caseId === caseId) || { caseId: caseId, caseTitle: 'Court Case', jurisdiction: 'Federal Supreme Court', status: 'evidence_stage' };
  document.getElementById('modal-title').textContent = 'Docket — ' + c.caseId;
  document.getElementById('modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<h3 style="font-size:1.1rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.5rem">' + (c.caseTitle || '') + '</h3>' +
      '<div><strong>Division:</strong> ' + (c.jurisdiction || 'Federal Supreme Court') + '</div>' +
      '<div><strong>Status:</strong> <span class="status-pill pill-amber">' + ((c.status || 'Active')).toUpperCase() + '</span></div>' +
      '<div><strong>Presiding Judge:</strong> ' + (c.judgeName || 'Hon. Judge Bekele Seyoum') + '</div>' +
      '<div style="margin-top:0.75rem;padding:0.85rem;background:#f8fafc;border-radius:6px;border:1px solid var(--fsc-border)">' +
        '<strong>Description / Claim:</strong>' +
        '<p style="font-size:0.8125rem;color:#475569;margin-top:0.25rem">' + (c.description || 'Commercial breach of contract regarding infrastructure bond underwriting.') + '</p>' +
      '</div>' +
      '<div style="margin-top:1rem;display:flex;gap:0.5rem">' +
        '<button class="btn btn-primary" style="flex:1;padding:0.6rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="openUploadDocModal()">Upload Motion</button>' +
        '<button class="btn btn-outline" style="flex:1;padding:0.6rem;border:1px solid #cbd5e1;border-radius:6px;font-weight:600;cursor:pointer" onclick="closeModal()">Close</button>' +
      '</div>' +
    '</div>';
  openModal();
}

function openUploadDocModal() {
  document.getElementById('modal-title').textContent = 'Upload Evidentiary Document';
  const optionsHtml = allCases.slice(0, 10).map(c => '<option value="' + c.caseId + '">' + c.caseId + ' — ' + c.caseTitle + '</option>').join('');
  document.getElementById('modal-body').innerHTML = 
    '<form onsubmit="handleDocUpload(event)">' +
      '<div class="form-group" style="margin-bottom:1rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Select Case File</label>' +
        '<select class="form-input" id="upload-case-select" style="width:100%;height:38px;border:1px solid #cbd5e1;border-radius:6px;padding:0 0.5rem">' +
          optionsHtml +
        '</select>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:1rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Document Title / Motion Description</label>' +
        '<input type="text" id="upload-doc-title" class="form-input" placeholder="e.g. Supplementary Witness Statement" required style="width:100%;height:38px;border:1px solid #cbd5e1;border-radius:6px;padding:0 0.5rem"/>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:1rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Attach PDF File (Max 25MB)</label>' +
        '<input type="file" id="upload-doc-file" accept="application/pdf" required style="width:100%"/>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary btn-full" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Submit to Judicial Docket</button>' +
    '</form>';
  openModal();
}

async function handleDocUpload(e) {
  e.preventDefault();
  const caseSelect = document.getElementById('upload-case-select');
  const caseId = caseSelect ? caseSelect.value : (allCases[0] ? allCases[0].caseId : 'CASE-178721596417');
  const titleInput = document.getElementById('upload-doc-title');
  const title = titleInput ? titleInput.value : 'Evidence Submission';
  const fileInput = document.getElementById('upload-doc-file');
  
  if (fileInput && fileInput.files.length) {
    const formData = new FormData();
    formData.append('evidenceFile', fileInput.files[0]);
    formData.append('title', title);
    formData.append('stage', 'stage_2');
    formData.append('uploadedBy', (currentUser && currentUser.role) || 'lawyer');

    try {
      await fetch(API + '/cases/' + caseId + '/evidence', { method: 'POST', body: formData });
    } catch (err) {}
  }
  alert('Document uploaded successfully to court docket.');
  closeModal();
  await loadDashboardData();
}

function openPostponeModal() {
  document.getElementById('modal-title').textContent = 'Request Hearing Postponement (Adjournment)';
  document.getElementById('modal-body').innerHTML = 
    '<form onsubmit="handlePostpone(event)">' +
      '<div class="form-group" style="margin-bottom:1rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Case ID</label>' +
        '<input type="text" id="postpone-case-id" class="form-input" value="CASE-178721596417" readonly style="width:100%;height:38px;border:1px solid #cbd5e1;border-radius:6px;padding:0 0.5rem;background:#f1f5f9"/>' +
      '</div>' +
      '<div class="form-group" style="margin-bottom:1rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Legal Grounds for Adjournment</label>' +
        '<textarea id="postpone-reason" class="form-input" rows="4" placeholder="State reasons under Ethiopian Civil Procedure Code..." required style="width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:0.5rem"></textarea>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary btn-full" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Dispatch Adjournment Motion</button>' +
    '</form>';
  openModal();
}

async function handlePostpone(e) {
  e.preventDefault();
  const caseIdEl = document.getElementById('postpone-case-id');
  const caseId = caseIdEl ? caseIdEl.value : 'CASE-178721596417';
  const reasonEl = document.getElementById('postpone-reason');
  const reason = reasonEl ? reasonEl.value : '';
  try {
    await fetch(API + '/cases/' + caseId + '/request-postponement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason, lawyerName: currentUser.fullName })
    });
  } catch (err) {}
  alert('Postponement request submitted to Presiding Judge.');
  closeModal();
}

function openContactModal() {
  document.getElementById('modal-title').textContent = 'Contact Court Registry';
  document.getElementById('modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<p><strong>Federal Supreme Court of Ethiopia Registry Office</strong></p>' +
      '<div>Churchill Avenue, Sidist Kilo Complex, Addis Ababa</div>' +
      '<div>Direct Phone: +251 11 551 7700 / +251 11 551 2233</div>' +
      '<div>Email: info@fsc.gov.et &middot; registrar@fsc.gov.et</div>' +
      '<div>Hours: Monday – Friday: 08:30 AM – 05:30 PM (EAT)</div>' +
      '<button class="btn btn-outline btn-full" style="width:100%;margin-top:1rem;padding:0.6rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeModal()">Close</button>' +
    '</div>';
  openModal();
}

function openProfileModal() {
  document.getElementById('modal-title').textContent = 'Advocate Credentials & Bar Standing';
  document.getElementById('modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<div><strong>Full Name:</strong> ' + (currentUser.fullName || 'Kebede Haile Mariam') + '</div>' +
      '<div><strong>MoJ License:</strong> <code>' + (currentUser.licenseNumber || 'LAW-1001') + '</code></div>' +
      '<div><strong>Specialization:</strong> ' + (currentUser.specialization || 'Criminal & Commercial') + '</div>' +
      '<div><strong>Bar Tier:</strong> Federal Supreme Court &amp; Cassation Bench</div>' +
      '<div><strong>Status:</strong> <span class="status-pill pill-green">ACTIVE IN GOOD STANDING</span></div>' +
      '<button class="btn btn-primary btn-full" style="width:100%;margin-top:1rem;padding:0.6rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="closeModal()">Close Profile</button>' +
    '</div>';
  openModal();
}

function openSettingsModal() {
  document.getElementById('modal-title').textContent = 'Portal Preferences';
  document.getElementById('modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">' +
        '<input type="checkbox" checked /> SMS Hearing Notifications (SMSEthiopia)' +
      '</label>' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">' +
        '<input type="checkbox" checked /> Automatic LEX-RATING Sync' +
      '</label>' +
      '<button class="btn btn-primary btn-full" style="width:100%;margin-top:1rem;padding:0.6rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Preferences saved.\'); closeModal();">Save Settings</button>' +
    '</div>';
  openModal();
}

function openHelpModal() {
  document.getElementById('modal-title').textContent = 'Judicial E-Filing Help Desk';
  document.getElementById('modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<p>For assistance with electronic document filings, hearing scheduling, or MoJ license verification, please contact Court IT support:</p>' +
      '<div>Technical Hotline: +251 11 551 7700 (Ext 404)</div>' +
      '<div>it-support@fsc.gov.et</div>' +
      '<button class="btn btn-outline btn-full" style="width:100%;margin-top:1rem;padding:0.6rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeModal()">Close</button>' +
    '</div>';
  openModal();
}

function openModal() {
  const modal = document.getElementById('universal-modal');
  if (modal) modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('universal-modal');
  if (modal) modal.style.display = 'none';
}

function logout() {
  sessionStorage.removeItem('court_user');
  window.location.href = '/';
}

function toggleAdvocateProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('advocate-profile-dropdown-menu');
  if (menu) menu.classList.toggle('show');
}

function handleAdvocateGlobalClick(e) {
  const menu = document.getElementById('advocate-profile-dropdown-menu');
  const trigger = document.getElementById('user-profile-pill-trigger');
  if (menu && menu.classList.contains('show')) {
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
      menu.classList.remove('show');
    }
  }
}

function openAdvocateEditProfileModal() {
  const menu = document.getElementById('advocate-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');

  document.getElementById('modal-title').textContent = 'Edit Advocate Profile & Credentials';
  document.getElementById('modal-body').innerHTML = 
    '<form onsubmit="handleAdvocateEditProfileSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Full Legal Name</label>' +
        '<input type="text" id="edit-adv-fullname" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentUser.fullName || 'Kebede Haile Mariam') + '" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Ministry of Justice License</label>' +
          '<input type="text" id="edit-adv-license" class="top-search-input" style="border-radius:6px;width:100%;background:#f1f5f9" value="' + (currentUser.licenseNumber || 'LAW-1001') + '" readonly/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Contact Phone</label>' +
          '<input type="text" id="edit-adv-phone" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentUser.phone || '+251 91 122 3344') + '" required/>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Practice Specialization</label>' +
        '<input type="text" id="edit-adv-spec" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentUser.specialization || 'Criminal & Commercial Law') + '" required/>' +
      '</div>' +
      '<div style="margin-bottom:1rem;border-top:1px solid #f1f5f9;padding-top:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Change Password (leave blank to keep current)</label>' +
        '<input type="password" id="edit-adv-password" class="top-search-input" style="border-radius:6px;width:100%" placeholder="••••••••"/>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem">' +
        '<button type="submit" class="btn btn-primary" style="flex:1;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Save Profile Changes</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openModal();
}

function handleAdvocateEditProfileSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('edit-adv-fullname').value.trim();
  const phone = document.getElementById('edit-adv-phone').value.trim();
  const spec = document.getElementById('edit-adv-spec').value.trim();

  currentUser.fullName = fullName;
  currentUser.phone = phone;
  currentUser.specialization = spec;

  sessionStorage.setItem('court_user', JSON.stringify(currentUser));
  updateUserUI();
  alert('Profile changes saved.');
  closeModal();
  renderCurrentView();
}
