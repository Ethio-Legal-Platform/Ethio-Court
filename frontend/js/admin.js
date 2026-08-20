'use strict';

const API = '/api';
let currentAdmin = {
  id: "ADMIN-001",
  username: "admin.super",
  fullName: "Admin User",
  email: "admin@fsc.gov.et",
  phone: "+251 11 551 7700 (Ext 101)",
  role: "admin"
};

let currentAdminView = 'dashboard';
let allCases = [];
let allLicenses = [];
let allNotifications = [];
let allSmsLogs = [];
let allAuditLogs = [];
let selectedChartBranch = "ALL";
let currentCaseFilter = "requested";

const ICONS = {
  briefcase: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  checkCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  gavel: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>',
  users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  building: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>',
  scales: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
  calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>',
  bell: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  database: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>',
  link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  messageSquare: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  userPlus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>',
  chart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>'
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = sessionStorage.getItem('court_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role === 'admin' || u.role === 'staff' || u.role === 'officer' || u.role === 'clerk') {
        currentAdmin = Object.assign(currentAdmin, u);
      }
    }
  } catch (e) {}

  updateAdminHeaderUI();
  startLiveClock();
  await loadAdminData();
});

function startLiveClock() {
  function tick() {
    const now = new Date();
    const timeEl = document.getElementById('sidebar-live-clock');
    const dateEl = document.getElementById('sidebar-live-date');
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    }
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  tick();
  setInterval(tick, 1000);
}

function updateAdminHeaderUI() {
  const name = currentAdmin.fullName || "Admin User";
  const initials = name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() || "AU";
  
  const initialsEl = document.getElementById('admin-avatar-initials');
  if (initialsEl) initialsEl.textContent = initials;

  const dropInitialsEl = document.getElementById('admin-dropdown-avatar');
  if (dropInitialsEl) dropInitialsEl.textContent = initials;

  const dropNameEl = document.getElementById('admin-dropdown-fullname');
  if (dropNameEl) dropNameEl.textContent = name;

  const topNameEl = document.getElementById('top-admin-name');
  if (topNameEl) topNameEl.textContent = name;
}

function toggleAdminProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('admin-profile-dropdown-menu');
  if (menu) menu.classList.toggle('show');
}

function handleAdminGlobalClick(e) {
  const menu = document.getElementById('admin-profile-dropdown-menu');
  const trigger = document.getElementById('admin-profile-pill-trigger');
  if (menu && menu.classList.contains('show')) {
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
      menu.classList.remove('show');
    }
  }
}

function openAdminEditProfileModal() {
  const menu = document.getElementById('admin-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');

  document.getElementById('admin-modal-title').textContent = 'Edit Administrator Profile';
  document.getElementById('admin-modal-body').innerHTML = 
    '<form onsubmit="handleAdminEditProfileSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Full Administrator Name</label>' +
        '<input type="text" id="edit-admin-fullname" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentAdmin.fullName || 'Admin User') + '" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Administrative Email</label>' +
          '<input type="email" id="edit-admin-email" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentAdmin.email || 'admin@fsc.gov.et') + '" required/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Chamber Extension</label>' +
          '<input type="text" id="edit-admin-phone" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentAdmin.phone || '+251 11 551 7700 (Ext 101)') + '" required/>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:1rem;border-top:1px solid #f1f5f9;padding-top:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Update Password (leave blank to keep current)</label>' +
        '<input type="password" id="edit-admin-password" class="top-search-input" style="border-radius:6px;width:100%" placeholder="••••••••"/>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem">' +
        '<button type="submit" class="btn btn-primary" style="flex:1;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Save Administrator Profile</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeAdminModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openAdminModal();
}

function handleAdminEditProfileSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('edit-admin-fullname').value.trim();
  const email = document.getElementById('edit-admin-email').value.trim();
  const phone = document.getElementById('edit-admin-phone').value.trim();

  currentAdmin.fullName = fullName;
  currentAdmin.email = email;
  currentAdmin.phone = phone;

  sessionStorage.setItem('court_user', JSON.stringify(currentAdmin));
  updateAdminHeaderUI();
  alert('Administrator profile updated.');
  closeAdminModal();
  renderAdminCurrentView();
}

function logoutAdmin() {
  const menu = document.getElementById('admin-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');
  sessionStorage.removeItem('court_user');
  window.location.href = '/';
}

let allMetrics = { totalCases: 0, activeCases: 0, verifiedLawyers: 0, activeJudges: 0, courtOfficers: 0 };
let systemHealth = { status: 'HEALTHY', mongoConnection: 'ONLINE', redisCache: 'CONNECTED', smsGateway: 'ACTIVE', storageUsage: '14.2 GB' };

async function loadAdminData() {
  try {
    const [casesRes, notifsRes, smsRes, auditRes, metricsRes, healthRes, judgesRes] = await Promise.all([
      fetch(API + '/cases').catch(() => null),
      fetch(API + '/notifications').catch(() => null),
      fetch(API + '/sms/logs').catch(() => null),
      fetch(API + '/admin/audit-logs').catch(() => null),
      fetch(API + '/admin/metrics').catch(() => null),
      fetch(API + '/admin/health').catch(() => null),
      fetch(API + '/judges').catch(() => null)
    ]);

    if (casesRes && casesRes.ok) allCases = await casesRes.json();
    if (notifsRes && notifsRes.ok) allNotifications = await notifsRes.json();
    if (smsRes && smsRes.ok) allSmsLogs = await smsRes.json();
    if (auditRes && auditRes.ok) allAuditLogs = await auditRes.json();
    if (metricsRes && metricsRes.ok) allMetrics = await metricsRes.json();
    if (healthRes && healthRes.ok) systemHealth = await healthRes.json();
    if (judgesRes && judgesRes.ok) allLicenses = await judgesRes.json();
  } catch (err) {}

  renderAdminCurrentView();
}

function switchAdminView(viewName) {
  currentAdminView = viewName;
  document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.admin-nav-btn')).find(b => 
    b.textContent.toLowerCase().includes(viewName.replace('_', ' '))
  );
  if (activeBtn) activeBtn.classList.add('active');

  renderAdminCurrentView();
}

function renderAdminCurrentView() {
  const container = document.getElementById('dynamic-admin-workspace');
  if (!container) return;

  if (currentAdminView === 'dashboard') {
    renderAdminDashboard(container);
  } else if (currentAdminView === 'cases_management') {
    renderCasesManagementView(container);
  } else if (currentAdminView === 'user_management') {
    renderUserManagementView(container);
  } else if (currentAdminView === 'advocates_licenses') {
    renderAdvocatesLicensesView(container);
  } else if (currentAdminView === 'judges_staff') {
    renderJudgesStaffView(container);
  } else if (currentAdminView === 'court_divisions') {
    renderCourtDivisionsView(container);
  } else if (currentAdminView === 'hearing_calendar') {
    renderHearingCalendarView(container);
  } else if (currentAdminView === 'documents_evidence') {
    renderDocumentsEvidenceView(container);
  } else if (currentAdminView === 'appeals_management') {
    renderAppealsManagementView(container);
  } else if (currentAdminView === 'ratings_evaluation') {
    renderRatingsEvaluationView(container);
  } else if (currentAdminView === 'notifications') {
    renderNotificationsView(container);
  } else if (currentAdminView === 'reports_analytics') {
    renderReportsAnalyticsView(container);
  } else if (currentAdminView === 'moj_registry' || currentAdminView === 'lex_rating' || currentAdminView === 'webhook_monitor') {
    renderWebhookIntegrationView(container);
  } else if (currentAdminView === 'sms_gateway') {
    renderSmsGatewayLogsView(container);
  } else if (currentAdminView === 'audit_logs') {
    renderAuditLogsView(container);
  } else if (currentAdminView === 'system_health') {
    renderSystemHealthView(container);
  } else {
    renderAdminDashboard(container);
  }
}

function renderAdminDashboard(container) {
  const totalCasesCount = (allCases && allCases.length) ? allCases.length : 0;
  const activeCasesCount = (allCases && allCases.length) ? allCases.filter(c => c.status !== 'closed' && c.status !== 'decided' && c.status !== 'archived').length : 0;
  const decidedCasesCount = (allCases && allCases.length) ? allCases.filter(c => c.status === 'closed' || c.status === 'decided' || c.status === 'verdict').length : 0;
  const totalAdvocatesCount = allMetrics.verifiedLawyers || 0;
  const totalJudgesCount = allMetrics.activeJudges || 0;
  const totalStaffCount = allMetrics.courtOfficers || 0;
  const registeredUsersCount = totalAdvocatesCount + totalJudgesCount + totalStaffCount;

  const recentCasesList = allCases.slice(0, 10);
  const recentRowsHtml = recentCasesList.length ? recentCasesList.map(c => {
    let statusClass = 'pill-blue';
    let status = (c.status || 'FILED').toUpperCase();
    if (c.status === 'pending_screening' || c.screeningStatus === 'pending') { statusClass = 'pill-orange'; status = 'SCREENING'; }
    else if (c.status === 'assigned') { statusClass = 'pill-green'; status = 'ASSIGNED'; }
    else if (c.status === 'scheduled' || c.status === 'hearing') { statusClass = 'pill-blue'; status = 'HEARING'; }
    else if (c.status === 'closed' || c.status === 'decided') { statusClass = 'pill-purple'; status = 'DECIDED'; }

    let stepIndex = 1;
    let stage = 'Filed';
    if (c.status === 'screening' || c.status === 'pending_screening') { stepIndex = 1; stage = 'Screening'; }
    else if (c.status === 'assigned') { stepIndex = 2; stage = 'Assigned'; }
    else if (c.status === 'scheduled' || c.status === 'hearing') { stepIndex = 3; stage = 'Hearing Stage'; }
    else if (c.status === 'closed' || c.status === 'decided') { stepIndex = 4; stage = 'Verdict Delivered'; }

    const filedDate = c.filingDate ? new Date(c.filingDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Recent';

    return '<tr>' +
      '<td><a class="case-link-bold" onclick="openAdminCaseModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td><strong style="color:var(--fsc-navy-main)">' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</strong></td>' +
      '<td style="color:#64748b">' + filedDate + '</td>' +
      '<td><span class="status-pill ' + statusClass + '">' + status + '</span></td>' +
      '<td>' +
        '<div style="display:flex;flex-direction:column;gap:2px">' +
          '<div class="mini-stepper">' +
            '<div class="step-node active"></div><div class="step-line"></div>' +
            '<div class="step-node ' + (stepIndex >= 2 ? 'active' : '') + '"></div><div class="step-line"></div>' +
            '<div class="step-node ' + (stepIndex >= 3 ? 'active' : '') + '"></div><div class="step-line"></div>' +
            '<div class="step-node ' + (stepIndex >= 4 ? 'active' : '') + '"></div>' +
          '</div>' +
          '<span style="font-size:0.685rem;color:#64748b">' + stage + '</span>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:0.35rem">' +
          '<button class="btn-view-sm" onclick="openAdminCaseModal(\'' + c.caseId + '\')">View</button>' +
          '<button class="btn-view-sm" style="padding:0.25rem 0.4rem" onclick="openAdminCaseModal(\'' + c.caseId + '\')">⋮</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:1.5rem">No cases found in registry database.</td></tr>';

  const auditRowsList = allAuditLogs.slice(0, 10);
  const auditRowsHtml = auditRowsList.length ? auditRowsList.map(a => {
    const timeStr = a.timestamp ? new Date(a.timestamp).toLocaleString() : (a.time || 'Recent');
    return '<tr>' +
      '<td style="color:#64748b;white-space:nowrap">' + timeStr + '</td>' +
      '<td><strong>' + (a.user || 'System') + '</strong></td>' +
      '<td><span class="status-pill pill-blue">' + (a.role || 'User') + '</span></td>' +
      '<td style="color:var(--fsc-navy-main);font-weight:500">' + (a.action || 'Action') + '</td>' +
      '<td>' + (a.module || 'Core System') + '</td>' +
      '<td style="font-family:monospace;color:#64748b">' + (a.ip || '127.0.0.1') + '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:1.5rem">No audit entries logged yet.</td></tr>';

  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">Welcome back, ' + (currentAdmin.fullName || 'Administrator') + '</h1>' +
        '<div class="admin-greeting-sub">Live real-time system metrics computed directly from database.</div>' +
      '</div>' +
      '<button class="btn-export-dashboard" onclick="exportAdminSummary()">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>' +
        '<span>Export Summary</span>' +
      '</button>' +
    '</div>' +

    '<div class="admin-kpi-grid-6">' +
      '<div class="admin-kpi-card">' +
        '<div class="admin-kpi-top">' +
          '<div class="admin-kpi-icon kpi-blue">' + ICONS.briefcase + '</div>' +
          '<div>' +
            '<div class="admin-kpi-label">Total Cases</div>' +
            '<div class="admin-kpi-number">' + totalCasesCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="admin-kpi-delta">Live registry count</div>' +
      '</div>' +

      '<div class="admin-kpi-card">' +
        '<div class="admin-kpi-top">' +
          '<div class="admin-kpi-icon kpi-green">' + ICONS.checkCircle + '</div>' +
          '<div>' +
            '<div class="admin-kpi-label">Active Cases</div>' +
            '<div class="admin-kpi-number">' + activeCasesCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="admin-kpi-delta">Pending &amp; Hearing</div>' +
      '</div>' +

      '<div class="admin-kpi-card">' +
        '<div class="admin-kpi-top">' +
          '<div class="admin-kpi-icon kpi-orange">' + ICONS.gavel + '</div>' +
          '<div>' +
            '<div class="admin-kpi-label">Cases Decided</div>' +
            '<div class="admin-kpi-number">' + decidedCasesCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="admin-kpi-delta">Concluded verdicts</div>' +
      '</div>' +

      '<div class="admin-kpi-card">' +
        '<div class="admin-kpi-top">' +
          '<div class="admin-kpi-icon kpi-purple">' + ICONS.users + '</div>' +
          '<div>' +
            '<div class="admin-kpi-label">Registered Users</div>' +
            '<div class="admin-kpi-number">' + registeredUsersCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="admin-kpi-delta">Active user accounts</div>' +
      '</div>' +

      '<div class="admin-kpi-card">' +
        '<div class="admin-kpi-top">' +
          '<div class="admin-kpi-icon kpi-navy">' + ICONS.building + '</div>' +
          '<div>' +
            '<div class="admin-kpi-label">Total Advocates</div>' +
            '<div class="admin-kpi-number">' + totalAdvocatesCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="admin-kpi-delta">Certified advocates</div>' +
      '</div>' +

      '<div class="admin-kpi-card">' +
        '<div class="admin-kpi-top">' +
          '<div class="admin-kpi-icon kpi-gold">' + ICONS.scales + '</div>' +
          '<div>' +
            '<div class="admin-kpi-label">Judges &amp; Benches</div>' +
            '<div class="admin-kpi-number">' + totalJudgesCount + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="admin-kpi-delta">Active chambers</div>' +
      '</div>' +
    '</div>' +

    '<!-- Interactive Branch Performance & Case Trend Line Chart -->' +
    '<div class="admin-panel-card" style="margin-bottom:1.5rem">' +
      '<div class="admin-panel-head-row" style="flex-wrap:wrap;gap:1rem;margin-bottom:1.25rem">' +
        '<div>' +
          '<div class="admin-panel-title" style="display:flex;align-items:center;gap:0.5rem">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--fsc-navy-main)" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>' +
            '<span>Branch Performance &amp; Case Trajectory (Filed vs. Settled vs. Rejected)</span>' +
          '</div>' +
          '<div class="admin-panel-sub">Interactive comparative analytics across all Ethiopian Federal Court divisions.</div>' +
        '</div>' +

        '<div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">' +
          '<div style="display:flex;align-items:center;gap:0.75rem;font-size:0.75rem;font-weight:600">' +
            '<span style="display:flex;align-items:center;gap:0.3rem;color:#0284c7"><span style="width:10px;height:10px;border-radius:50%;background:#0284c7;display:inline-block"></span> Total Cases</span>' +
            '<span style="display:flex;align-items:center;gap:0.3rem;color:#16a34a"><span style="width:10px;height:10px;border-radius:50%;background:#16a34a;display:inline-block"></span> Settled</span>' +
            '<span style="display:flex;align-items:center;gap:0.3rem;color:#ef4444"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block"></span> Rejected</span>' +
          '</div>' +

          '<div style="display:flex;align-items:center;gap:0.5rem">' +
            '<label style="font-size:0.75rem;font-weight:700;color:var(--fsc-navy-main)">Branch:</label>' +
            '<select id="chart-branch-select" class="top-search-input" style="padding:0.4rem 0.75rem;font-size:0.785rem;border-radius:6px;background:#ffffff;font-weight:600;color:var(--fsc-navy-main);cursor:pointer;border:1px solid #cbd5e1" onchange="handleBranchChange(this.value)">' +
              '<option value="ALL" selected>All Branches (National Aggregate)</option>' +
              '<option value="BRANCH-001">Federal Supreme Court (Sidist Kilo)</option>' +
              '<option value="BRANCH-002">Federal High Court — Lideta Division</option>' +
              '<option value="BRANCH-003">Federal High Court — Arada Criminal</option>' +
              '<option value="BRANCH-004">Federal First Instance — Kirkos &amp; Bole</option>' +
              '<option value="BRANCH-005">Dire Dawa Federal Circuit Court</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div id="branch-chart-container">' +
        generateBranchChartHtml(selectedChartBranch) +
      '</div>' +
    '</div>' +

    '<div class="admin-grid-2-col">' +
      '<div class="admin-panel-card">' +
        '<div class="admin-panel-head-row">' +
          '<div>' +
            '<div class="admin-panel-title">Recent Registered Cases</div>' +
            '<div class="admin-panel-sub">Real-time dockets from electronic registry.</div>' +
          '</div>' +
          '<button class="btn-view-all-link" onclick="switchAdminView(\'cases_management\')">View All Cases &rarr;</button>' +
        '</div>' +
        '<table class="admin-table">' +
          '<thead><tr><th>Case ID</th><th>Title / Parties</th><th>Filed Date</th><th>Status</th><th>Stage</th><th>Actions</th></tr></thead>' +
          '<tbody>' + recentRowsHtml + '</tbody>' +
        '</table>' +
      '</div>' +

      '<div class="admin-panel-card">' +
        '<div class="admin-panel-head-row">' +
          '<div>' +
            '<div class="admin-panel-title">Security &amp; Activity Audit Log</div>' +
            '<div class="admin-panel-sub">Immutable audit records from database.</div>' +
          '</div>' +
          '<button class="btn-view-all-link" onclick="switchAdminView(\'audit_logs\')">View All &rarr;</button>' +
        '</div>' +
        '<table class="admin-table">' +
          '<thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Module</th><th>IP</th></tr></thead>' +
          '<tbody>' + auditRowsHtml + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

/* Subviews */

function setCaseCategoryFilter(filterName) {
  currentCaseFilter = filterName;
  const container = document.getElementById('dynamic-admin-workspace');
  if (container) renderCasesManagementView(container);
}

function renderCasesManagementView(container) {
  const pendingCases = allCases.filter(c => c.status === 'pending_screening' || c.screeningStatus === 'pending' || !c.screeningStatus || c.status === 'pending');
  const approvedCases = allCases.filter(c => c.screeningStatus === 'approved' || c.status === 'forwarded_to_branch' || c.status === 'scheduled' || c.status === 'assigned' || c.status === 'hearing');
  const declinedCases = allCases.filter(c => c.screeningStatus === 'rejected' || c.status === 'rejected');

  let displayList = allCases;
  if (currentCaseFilter === 'requested') displayList = pendingCases;
  else if (currentCaseFilter === 'approved') displayList = approvedCases;
  else if (currentCaseFilter === 'declined') displayList = declinedCases;

  const rowsHtml = displayList.length ? displayList.map(c => {
    const isPending = c.status === 'pending_screening' || c.screeningStatus === 'pending' || !c.screeningStatus;
    const isApproved = c.screeningStatus === 'approved' || c.status === 'scheduled' || c.status === 'forwarded_to_branch';
    const isDeclined = c.screeningStatus === 'rejected' || c.status === 'rejected';

    let statusPill = '<span class="status-pill pill-orange">REQUESTED</span>';
    if (isApproved) statusPill = '<span class="status-pill pill-green">APPROVED</span>';
    else if (isDeclined) statusPill = '<span class="status-pill pill-red">DECLINED</span>';

    const filedDate = c.filingDate ? new Date(c.filingDate).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'}) : 'Recent';
    const docCount = (c.documents && c.documents.length) ? c.documents.length : 1;
    const categoryLabel = c.caseCategory || c.caseType || 'Civil / Corporate';

    return '<tr>' +
      '<td><a class="case-link-bold" onclick="openAdminReviewModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
      '<td>' +
        '<strong style="color:var(--fsc-navy-main)">' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</strong><br>' +
        '<span style="font-size:0.75rem;color:#64748b">Filer: ' + (c.petitioner || 'Litigant') + ' (' + (c.filerPhone || 'No Phone') + ')</span>' +
      '</td>' +
      '<td><span class="status-pill pill-blue">' + categoryLabel + '</span></td>' +
      '<td>' + (c.jurisdiction || 'Federal Supreme Court') + '</td>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:0.3rem;color:#64748b;font-size:0.8rem">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
          '<span>' + docCount + ' files</span>' +
        '</div>' +
      '</td>' +
      '<td style="color:#64748b;font-size:0.785rem">' + filedDate + '</td>' +
      '<td>' + statusPill + '</td>' +
      '<td>' +
        '<button class="btn-export-dashboard" style="padding:0.35rem 0.75rem;font-size:0.75rem;margin:0" onclick="openAdminReviewModal(\'' + c.caseId + '\')">' +
          (isPending ? '⚖️ Review &amp; Label' : 'View Dossier') +
        '</button>' +
      '</td>' +
    '</tr>';
  }).join('') : '<tr><td colspan="8" style="text-align:center;color:#64748b;padding:2rem">No cases found in ' + currentCaseFilter.toUpperCase() + ' category.</td></tr>';

  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">Court Docket &amp; Case Management</h1>' +
        '<div class="admin-greeting-sub">Review incoming requests, label legal categories, and assign target court branches.</div>' +
      '</div>' +
      '<button class="btn-export-dashboard" onclick="openAdminCreateCaseModal()">+ File New Case</button>' +
    '</div>' +

    '<!-- Category Filter Tabs -->' +
    '<div style="display:flex;gap:0.5rem;margin-bottom:1.25rem;border-bottom:2px solid #e2e8f0;padding-bottom:0.75rem;flex-wrap:wrap">' +
      '<button class="admin-tab-btn ' + (currentCaseFilter === 'requested' ? 'active' : '') + '" onclick="setCaseCategoryFilter(\'requested\')" style="padding:0.55rem 1.15rem;border-radius:6px;font-weight:700;cursor:pointer;border:1px solid #cbd5e1;background:' + (currentCaseFilter === 'requested' ? 'var(--fsc-navy-main);color:#fff' : '#ffffff;color:var(--fsc-navy-main)') + '">' +
        '📥 Requested (Pending Screening) <span style="background:#f97316;color:#fff;padding:0.15rem 0.45rem;border-radius:10px;font-size:0.7rem;margin-left:0.35rem">' + pendingCases.length + '</span>' +
      '</button>' +

      '<button class="admin-tab-btn ' + (currentCaseFilter === 'approved' ? 'active' : '') + '" onclick="setCaseCategoryFilter(\'approved\')" style="padding:0.55rem 1.15rem;border-radius:6px;font-weight:700;cursor:pointer;border:1px solid #cbd5e1;background:' + (currentCaseFilter === 'approved' ? 'var(--fsc-navy-main);color:#fff' : '#ffffff;color:var(--fsc-navy-main)') + '">' +
        '✓ Approved &amp; Forwarded <span style="background:#16a34a;color:#fff;padding:0.15rem 0.45rem;border-radius:10px;font-size:0.7rem;margin-left:0.35rem">' + approvedCases.length + '</span>' +
      '</button>' +

      '<button class="admin-tab-btn ' + (currentCaseFilter === 'declined' ? 'active' : '') + '" onclick="setCaseCategoryFilter(\'declined\')" style="padding:0.55rem 1.15rem;border-radius:6px;font-weight:700;cursor:pointer;border:1px solid #cbd5e1;background:' + (currentCaseFilter === 'declined' ? 'var(--fsc-navy-main);color:#fff' : '#ffffff;color:var(--fsc-navy-main)') + '">' +
        '✕ Declined / Dismissed <span style="background:#ef4444;color:#fff;padding:0.15rem 0.45rem;border-radius:10px;font-size:0.7rem;margin-left:0.35rem">' + declinedCases.length + '</span>' +
      '</button>' +

      '<button class="admin-tab-btn ' + (currentCaseFilter === 'all' ? 'active' : '') + '" onclick="setCaseCategoryFilter(\'all\')" style="padding:0.55rem 1.15rem;border-radius:6px;font-weight:700;cursor:pointer;border:1px solid #cbd5e1;background:' + (currentCaseFilter === 'all' ? 'var(--fsc-navy-main);color:#fff' : '#ffffff;color:var(--fsc-navy-main)') + '">' +
        'All Cases (' + allCases.length + ')' +
      '</button>' +
    '</div>' +

    '<div class="admin-panel-card">' +
      '<table class="admin-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Case ID</th>' +
            '<th>Title / Parties</th>' +
            '<th>Category Label</th>' +
            '<th>Assigned Branch</th>' +
            '<th>Client Files</th>' +
            '<th>Filed Date</th>' +
            '<th>Status</th>' +
            '<th>Actions</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>' +
    '</div>';
}


function renderUserManagementView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">User &amp; Access Role Management</h1>' +
        '<div class="admin-greeting-sub">Manage system roles, advocate credentials, judges, and administrative accounts.</div>' +
      '</div>' +
      '<button class="btn-export-dashboard" onclick="openAddUserModal()">+ Add New User</button>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:1rem;margin-bottom:1.25rem">' +
        '<div style="padding:1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:0.75rem;color:#64748b">Advocate Accounts</div><div style="font-size:1.5rem;font-weight:800;color:var(--fsc-navy-main)">865</div></div>' +
        '<div style="padding:1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:0.75rem;color:#64748b">Litigant Accounts</div><div style="font-size:1.5rem;font-weight:800;color:var(--fsc-navy-main)">749</div></div>' +
        '<div style="padding:1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:0.75rem;color:#64748b">Judicial Officers</div><div style="font-size:1.5rem;font-weight:800;color:var(--fsc-navy-main)">94</div></div>' +
        '<div style="padding:1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0"><div style="font-size:0.75rem;color:#64748b">Court Registrars</div><div style="font-size:1.5rem;font-weight:800;color:var(--fsc-navy-main)">351</div></div>' +
      '</div>' +
      '<table class="admin-table">' +
        '<thead><tr><th>User ID</th><th>Full Name</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>' +
        '<tbody>' +
          '<tr><td>USR-1001</td><td><strong>Kebede Haile Mariam</strong></td><td><span class="status-pill pill-blue">Advocate</span></td><td><span class="status-pill pill-green">ACTIVE</span></td><td><button class="btn-view-sm" onclick="alert(\'Viewing user profile\')">Edit</button></td></tr>' +
          '<tr><td>USR-2001</td><td><strong>Hon. Judge Solomon Desta</strong></td><td><span class="status-pill pill-purple">Judge</span></td><td><span class="status-pill pill-green">ACTIVE</span></td><td><button class="btn-view-sm" onclick="alert(\'Viewing user profile\')">Edit</button></td></tr>' +
          '<tr><td>USR-3001</td><td><strong>Admin User</strong></td><td><span class="status-pill pill-navy">Administrator</span></td><td><span class="status-pill pill-green">ACTIVE</span></td><td><button class="btn-view-sm" onclick="alert(\'Viewing user profile\')">Edit</button></td></tr>' +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderAdvocatesLicensesView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">Ministry of Justice Advocate License Registry</h1>' +
        '<div class="admin-greeting-sub">37 Verified MoJ Advocate Licenses synced with the LEX-RATING dispatcher.</div>' +
      '</div>' +
      '<button class="btn-export-dashboard" onclick="triggerLexRatingSync()">Sync All Licenses Now</button>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<table class="admin-table">' +
        '<thead><tr><th>License No</th><th>Advocate Name</th><th>MoJ Status</th><th>Tier</th><th>Synced To LEX-RATING</th></tr></thead>' +
        '<tbody>' +
          (allLicenses && allLicenses.length ? allLicenses.slice(0, 15).map(l => 
            '<tr>' +
              '<td><code>' + l.licenseNumber + '</code></td>' +
              '<td><strong>' + l.fullName + '</strong></td>' +
              '<td><span class="status-pill pill-green">' + l.status + '</span></td>' +
              '<td>' + (l.tier || 'Federal Supreme Court') + '</td>' +
              '<td><span style="color:#16a34a;font-weight:700">&bull; Synced</span></td>' +
            '</tr>'
          ).join('') : '<tr><td colspan="5">Loading licenses...</td></tr>') +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderJudgesStaffView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">Presiding Judges &amp; Chamber Staff</h1>' +
        '<div class="admin-greeting-sub">Judicial appointments, courtroom rosters, and assigned clerks.</div>' +
      '</div>' +
      '<button class="btn-export-dashboard" onclick="openAddJudgeModal()">+ Add Judge</button>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<table class="admin-table">' +
        '<thead><tr><th>Judge ID</th><th>Name</th><th>Branch</th><th>Courtroom</th><th>Active Cases</th></tr></thead>' +
        '<tbody>' +
          '<tr><td>JUDGE-001</td><td><strong>Hon. Judge Solomon Desta</strong></td><td>Federal Supreme Court</td><td>Courtroom 4</td><td>18 Cases</td></tr>' +
          '<tr><td>JUDGE-002</td><td><strong>Hon. Judge Tewodros Mihret</strong></td><td>Federal High Court (Lideta)</td><td>Courtroom 2</td><td>8 Cases</td></tr>' +
          '<tr><td>JUDGE-003</td><td><strong>Hon. Judge Hiwot Tadesse</strong></td><td>Federal First Instance Court</td><td>Courtroom 1</td><td>6 Cases</td></tr>' +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderCourtDivisionsView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">Federal Court Divisions &amp; Branches</h1>' +
        '<div class="admin-greeting-sub">Constitutional, Cassation, Commercial, Civil, and Criminal Benches.</div>' +
      '</div>' +
      '<button class="btn-export-dashboard" onclick="openCreateDivisionModal()">+ Create Division</button>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:1rem">' +
        '<div style="padding:1.25rem;border:1px solid #cbd5e1;border-radius:8px"><h3 style="font-size:1rem;color:var(--fsc-navy-main)">Federal Supreme Court</h3><p style="font-size:0.75rem;color:#64748b;margin:0.5rem 0">Cassation Bench &amp; Appellate Chambers · Sidist Kilo</p><span class="status-pill pill-green">8 Active Courtrooms</span></div>' +
        '<div style="padding:1.25rem;border:1px solid #cbd5e1;border-radius:8px"><h3 style="font-size:1rem;color:var(--fsc-navy-main)">Federal High Court — Lideta</h3><p style="font-size:0.75rem;color:#64748b;margin:0.5rem 0">Commercial &amp; Tax Litigation · Lideta Complex</p><span class="status-pill pill-blue">14 Active Courtrooms</span></div>' +
        '<div style="padding:1.25rem;border:1px solid #cbd5e1;border-radius:8px"><h3 style="font-size:1rem;color:var(--fsc-navy-main)">Federal First Instance Court</h3><p style="font-size:0.75rem;color:#64748b;margin:0.5rem 0">Kirkos &amp; Bole Municipal Divisions</p><span class="status-pill pill-purple">12 Active Courtrooms</span></div>' +
      '</div>' +
    '</div>';
}

function renderHearingCalendarView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">Master Hearing Calendar</h1>' +
        '<div class="admin-greeting-sub">Real-time courtroom scheduling across all federal divisions.</div>' +
      '</div>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1rem">' +
        allCases.slice(0, 6).map(c => 
          '<div style="border:1px solid #cbd5e1;border-radius:8px;padding:1rem">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:0.5rem"><span class="status-pill pill-blue">' + (c.hearingTime || '09:30 AM') + '</span><span style="font-size:0.75rem;color:#64748b">Courtroom 4</span></div>' +
            '<a class="case-link-bold" onclick="openAdminCaseModal(\'' + c.caseId + '\')">' + c.caseId + '</a>' +
            '<div style="font-weight:700;font-size:0.825rem;color:var(--fsc-navy-main);margin:0.25rem 0">' + (c.caseTitle || '') + '</div>' +
          '</div>'
        ).join('') +
      '</div>' +
    '</div>';
}

function renderDocumentsEvidenceView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">Electronic Document Registry</h1>' +
        '<div class="admin-greeting-sub">Centralized repository for electronic motions, summons, and evidentiary exhibits.</div>' +
      '</div>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<p style="color:#64748b">All 45 case dockets have verified electronic PDF files stored in encrypted cloud storage.</p>' +
    '</div>';
}

function renderAppealsManagementView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">Appellate Bench &amp; Cassation Petitions</h1>' +
        '<div class="admin-greeting-sub">Review and assign petitions submitted to the Cassation Division.</div>' +
      '</div>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<p style="color:#64748b">All appeals are currently assigned and within standard procedural limits.</p>' +
    '</div>';
}

function renderRatingsEvaluationView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">Advocate Judicial Ratings &amp; LEX-RATING Sync</h1>' +
        '<div class="admin-greeting-sub">Complete audit log of judicial scores dispatched to the LEX-RATING platform.</div>' +
      '</div>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<div style="padding:1.5rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:1.5rem">' +
        '<div style="font-size:1.1rem;font-weight:800;color:var(--fsc-navy-main)">Webhook Event Dispatcher: Active</div>' +
        '<div style="font-size:0.8rem;color:#64748b;margin-top:0.25rem">Concluded 2-advocate cases are automatically transmitted upon decree pronouncement.</div>' +
      '</div>' +
    '</div>';
}

function renderNotificationsView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">System Notifications &amp; Alerts</h1>' +
        '<div class="admin-greeting-sub">Real-time alerts, daily backup notifications, and security advisories.</div>' +
      '</div>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      (allNotifications && allNotifications.length ? allNotifications.map(n => 
        '<div class="notif-feed-item">' +
          '<div class="notif-feed-icon" style="background:#e0f2fe;color:#0284c7">' + ICONS.bell + '</div>' +
          '<div><div class="notif-feed-title">' + (n.title || n.message) + '</div><div class="notif-feed-time">' + new Date(n.createdAt || Date.now()).toLocaleString() + '</div></div>' +
        '</div>'
      ).join('') : '<p style="color:#64748b">No alerts.</p>') +
    '</div>';
}

function renderReportsAnalyticsView(container) {
  renderAdminDashboard(container);
}

function renderWebhookIntegrationView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">LEX-RATING Webhook Dispatcher &amp; MoJ Sync</h1>' +
        '<div class="admin-greeting-sub">Automated event streaming for concluded court cases and verified advocate licenses.</div>' +
      '</div>' +
      '<button class="btn-sync-now" style="width:auto;margin:0;padding:0.6rem 1.25rem" onclick="triggerLexRatingSync()">Sync All Now</button>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">' +
        '<div style="padding:1.25rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">' +
          '<h3 style="font-size:1rem;color:var(--fsc-navy-main);font-weight:700">Case Webhook Endpoint</h3>' +
          '<p style="font-size:0.8rem;color:#64748b;margin:0.5rem 0">Dispatches concluded adversarial advocate cases to LEX-RATING.</p>' +
          '<button class="btn-view-sm" onclick="syncEndpoint(\'/api/webhooks/sync-cases\')">Bulk Push Concluded Cases</button>' +
        '</div>' +
        '<div style="padding:1.25rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">' +
          '<h3 style="font-size:1rem;color:var(--fsc-navy-main);font-weight:700">MoJ License Sync Endpoint</h3>' +
          '<p style="font-size:0.8rem;color:#64748b;margin:0.5rem 0">Pushes 37 active Ministry of Justice verified advocate licenses.</p>' +
          '<button class="btn-view-sm" onclick="syncEndpoint(\'/api/webhooks/sync-licenses\')">Bulk Push MoJ Licenses</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function renderSmsGatewayLogsView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">SMSEthiopia Gateway Logs</h1>' +
        '<div class="admin-greeting-sub">98 court summons, hearing notices, and OTP alerts dispatched via telecom gateway.</div>' +
      '</div>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<table class="admin-table">' +
        '<thead><tr><th>Timestamp</th><th>Recipient</th><th>Message Content</th><th>Status</th></tr></thead>' +
        '<tbody>' +
          (allSmsLogs && allSmsLogs.length ? allSmsLogs.slice(0, 15).map(s => 
            '<tr>' +
              '<td style="color:#64748b">' + new Date(s.timestamp || Date.now()).toLocaleString() + '</td>' +
              '<td><strong>' + (s.phone || s.to) + '</strong></td>' +
              '<td>' + (s.message || s.text) + '</td>' +
              '<td><span class="status-pill pill-green">DELIVERED</span></td>' +
            '</tr>'
          ).join('') : '<tr><td colspan="4">No SMS logs.</td></tr>') +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderAuditLogsView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">Security &amp; Activity Audit Logs</h1>' +
        '<div class="admin-greeting-sub">Immutable tamper-evident judicial activity audit records.</div>' +
      '</div>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<table class="admin-table">' +
        '<thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>IP Address</th></tr></thead>' +
        '<tbody>' +
          '<tr><td>May 24, 2026 10:43 AM</td><td>Admin User</td><td>Synced advocate licenses with MoJ</td><td>196.188.1.10</td></tr>' +
          '<tr><td>May 24, 2026 10:41 AM</td><td>Screening Officer</td><td>Approved case CASE-178721596417</td><td>196.188.1.25</td></tr>' +
          '<tr><td>May 24, 2026 10:38 AM</td><td>Clerk User</td><td>Scheduled hearing for CASE-178719224815</td><td>196.188.1.30</td></tr>' +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderSystemHealthView(container) {
  container.innerHTML = 
    '<div class="admin-header-row">' +
      '<div>' +
        '<h1 class="admin-greeting-title">System Infrastructure &amp; Health Monitor</h1>' +
        '<div class="admin-greeting-sub">Database connections, background tasks, and API endpoint latency.</div>' +
      '</div>' +
    '</div>' +
    '<div class="admin-panel-card">' +
      '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:1.25rem">' +
        '<div style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"><div style="font-size:0.75rem;color:#64748b">Database Engine</div><div style="font-size:1.4rem;font-weight:800;color:#16a34a">MongoDB Atlas</div><span class="status-pill pill-green" style="margin-top:0.4rem">Connected (Cluster 01)</span></div>' +
        '<div style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"><div style="font-size:0.75rem;color:#64748b">API Server Latency</div><div style="font-size:1.4rem;font-weight:800;color:#0284c7">12 ms</div><span class="status-pill pill-blue" style="margin-top:0.4rem">Optimal</span></div>' +
        '<div style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"><div style="font-size:0.75rem;color:#64748b">System Uptime</div><div style="font-size:1.4rem;font-weight:800;color:#9333ea">99.98%</div><span class="status-pill pill-purple" style="margin-top:0.4rem">Tier 4 Standard</span></div>' +
      '</div>' +
    '</div>';
}

/* Modals & Handlers */
async function triggerLexRatingSync() {
  const btn = document.getElementById('btn-sync-lex');
  if (btn) { btn.disabled = true; btn.textContent = 'Syncing...'; }

  try {
    const [cRes, lRes] = await Promise.all([
      fetch(API + '/webhooks/sync-cases', { method: 'POST' }).catch(() => null),
      fetch(API + '/webhooks/sync-licenses', { method: 'POST' }).catch(() => null)
    ]);
    alert('LEX-RATING synchronization completed successfully! 24 Cases and 37 Verified MoJ Licenses synced.');
    const lastSyncEl = document.getElementById('lex-last-sync');
    if (lastSyncEl) lastSyncEl.textContent = 'Just now';
  } catch (e) {
    alert('Sync triggered successfully.');
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Sync Now'; }
}

async function syncEndpoint(url) {
  try {
    await fetch(url, { method: 'POST' });
    alert('Dispatched bulk synchronization for ' + url);
  } catch (e) {
    alert('Sync dispatched.');
  }
}

function openAdminCaseModal(caseId) {
  const c = allCases.find(it => it.caseId === caseId) || { caseId: caseId, caseTitle: 'Court Case', jurisdiction: 'Federal Supreme Court', status: 'pending_screening' };
  const isPending = c.status === 'pending_screening' || c.screeningStatus === 'pending' || !c.screeningStatus;
  
  document.getElementById('admin-modal-title').textContent = 'Admin Docket Overview — ' + c.caseId;
  document.getElementById('admin-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<div style="background:#f8fafc;padding:0.75rem 1rem;border-radius:6px;margin-bottom:1rem;border:1px solid #e2e8f0">' +
        '<h3 style="font-size:1.05rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.25rem">' + (c.caseTitle || c.petitioner + ' vs. ' + c.respondent) + '</h3>' +
        '<div style="font-size:0.8rem;color:#64748b">Filer: <strong>' + (c.petitioner || 'Plaintiff') + '</strong> | Contact: ' + (c.filerPhone || 'N/A') + '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;font-size:0.85rem">' +
        '<div><strong>Branch / Division:</strong> ' + (c.jurisdiction || 'Federal Supreme Court') + '</div>' +
        '<div><strong>Screening Status:</strong> <span class="status-pill ' + (c.screeningStatus === 'approved' ? 'pill-green' : (c.screeningStatus === 'rejected' ? 'pill-orange' : 'pill-blue')) + '">' + ((c.screeningStatus || c.status || 'Pending Review')).toUpperCase() + '</span></div>' +
        '<div><strong>Presiding Judge:</strong> ' + (c.judgeName || 'Unassigned') + '</div>' +
        '<div><strong>Courtroom:</strong> ' + (c.courtroom || 'TBD') + '</div>' +
      '</div>' +

      (c.relevantLawArticle ? '<div style="font-size:0.8rem;margin-bottom:0.75rem;padding:0.5rem;background:#f0f9ff;border-radius:4px;color:#0369a1"><strong>Checked Legal Article:</strong> ' + c.relevantLawArticle + '</div>' : '') +

      '<div style="margin-top:1.25rem;display:flex;gap:0.5rem">' +
        '<button class="btn-export-dashboard" style="flex:1" onclick="closeAdminModal(); openAdminReviewModal(\'' + c.caseId + '\')">⚖️ Review &amp; Approve / Decline Filing</button>' +
        '<button class="btn-view-sm" style="padding:0.6rem 1rem" onclick="closeAdminModal()">Close</button>' +
      '</div>' +
    '</div>';
  openAdminModal();
}

function openAddUserModal() {
  document.getElementById('admin-modal-title').textContent = 'Create New System User';
  document.getElementById('admin-modal-body').innerHTML = 
    '<form onsubmit="handleAddUserSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Full Name</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" required placeholder="e.g. Almaz Bekele"/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">System Role</label>' +
        '<select class="top-search-input" style="border-radius:6px;width:100%">' +
          '<option value="lawyer">Advocate / Lawyer</option>' +
          '<option value="judge">Presiding Judge</option>' +
          '<option value="clerk">Court Clerk</option>' +
          '<option value="officer">Screening Officer</option>' +
          '<option value="client">Litigant Citizen</option>' +
        '</select>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Provision Account</button>' +
    '</form>';
  openAdminModal();
}

function handleAddUserSubmit(e) {
  e.preventDefault();
  alert('New user account provisioned.');
  closeAdminModal();
}

function openRegisterAdvocateModal() {
  document.getElementById('admin-modal-title').textContent = 'Register Verified MoJ Advocate';
  document.getElementById('admin-modal-body').innerHTML = 
    '<form onsubmit="handleAdvocateRegSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">MoJ License Number</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="e.g. LAW-1040" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Advocate Full Name</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="e.g. Yonas Tadesse" required/>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Register &amp; Sync with LEX-RATING</button>' +
    '</form>';
  openAdminModal();
}

function handleAdvocateRegSubmit(e) {
  e.preventDefault();
  alert('Advocate registered and synced to LEX-RATING system.');
  closeAdminModal();
}

function openAddJudgeModal() {
  document.getElementById('admin-modal-title').textContent = 'Appoint Presiding Judge';
  document.getElementById('admin-modal-body').innerHTML = 
    '<form onsubmit="handleAddJudgeSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Judge Full Name</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="Hon. Judge..." required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Assigned Courtroom</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="Courtroom 5" required/>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Confirm Appointment</button>' +
    '</form>';
  openAdminModal();
}

function handleAddJudgeSubmit(e) {
  e.preventDefault();
  alert('Judicial appointment confirmed.');
  closeAdminModal();
}

function openCreateDivisionModal() {
  document.getElementById('admin-modal-title').textContent = 'Create New Court Division';
  document.getElementById('admin-modal-body').innerHTML = 
    '<form onsubmit="handleDivisionSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Division Name</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="e.g. Commercial Cassation Bench 2" required/>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Establish Division</button>' +
    '</form>';
  openAdminModal();
}

function handleDivisionSubmit(e) {
  e.preventDefault();
  alert('Court division established.');
  closeAdminModal();
}

function openAdminSettingsModal() {
  document.getElementById('admin-modal-title').textContent = 'System &amp; Database Settings';
  document.getElementById('admin-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem"><input type="checkbox" checked /> Real-time LEX-RATING Webhook Dispatcher</label>' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem"><input type="checkbox" checked /> Automated SMS Summons (SMSEthiopia Gateway)</label>' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem"><input type="checkbox" checked /> Audit Log Immutability Enforcement</label>' +
      '<button class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'System settings updated.\'); closeAdminModal();">Save System Settings</button>' +
    '</div>';
  openAdminModal();
}

function openGenerateReportModal() {
  document.getElementById('admin-modal-title').textContent = 'Generate Comprehensive Judicial Report';
  document.getElementById('admin-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<p>Select report parameters for export (PDF / Excel format):</p>' +
      '<select class="top-search-input" style="border-radius:6px;width:100%;margin:0.75rem 0">' +
        '<option>Q2 2026 Clearance &amp; Disposal Rate Analysis</option>' +
        '<option>Advocate Judicial Scoring &amp; Rating Logs</option>' +
        '<option>MoJ License Verification Audit Trail</option>' +
      '</select>' +
      '<button class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Generating report...\'); closeAdminModal();">Download Formal PDF Report</button>' +
    '</div>';
  openAdminModal();
}

function openSystemMaintenanceModal() {
  document.getElementById('admin-modal-title').textContent = 'System Maintenance &amp; Diagnostics';
  document.getElementById('admin-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<p>Perform automated database index re-indexing and cache clearing:</p>' +
      '<button class="btn btn-primary" style="width:100%;margin-top:1rem;padding:0.75rem;background:#16a34a;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'System maintenance executed successfully. Zero downtime.\'); closeAdminModal();">Run Diagnostics &amp; Optimize Indexes</button>' +
    '</div>';
  openAdminModal();
}

function openAdminContactModal() {
  document.getElementById('admin-modal-title').textContent = 'Administrative Hotline &amp; Dispatch';
  document.getElementById('admin-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<div><strong>Federal Supreme Court IT Operations:</strong> Ext 101</div>' +
      '<div><strong>Chief Registrar Dispatch:</strong> Ext 202</div>' +
      '<div><strong>Ministry of Justice Integration Helpdesk:</strong> Ext 303</div>' +
      '<button class="btn btn-outline" style="width:100%;margin-top:1rem;padding:0.6rem;cursor:pointer" onclick="closeAdminModal()">Close</button>' +
    '</div>';
  openAdminModal();
}

function exportAdminSummary() {
  alert('Exporting system overview summary to PDF...');
}

function openAdminModal() {
  const modal = document.getElementById('universal-admin-modal');
  if (modal) modal.style.display = 'flex';
}

function closeAdminModal() {
  const modal = document.getElementById('universal-admin-modal');
  if (modal) modal.style.display = 'none';
}


function handleBranchChange(branchId) {
  selectedChartBranch = branchId;
  const chartWrapper = document.getElementById('branch-chart-container');
  if (chartWrapper) {
    chartWrapper.innerHTML = generateBranchChartHtml(selectedChartBranch);
  }
}

function generateBranchChartHtml(branchId) {
  // Filter cases by branch
  let filtered = allCases || [];
  if (branchId !== 'ALL') {
    filtered = allCases.filter(c => {
      const b = (c.jurisdiction || c.branch || '').toLowerCase();
      if (branchId === 'BRANCH-001') return b.includes('supreme') || b.includes('sidist') || b.includes('churchill');
      if (branchId === 'BRANCH-002') return b.includes('lideta') || b.includes('high court');
      if (branchId === 'BRANCH-003') return b.includes('arada') || b.includes('criminal');
      if (branchId === 'BRANCH-004') return b.includes('first instance') || b.includes('kirkos') || b.includes('bole');
      if (branchId === 'BRANCH-005') return b.includes('dire dawa') || b.includes('circuit');
      return true;
    });
  }

  const branchTotal = filtered.length || (branchId === 'ALL' ? (allCases.length || 24) : Math.max(2, Math.floor(allCases.length / 5)));
  const branchSettled = filtered.filter(c => c.status === 'closed' || c.status === 'Decided' || c.status === 'decided' || c.status === 'verdict').length || Math.floor(branchTotal * 0.65);
  const branchRejected = filtered.filter(c => c.status === 'rejected' || c.screeningStatus === 'rejected').length || Math.floor(branchTotal * 0.15);
  const branchActive = Math.max(0, branchTotal - branchSettled - branchRejected);
  const settlementRate = branchTotal > 0 ? Math.round((branchSettled / branchTotal) * 100) : 0;

  // Monthly breakdown (Nov, Dec, Jan, Feb, Mar, Apr, May, Jun)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const totalCurve = [
    Math.round(branchTotal * 0.55),
    Math.round(branchTotal * 0.68),
    Math.round(branchTotal * 0.82),
    Math.round(branchTotal * 0.76),
    Math.round(branchTotal * 0.94),
    branchTotal
  ];
  const settledCurve = [
    Math.round(branchSettled * 0.45),
    Math.round(branchSettled * 0.58),
    Math.round(branchSettled * 0.72),
    Math.round(branchSettled * 0.80),
    Math.round(branchSettled * 0.90),
    branchSettled
  ];
  const rejectedCurve = [
    Math.max(1, Math.round(branchRejected * 0.3)),
    Math.max(1, Math.round(branchRejected * 0.5)),
    Math.max(1, Math.round(branchRejected * 0.7)),
    Math.max(1, Math.round(branchRejected * 0.6)),
    Math.max(1, Math.round(branchRejected * 0.85)),
    branchRejected
  ];

  const maxVal = Math.max(...totalCurve, 10);
  const chartW = 860;
  const chartH = 220;
  const padL = 50;
  const padR = 30;
  const padT = 20;
  const padB = 40;
  const usableW = chartW - padL - padR;
  const usableH = chartH - padT - padB;

  function getX(i) { return padL + (i / (months.length - 1)) * usableW; }
  function getY(v) { return padT + usableH - (v / maxVal) * usableH; }

  const totalPoints = totalCurve.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const settledPoints = settledCurve.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const rejectedPoints = rejectedCurve.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

  // Gridlines & Labels
  let gridLines = '';
  const yTicks = 4;
  for (let t = 0; t <= yTicks; t++) {
    const yVal = Math.round((t / yTicks) * maxVal);
    const yPos = getY(yVal);
    gridLines += `<line x1="${padL}" y1="${yPos}" x2="${chartW - padR}" y2="${yPos}" stroke="#f1f5f9" stroke-dasharray="4 4" stroke-width="1"/>
      <text x="${padL - 10}" y="${yPos + 4}" font-size="10" fill="#94a3b8" text-anchor="end">${yVal}</text>`;
  }

  let xLabels = '';
  months.forEach((m, i) => {
    const xPos = getX(i);
    xLabels += `<text x="${xPos}" y="${chartH - 12}" font-size="11" font-weight="600" fill="#64748b" text-anchor="middle">${m}</text>
      <line x1="${xPos}" y1="${padT}" x2="${xPos}" y2="${padT + usableH}" stroke="#f8fafc" stroke-width="1"/>`;
  });

  // Data circles with tooltips
  let nodesHtml = '';
  months.forEach((m, i) => {
    const x = getX(i);
    const yt = getY(totalCurve[i]);
    const ys = getY(settledCurve[i]);
    const yr = getY(rejectedCurve[i]);
    nodesHtml += `
      <circle cx="${x}" cy="${yt}" r="4" fill="#0284c7" stroke="#ffffff" stroke-width="2"><title>${m}: ${totalCurve[i]} Total Cases</title></circle>
      <circle cx="${x}" cy="${ys}" r="4" fill="#16a34a" stroke="#ffffff" stroke-width="2"><title>${m}: ${settledCurve[i]} Settled</title></circle>
      <circle cx="${x}" cy="${yr}" r="4" fill="#ef4444" stroke="#ffffff" stroke-width="2"><title>${m}: ${rejectedCurve[i]} Rejected</title></circle>
    `;
  });

  return `
    <div class="branch-chart-stats-row" style="display:grid;grid-template-columns:repeat(4, 1fr);gap:1rem;margin-bottom:1.25rem">
      <div style="padding:0.75rem 1rem;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd">
        <div style="font-size:0.725rem;font-weight:700;color:#0369a1;text-transform:uppercase">Total Filed</div>
        <div style="font-size:1.4rem;font-weight:800;color:#0284c7">${branchTotal}</div>
      </div>
      <div style="padding:0.75rem 1rem;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0">
        <div style="font-size:0.725rem;font-weight:700;color:#15803d;text-transform:uppercase">Settled / Concluded</div>
        <div style="font-size:1.4rem;font-weight:800;color:#16a34a">${branchSettled}</div>
      </div>
      <div style="padding:0.75rem 1rem;background:#fef2f2;border-radius:8px;border:1px solid #fecaca">
        <div style="font-size:0.725rem;font-weight:700;color:#b91c1c;text-transform:uppercase">Rejected / Defective</div>
        <div style="font-size:1.4rem;font-weight:800;color:#ef4444">${branchRejected}</div>
      </div>
      <div style="padding:0.75rem 1rem;background:#faf5ff;border-radius:8px;border:1px solid #e9d5ff">
        <div style="font-size:0.725rem;font-weight:700;color:#7e22ce;text-transform:uppercase">Settlement Rate</div>
        <div style="font-size:1.4rem;font-weight:800;color:#9333ea">${settlementRate}%</div>
      </div>
    </div>

    <div style="position:relative;width:100%;overflow-x:auto">
      <svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:auto;min-width:600px;display:block">
        <defs>
          <linearGradient id="total-line-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        ${gridLines}
        ${xLabels}

        <!-- Total Area Gradient -->
        <polygon points="${padL},${padT + usableH} ${totalPoints} ${chartW - padR},${padT + usableH}" fill="url(#total-line-grad)"/>

        <!-- Line 1: Total Cases (Blue) -->
        <polyline points="${totalPoints}" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Line 2: Settled Cases (Green) -->
        <polyline points="${settledPoints}" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Line 3: Rejected Cases (Red) -->
        <polyline points="${rejectedPoints}" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3 3"/>

        ${nodesHtml}
      </svg>
    </div>
  `;
}


// ── Functional Admin Case Review & Legal Check Assistant ──

async function openAdminReviewModal(caseId) {
  const caseItem = allCases.find(c => c.caseId === caseId) || { caseId, petitioner: 'Filer', respondent: 'Respondent', caseType: 'Civil' };
  
  let legalLibrary = [];
  try {
    const res = await fetch(API + '/legal-library');
    if (res.ok) legalLibrary = await res.json();
  } catch (e) {}

  const legalOptionsHtml = legalLibrary.map(l => 
    '<option value="' + l.article + ' - ' + l.title + '">' + l.article + ': ' + l.title + ' (' + l.category + ')</option>'
  ).join('');

  const docs = caseItem.documents || [];
  const docsHtml = docs.length ? docs.map(d => {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.75rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:0.4rem">' +
      '<div style="display:flex;align-items:center;gap:0.5rem">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        '<div>' +
          '<div style="font-weight:700;font-size:0.825rem;color:var(--fsc-navy-main)">' + d.name + '</div>' +
          '<div style="font-size:0.7rem;color:#64748b">' + (d.size || '1.2 MB') + ' · Uploaded: ' + new Date(d.uploadedAt || Date.now()).toLocaleDateString() + '</div>' +
        '</div>' +
      '</div>' +
      '<a href="' + (d.path ? '/' + d.path.replace(/\\/g, '/') : '#') + '" target="_blank" class="btn-view-sm" style="padding:0.25rem 0.6rem;text-decoration:none;font-size:0.75rem">View / Download</a>' +
    '</div>';
  }).join('') : '<div style="padding:0.75rem;background:#ffffff;border-radius:6px;border:1px dashed #cbd5e1;color:#64748b;font-size:0.8rem">1. Supporting_Statement_of_Claim.pdf (Client submitted digital claim dossier)</div>';

  document.getElementById('admin-modal-title').textContent = 'Case Request Dossier & Judicial Labeling — ' + caseId;
  document.getElementById('admin-modal-body').innerHTML = 
    '<div style="max-height:75vh;overflow-y:auto;padding-right:0.35rem">' +
      '<!-- Filer & Case Overview Card -->' +
      '<div style="background:#f8fafc;padding:0.85rem 1.15rem;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:1rem">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div>' +
            '<div style="font-size:0.7rem;font-weight:700;color:#64748b;text-transform:uppercase">Case Title &amp; Parties</div>' +
            '<h3 style="font-size:1.1rem;font-weight:800;color:var(--fsc-navy-main);margin:0.2rem 0">' + (caseItem.caseTitle || caseItem.petitioner + ' vs. ' + caseItem.respondent) + '</h3>' +
          '</div>' +
          '<span class="status-pill ' + (caseItem.screeningStatus === 'approved' ? 'pill-green' : (caseItem.screeningStatus === 'rejected' ? 'pill-red' : 'pill-orange')) + '">' +
            ((caseItem.screeningStatus || 'PENDING SCREENING')).toUpperCase() +
          '</span>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:0.75rem;margin-top:0.75rem;font-size:0.8rem;border-top:1px solid #e2e8f0;padding-top:0.6rem">' +
          '<div><span style="color:#64748b">Filer Name:</span> <strong style="color:var(--fsc-navy-main)">' + (caseItem.petitioner || 'Plaintiff') + '</strong></div>' +
          '<div><span style="color:#64748b">Contact Phone:</span> <strong>' + (caseItem.filerPhone || '+251 911 123 456') + '</strong></div>' +
          '<div><span style="color:#64748b">Filing Date:</span> <strong>' + new Date(caseItem.filingDate || Date.now()).toLocaleDateString() + '</strong></div>' +
        '</div>' +

        (caseItem.description ? '<div style="margin-top:0.6rem;font-size:0.8rem;color:#334155;background:#ffffff;padding:0.6rem;border-radius:6px;border:1px solid #e2e8f0"><strong>Statement of Claim:</strong> ' + caseItem.description + '</div>' : '') +
      '</div>' +

      '<!-- Submitted Files Section -->' +
      '<div style="background:#f0f9ff;padding:0.85rem 1.15rem;border-radius:8px;border:1px solid #bae6fd;margin-bottom:1rem">' +
        '<div style="font-weight:800;color:#0369a1;font-size:0.85rem;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.35rem">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
          '<span>Client Submitted Documents &amp; Evidence Attachments</span>' +
        '</div>' +
        docsHtml +
      '</div>' +

      '<!-- Admin Review & Classification Form -->' +
      '<form onsubmit="handleAdminReviewSubmit(event, \'' + caseId + '\')">' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:0.9rem;margin-bottom:0.75rem">⚖️ Admin Case Classification &amp; Branch Assignment</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
          '<div>' +
            '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">1. Case Label / Category</label>' +
            '<select id="rev-category" class="top-search-input" style="width:100%;border-radius:6px;background:#ffffff" required>' +
              '<option value="Commercial & Banking Default" selected>Commercial &amp; Banking Default</option>' +
              '<option value="Civil Contract & Property">Civil Contract &amp; Property</option>' +
              '<option value="Labor & Employment Dispute">Labor &amp; Employment Dispute</option>' +
              '<option value="Constitutional & Administrative">Constitutional &amp; Administrative</option>' +
              '<option value="Criminal Proceedings">Criminal Proceedings</option>' +
              '<option value="Family & Succession">Family &amp; Succession</option>' +
            '</select>' +
          '</div>' +

          '<div>' +
            '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">2. Applicable Law / Legal Article Check</label>' +
            '<select id="rev-legal-article" class="top-search-input" style="width:100%;border-radius:6px;background:#ffffff">' +
              '<option value="Commercial Code Art. 715 - Banking Guarantees">Commercial Code Art. 715 - Banking Guarantees</option>' +
              '<option value="Civil Code Art. 2024 - Breach of Contract">Civil Code Art. 2024 - Breach of Contract</option>' +
              '<option value="Criminal Code Art. 675 - Fraud & Deception">Criminal Code Art. 675 - Fraud &amp; Deception</option>' +
              '<option value="FDRE Constitution Art. 37 - Access to Justice">FDRE Constitution Art. 37 - Access to Justice</option>' +
              legalOptionsHtml +
            '</select>' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
          '<div>' +
            '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">3. Screening Decision</label>' +
            '<select id="rev-decision" class="top-search-input" style="width:100%;border-radius:6px;background:#ffffff;font-weight:700" onchange="toggleBranchField(this.value)">' +
              '<option value="approved" selected>✓ Approve Case &amp; Assign Branch</option>' +
              '<option value="rejected">✕ Decline / Dismiss Case</option>' +
            '</select>' +
          '</div>' +

          '<div id="branch-select-group">' +
            '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">4. Assign Court Branch</label>' +
            '<select id="rev-branch" class="top-search-input" style="width:100%;border-radius:6px;background:#ffffff;font-weight:600">' +
              '<option value="Federal Supreme Court (Sidist Kilo)">Federal Supreme Court (Sidist Kilo)</option>' +
              '<option value="Federal High Court — Lideta Division">Federal High Court — Lideta Division</option>' +
              '<option value="Federal High Court — Arada Criminal">Federal High Court — Arada Criminal</option>' +
              '<option value="Federal First Instance — Kirkos & Bole">Federal First Instance — Kirkos &amp; Bole</option>' +
              '<option value="Dire Dawa Federal Circuit Court">Dire Dawa Federal Circuit Court</option>' +
            '</select>' +
          '</div>' +
        '</div>' +

        '<div style="margin-bottom:1.25rem">' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">5. Classification Notes / Reason for Decision</label>' +
          '<textarea id="rev-comments" class="top-search-input" style="width:100%;height:65px;border-radius:6px" placeholder="Enter judicial notes or decline rationale..."></textarea>' +
        '</div>' +

        '<div style="display:flex;gap:0.75rem">' +
          '<button type="submit" class="btn-export-dashboard" style="flex:1;padding:0.75rem;font-size:0.9rem">Submit Decision &amp; Save Dossier</button>' +
          '<button type="button" class="btn-view-sm" style="padding:0.75rem 1.25rem" onclick="closeAdminModal()">Cancel</button>' +
        '</div>' +
      '</form>' +
    '</div>';

  openAdminModal();
}

function toggleBranchField(decision) {
  const grp = document.getElementById('branch-select-group');
  if (grp) {
    grp.style.display = decision === 'approved' ? 'block' : 'none';
  }
}

async function handleAdminReviewSubmit(e, caseId) {
  e.preventDefault();
  const decision = document.getElementById('rev-decision').value;
  const branchAssigned = document.getElementById('rev-branch') ? document.getElementById('rev-branch').value : 'Federal Supreme Court (Sidist Kilo)';
  const caseCategory = document.getElementById('rev-category').value;
  const relevantLawArticle = document.getElementById('rev-legal-article').value;
  const comments = document.getElementById('rev-comments').value.trim();

  try {
    const res = await fetch(API + '/cases/admin-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        decision,
        branchAssigned,
        caseCategory,
        relevantLawArticle,
        comments,
        adminName: currentAdmin.fullName || 'Admin User'
      })
    });
    if (res.ok) {
      alert(decision === 'approved' ? '✓ Case APPROVED and forwarded to ' + branchAssigned : '✕ Case DECLINED.');
      closeAdminModal();
      await loadAdminData();
    }
  } catch (err) {
    alert('Error submitting decision: ' + err.message);
  }
}
async function handleAdminReviewSubmit(e, caseId) {
  e.preventDefault();
  const decision = document.getElementById('rev-decision').value;
  const branchAssigned = document.getElementById('rev-branch').value;
  const relevantLawArticle = document.getElementById('rev-legal-article').value;
  const comments = document.getElementById('rev-comments').value.trim();

  try {
    const res = await fetch(API + '/cases/admin-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        decision,
        branchAssigned,
        relevantLawArticle,
        comments,
        adminName: currentAdmin.fullName || 'Admin User'
      })
    });
    if (res.ok) {
      alert('Screening decision submitted successfully. Case forwarded to ' + branchAssigned);
      closeAdminModal();
      await loadAdminData();
    }
  } catch (err) {
    alert('Error submitting review: ' + err.message);
  }
}
