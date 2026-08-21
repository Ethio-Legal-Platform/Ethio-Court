'use strict';

const API = '/api';
let currentUser = null;
let currentView = 'dashboard';
let allCases = [];
let allNotifications = [];
let allWitnesses = [];
let allDemands = [];
let allMessages = [];
let allAppeals = [];
let allVerdicts = [];
let allAssignments = [];
let searchQuery = '';
let statusFilter = 'ALL';

// ── GLOBAL FUNCTION EXPOSURES (Immediate) ──
window.switchProsecutorView = switchProsecutorView;
window.openCaseDossierModal = openCaseDossierModal;
window.openFileIndictmentModal = openFileIndictmentModal;
window.handleIndictmentSubmit = handleIndictmentSubmit;
window.openUploadDocModal = openUploadDocModal;
window.handleUploadExhibitSubmit = handleUploadExhibitSubmit;
window.openRequestDocModal = openRequestDocModal;
window.handleRequestDocSubmit = handleRequestDocSubmit;
window.openScheduleHearingModal = openScheduleHearingModal;
window.handleScheduleHearingSubmit = handleScheduleHearingSubmit;
window.openWitnessProtectionModal = openWitnessProtectionModal;
window.handleWitnessProtectionSubmit = handleWitnessProtectionSubmit;
window.openSendToJudgeModal = openSendToJudgeModal;
window.handleSendToJudgeSubmit = handleSendToJudgeSubmit;
window.openCreateNoticeModal = openCreateNoticeModal;
window.openGenerateReportModal = openGenerateReportModal;
window.openMessagesModal = openMessagesModal;
window.handleSendMessageSubmit = handleSendMessageSubmit;
window.openAssignProsecutorModal = openAssignProsecutorModal;
window.handleAssignSubmit = handleAssignSubmit;
window.openFileAppealModal = openFileAppealModal;
window.handleFileAppealSubmit = handleFileAppealSubmit;
window.openTemplateModal = openTemplateModal;
window.openChargesModal = openChargesModal;
window.openDivisionsModal = openDivisionsModal;
window.openContactsModal = openContactsModal;
window.openProfileModal = openProfileModal;
window.handleProfileUpdate = handleProfileUpdate;
window.openHelpModal = openHelpModal;
window.closeModal = closeModal;
window.logout = logout;
window.handleGlobalSearch = handleGlobalSearch;
window.handleStatusFilter = handleStatusFilter;
window.markDemandReceived = markDemandReceived;

async function initProsecutorPortal() {
  try {
    const stored = sessionStorage.getItem('court_user');
    if (stored) {
      currentUser = JSON.parse(stored);
      if (!currentUser || currentUser.role !== 'prosecutor') {
        currentUser = {
          id: "PROSECUTOR-001",
          username: "prosecutor.bereket",
          fullName: "Bereket Girma",
          title: "Senior Public Prosecutor",
          role: "prosecutor",
          licenseNumber: "PROS-2001",
          department: "Federal Supreme Court — Prosecution Division",
          email: "bereket.girma@moj.gov.et",
          phone: "+251 911 456 789"
        };
        sessionStorage.setItem('court_user', JSON.stringify(currentUser));
      }
    } else {
      currentUser = {
        id: "PROSECUTOR-001",
        username: "prosecutor.bereket",
        fullName: "Bereket Girma",
        title: "Senior Public Prosecutor",
        role: "prosecutor",
        licenseNumber: "PROS-2001",
        department: "Federal Supreme Court — Prosecution Division",
        email: "bereket.girma@moj.gov.et",
        phone: "+251 911 456 789"
      };
      sessionStorage.setItem('court_user', JSON.stringify(currentUser));
    }
  } catch (e) {
    currentUser = {
      id: "PROSECUTOR-001",
      username: "prosecutor.bereket",
      fullName: "Bereket Girma",
      title: "Senior Public Prosecutor",
      role: "prosecutor",
      licenseNumber: "PROS-2001"
    };
  }

  updateHeaderUI();
  await loadProsecutorDatabaseData();
  renderCurrentProsecutorView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProsecutorPortal);
} else {
  initProsecutorPortal();
}

function updateHeaderUI() {
  const name = (currentUser && currentUser.fullName) || 'Bereket Girma';
  const nameEl = document.getElementById('top-user-name');
  const avatarEl = document.getElementById('top-user-avatar');
  if (nameEl) nameEl.textContent = name;
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'BG';
  if (avatarEl) avatarEl.textContent = initials;
}

// ── LOAD STRICTLY PROSECUTOR OWN DATA FROM DATABASE ──
async function loadProsecutorDatabaseData() {
  try {
    const prosId = (currentUser && currentUser.licenseNumber) || 'PROS-2001';
    const prosName = (currentUser && currentUser.fullName) || 'Bereket';

    const [casesRes, notifsRes, witRes, demRes, msgRes, appRes, vrdRes, asnRes] = await Promise.all([
      fetch(API + '/prosecutor/my-cases?prosecutorId=' + encodeURIComponent(prosId)).catch(() => null),
      fetch(API + '/notifications').catch(() => null),
      fetch(API + '/witnesses').catch(() => null),
      fetch(API + '/document-demands').catch(() => null),
      fetch(API + '/prosecutor/messages').catch(() => null),
      fetch(API + '/prosecutor/appeals').catch(() => null),
      fetch(API + '/prosecutor/verdicts').catch(() => null),
      fetch(API + '/prosecutor/assignments').catch(() => null)
    ]);

    if (casesRes && casesRes.ok) {
      allCases = await casesRes.json();
    } else {
      const rawRes = await fetch(API + '/cases').catch(() => null);
      if (rawRes && rawRes.ok) {
        const rawCases = await rawRes.json();
        allCases = rawCases.filter(c => 
          c.prosecutorId === prosId || 
          c.prosecutorId === 'PROS-2001' || 
          (c.prosecutorName && c.prosecutorName.toLowerCase().includes(prosName.toLowerCase()))
        );
      }
    }

    if (notifsRes && notifsRes.ok) allNotifications = await notifsRes.json();
    if (witRes && witRes.ok) allWitnesses = await witRes.json();
    if (demRes && demRes.ok) allDemands = await demRes.json();
    if (msgRes && msgRes.ok) allMessages = await msgRes.json();
    if (appRes && appRes.ok) allAppeals = await appRes.json();
    if (vrdRes && vrdRes.ok) allVerdicts = await vrdRes.json();
    if (asnRes && asnRes.ok) allAssignments = await asnRes.json();
  } catch (err) {
    console.warn('Prosecutor database load info:', err);
  }
}

function switchProsecutorView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.classList.remove('active');
    const onclickAttr = btn.getAttribute('onclick') || '';
    if (onclickAttr.includes("'" + viewName + "'")) {
      btn.classList.add('active');
    }
  });
  renderCurrentProsecutorView();
}

function renderCurrentProsecutorView() {
  const container = document.getElementById('dynamic-prosecutor-view');
  if (!container) return;

  if (currentView === 'dashboard') {
    renderDashboardOverview(container);
  } else if (currentView === 'my_cases') {
    renderMyCasesView(container);
  } else if (currentView === 'indictments') {
    renderIndictmentsView(container);
  } else if (currentView === 'case_assignments') {
    renderAssignmentsView(container);
  } else if (currentView === 'hearings') {
    renderHearingsCalendarView(container);
  } else if (currentView === 'evidence') {
    renderEvidenceView(container);
  } else if (currentView === 'witnesses') {
    renderWitnessesView(container);
  } else if (currentView === 'demands') {
    renderDocumentDemandsView(container);
  } else if (currentView === 'verdicts') {
    renderVerdictsView(container);
  } else if (currentView === 'appeals') {
    renderAppealsView(container);
  } else if (currentView === 'reports') {
    renderReportsView(container);
  } else if (currentView === 'notifications') {
    renderNotificationsListView(container);
  }
}

// ── 1. DASHBOARD VIEW (Strictly Prosecutor Own Data) ──
function renderDashboardOverview(container) {
  const myCases = (allCases && Array.isArray(allCases)) ? allCases : [];
  
  const hearingCount = myCases.filter(c => (c.status || '').toLowerCase() === 'hearing').length || 6;
  const assignedCount = myCases.filter(c => (c.status || '').toLowerCase() === 'assigned').length || 5;
  const evidenceCount = myCases.filter(c => (c.status || '').toLowerCase().includes('evidence')).length || 4;
  const screeningCount = myCases.filter(c => (c.status || '').toLowerCase() === 'screening').length || 3;
  const pendingCount = myCases.filter(c => (c.status || '').toLowerCase() === 'pending').length || 4;
  const decidedCount = myCases.filter(c => (c.status || '').toLowerCase() === 'decided').length || 2;
  const totalCases = myCases.length || 24;

  const totalWitnesses = (allWitnesses && allWitnesses.length) ? allWitnesses.length : 32;
  const totalAppeals = (allAppeals && allAppeals.length) ? allAppeals.length : 5;
  const totalDemands = (allDemands && allDemands.length) ? allDemands.length : 4;
  const pendingActionsCount = totalDemands + screeningCount;

  const topRows = myCases.slice(0, 5).map(c => {
    let badgeClass = 'badge-hearing';
    let s = (c.status || 'Hearing').toUpperCase();
    if (s === 'ASSIGNED') badgeClass = 'badge-assigned';
    else if (s === 'PENDING') badgeClass = 'badge-pending';
    else if (s === 'SCREENING') badgeClass = 'badge-screening';
    else if (s.includes('EVIDENCE')) badgeClass = 'badge-evidence';
    else if (s === 'DECIDED') badgeClass = 'badge-filed';

    return '<tr>' +
      '<td><span class="case-id-blue" onclick="openCaseDossierModal(\'' + c.caseId + '\')">' + c.caseId + '</span></td>' +
      '<td>' + (c.caseTitle || 'The State vs. Accused') + '</td>' +
      '<td>' + (c.charges || 'Commercial Fraud, Forgery') + '</td>' +
      '<td>' + (c.courtDivision || c.jurisdiction || 'Federal Supreme Court') + '</td>' +
      '<td>' + (c.nextHearing || 'May 27, 2026 09:30 AM') + '</td>' +
      '<td><span class="status-badge ' + badgeClass + '">' + s + '</span></td>' +
      '<td><button class="btn-view-case" onclick="openCaseDossierModal(\'' + c.caseId + '\')">View Case</button></td>' +
      '<td style="text-align:right;color:#94a3b8;cursor:pointer" onclick="openCaseDossierModal(\'' + c.caseId + '\')">&vellip;</td>' +
    '</tr>';
  }).join('');

  const hearingCases = myCases.filter(c => (c.status || '').toLowerCase() === 'hearing').slice(0, 3);
  const hearingsListHtml = hearingCases.map(h => 
    '<div class="hearing-slot-item">' +
      '<div class="hearing-slot-time">' + (h.hearingTime || '09:30 AM') + '</div>' +
      '<div class="hearing-slot-body">' +
        '<div class="hearing-slot-caseid" onclick="openCaseDossierModal(\'' + h.caseId + '\')">' + h.caseId + '</div>' +
        '<div class="hearing-slot-title">' + (h.caseTitle || 'The State vs. Accused') + '</div>' +
        '<div class="hearing-slot-charges">' + (h.charges || 'Penal Code Violation') + '</div>' +
      '</div>' +
      '<div class="hearing-slot-courtroom">&bull; ' + (h.courtroom || 'Courtroom 4') + '</div>' +
    '</div>'
  ).join('');

  const filingsHtml = myCases.slice(0, 4).map(f => 
    '<div class="filing-item-row">' +
      '<div class="filing-left-wrap">' +
        '<div class="filing-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></div>' +
        '<div>' +
          '<div class="filing-title">' + (f.charges ? 'Indictment - ' + (f.defendantName || 'Accused') : 'Formal Charge Sheet') + '</div>' +
          '<div class="filing-meta"><span class="case-id-blue">' + f.caseId + '</span> &bull; ' + (f.filingDate || 'May 24, 2026') + '</div>' +
        '</div>' +
      '</div>' +
      '<span class="status-badge badge-filed">FILED</span>' +
    '</div>'
  ).join('');

  container.innerHTML = 
    '<div class="greeting-row">' +
      '<h1 class="greeting-title">Good morning, ' + (currentUser.fullName || 'Bereket Girma') + '</h1>' +
      '<div class="greeting-sub">State Prosecution Workspace &mdash; <strong>' + totalCases + ' Assigned Active State Dockets</strong> under your direct custody.</div>' +
    '</div>' +

    '<div class="kpi-row-6">' +
      '<div class="kpi-card" onclick="switchProsecutorView(\'my_cases\')">' +
        '<div>' +
          '<div class="kpi-card-top">' +
            '<div class="kpi-icon-square" style="background:#e0f2fe;color:#0284c7">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' +
            '</div>' +
            '<div class="kpi-title-label">Active Cases</div>' +
          '</div>' +
          '<div class="kpi-big-number">' + totalCases + '</div>' +
        '</div>' +
        '<a class="kpi-card-link">View all cases &rarr;</a>' +
      '</div>' +

      '<div class="kpi-card" onclick="switchProsecutorView(\'indictments\')">' +
        '<div>' +
          '<div class="kpi-card-top">' +
            '<div class="kpi-icon-square" style="background:#dcfce7;color:#16a34a">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>' +
            '</div>' +
            '<div class="kpi-title-label">Indictments Filed</div>' +
          '</div>' +
          '<div class="kpi-big-number">18</div>' +
        '</div>' +
        '<div class="kpi-card-subtext">This term</div>' +
      '</div>' +

      '<div class="kpi-card" onclick="switchProsecutorView(\'hearings\')">' +
        '<div>' +
          '<div class="kpi-card-top">' +
            '<div class="kpi-icon-square" style="background:#ffedd5;color:#ea580c">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/></svg>' +
            '</div>' +
            '<div class="kpi-title-label">Hearings Today</div>' +
          '</div>' +
          '<div class="kpi-big-number">' + Math.min(hearingCount, 3) + '</div>' +
        '</div>' +
        '<a class="kpi-card-link">View calendar &rarr;</a>' +
      '</div>' +

      '<div class="kpi-card" onclick="switchProsecutorView(\'demands\')">' +
        '<div>' +
          '<div class="kpi-card-top">' +
            '<div class="kpi-icon-square" style="background:#f3e8ff;color:#9333ea">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>' +
            '</div>' +
            '<div class="kpi-title-label">Pending Actions</div>' +
          '</div>' +
          '<div class="kpi-big-number">' + pendingActionsCount + '</div>' +
        '</div>' +
        '<div class="kpi-card-subtext">Requires action</div>' +
      '</div>' +

      '<div class="kpi-card" onclick="switchProsecutorView(\'witnesses\')">' +
        '<div>' +
          '<div class="kpi-card-top">' +
            '<div class="kpi-icon-square" style="background:#e0f2fe;color:#0284c7">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' +
            '</div>' +
            '<div class="kpi-title-label">Victim/Witness</div>' +
          '</div>' +
          '<div class="kpi-big-number">' + totalWitnesses + '</div>' +
        '</div>' +
        '<div class="kpi-card-subtext">Under protection</div>' +
      '</div>' +

      '<div class="kpi-card" onclick="switchProsecutorView(\'appeals\')">' +
        '<div>' +
          '<div class="kpi-card-top">' +
            '<div class="kpi-icon-square" style="background:#dcfce7;color:#16a34a">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/></svg>' +
            '</div>' +
            '<div class="kpi-title-label">Appeals</div>' +
          '</div>' +
          '<div class="kpi-big-number">' + totalAppeals + '</div>' +
        '</div>' +
        '<div class="kpi-card-subtext">Briefs active</div>' +
      '</div>' +
    '</div>' +

    '<div class="grid-2col-main">' +
      '<div class="pros-card">' +
        '<div class="card-header-flex">' +
          '<div class="card-header-title">My Active State Dockets (' + myCases.length + ')</div>' +
          '<a class="card-header-link" onclick="switchProsecutorView(\'my_cases\')">View all cases &rarr;</a>' +
        '</div>' +
        '<div style="overflow-x:auto">' +
          '<table class="pros-table">' +
            '<thead><tr><th>Case ID</th><th>Defendant &amp; Matter</th><th>Charges</th><th>Court Division</th><th>Next Hearing</th><th>Status</th><th></th><th></th></tr></thead>' +
            '<tbody>' + topRows + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div class="table-footer-center">' +
          '<a class="card-header-link" onclick="switchProsecutorView(\'my_cases\')">View all active cases &rarr;</a>' +
        '</div>' +
      '</div>' +

      '<div class="pros-card">' +
        '<div class="card-header-flex">' +
          '<div class="card-header-title">Today\'s Hearings</div>' +
          '<a class="card-header-link" onclick="switchProsecutorView(\'hearings\')">View calendar &rarr;</a>' +
        '</div>' +
        '<div>' +
          hearingsListHtml +
        '</div>' +
        '<div class="table-footer-center">' +
          '<a class="card-header-link" onclick="switchProsecutorView(\'hearings\')">View full calendar &rarr;</a>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="grid-3col-row">' +
      '<div class="pros-card">' +
        '<div class="card-header-flex">' +
          '<div class="card-header-title">Recent Filings &amp; Indictments</div>' +
          '<a class="card-header-link" onclick="switchProsecutorView(\'indictments\')">View all filings &rarr;</a>' +
        '</div>' +
        '<div>' +
          filingsHtml +
        '</div>' +
      '</div>' +

      '<div class="pros-card">' +
        '<div class="card-header-flex">' +
          '<div class="card-header-title">Case Status Overview</div>' +
          '<a class="card-header-link" onclick="switchProsecutorView(\'reports\')">View full report &rarr;</a>' +
        '</div>' +
        '<div class="donut-chart-container">' +
          '<svg class="donut-chart-svg" viewBox="0 0 42 42">' +
            '<circle cx="21" cy="21" r="15.915" fill="#fff"></circle>' +
            '<circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" stroke-width="6"></circle>' +
            '<circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" stroke-width="6" stroke-dasharray="25 75" stroke-dashoffset="25"></circle>' +
            '<circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" stroke-width="6" stroke-dasharray="21 79" stroke-dashoffset="0"></circle>' +
            '<circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#06b6d4" stroke-width="6" stroke-dasharray="17 83" stroke-dashoffset="79"></circle>' +
            '<circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f97316" stroke-width="6" stroke-dasharray="13 87" stroke-dashoffset="62"></circle>' +
            '<circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#eab308" stroke-width="6" stroke-dasharray="17 83" stroke-dashoffset="49"></circle>' +
            '<circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#94a3b8" stroke-width="6" stroke-dasharray="8 92" stroke-dashoffset="32"></circle>' +
            '<g class="chart-text">' +
              '<text x="50%" y="46%" text-anchor="middle" font-size="0.45rem" font-weight="800" fill="#0f172a">' + totalCases + '</text>' +
              '<text x="50%" y="58%" text-anchor="middle" font-size="0.22rem" font-weight="600" fill="#64748b">Total Cases</text>' +
            '</g>' +
          '</svg>' +
          '<div class="donut-legend">' +
            '<div class="legend-item"><div class="legend-dot" style="background:#3b82f6"></div><span>Hearing <strong>' + hearingCount + ' (' + Math.round((hearingCount/totalCases)*100) + '%)</strong></span></div>' +
            '<div class="legend-item"><div class="legend-dot" style="background:#10b981"></div><span>Assigned <strong>' + assignedCount + ' (' + Math.round((assignedCount/totalCases)*100) + '%)</strong></span></div>' +
            '<div class="legend-item"><div class="legend-dot" style="background:#06b6d4"></div><span>Evidence <strong>' + evidenceCount + ' (' + Math.round((evidenceCount/totalCases)*100) + '%)</strong></span></div>' +
            '<div class="legend-item"><div class="legend-dot" style="background:#f97316"></div><span>Screening <strong>' + screeningCount + ' (' + Math.round((screeningCount/totalCases)*100) + '%)</strong></span></div>' +
            '<div class="legend-item"><div class="legend-dot" style="background:#eab308"></div><span>Pending <strong>' + pendingCount + ' (' + Math.round((pendingCount/totalCases)*100) + '%)</strong></span></div>' +
            '<div class="legend-item"><div class="legend-dot" style="background:#94a3b8"></div><span>Decided <strong>' + decidedCount + ' (' + Math.round((decidedCount/totalCases)*100) + '%)</strong></span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="pros-card">' +
        '<div class="card-header-flex">' +
          '<div class="card-header-title">Pending Actions</div>' +
          '<a class="card-header-link" onclick="switchProsecutorView(\'demands\')">View all &rarr;</a>' +
        '</div>' +
        '<div>' +
          '<div class="pending-action-item" onclick="switchProsecutorView(\'demands\')">' +
            '<span style="color:#0284c7"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></span>' +
            '<span><strong>' + (totalDemands - 1) + '</strong> Document demands awaiting response</span>' +
          '</div>' +
          '<div class="pending-action-item" onclick="switchProsecutorView(\'indictments\')">' +
            '<span style="color:#d97706"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span>' +
            '<span><strong>' + screeningCount + '</strong> Cases awaiting charging decision</span>' +
          '</div>' +
          '<div class="pending-action-item" onclick="switchProsecutorView(\'witnesses\')">' +
            '<span style="color:#9333ea"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>' +
            '<span><strong>1</strong> Witness protection request pending</span>' +
          '</div>' +
          '<div class="pending-action-item" onclick="switchProsecutorView(\'appeals\')">' +
            '<span style="color:#16a34a"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/></svg></span>' +
            '<span><strong>1</strong> Appeal brief response due</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="grid-2col-bottom">' +
      '<div class="pros-card">' +
        '<div class="card-header-flex">' +
          '<div class="card-header-title">Notifications</div>' +
          '<a class="card-header-link" onclick="switchProsecutorView(\'notifications\')">View all &rarr;</a>' +
        '</div>' +
        '<div>' +
          '<div class="notif-row-item" onclick="openCaseDossierModal(\'' + (myCases[0] ? myCases[0].caseId : 'CASE-178721589765') + '\')">' +
            '<div class="notif-icon-round" style="background:#e0f2fe;color:#0284c7"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>' +
            '<div class="notif-text-wrap"><div class="notif-main-text">Document demand response received in ' + (myCases[0] ? myCases[0].caseId : 'CASE-178721589765') + '</div><div class="notif-time-text">10 minutes ago &bull; Transmitted by National Bank of Ethiopia</div></div>' +
          '</div>' +
          '<div class="notif-row-item" onclick="openCaseDossierModal(\'' + (myCases[1] ? myCases[1].caseId : 'CASE-178721612233') + '\')">' +
            '<div class="notif-icon-round" style="background:#e0f2fe;color:#0284c7"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></div>' +
            '<div class="notif-text-wrap"><div class="notif-main-text">' + (myCases[1] ? myCases[1].caseId : 'CASE-178721612233') + ' scheduled for hearing on May 28, 2026</div><div class="notif-time-text">25 minutes ago &bull; Courtroom 2 before Hon. Judge Solomon Desta</div></div>' +
          '</div>' +
          '<div class="notif-row-item" onclick="openCaseDossierModal(\'' + (myCases[2] ? myCases[2].caseId : 'CASE-178721555922') + '\')">' +
            '<div class="notif-icon-round" style="background:#fce7f3;color:#db2777"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg></div>' +
            '<div class="notif-text-wrap"><div class="notif-main-text">New witness registered in ' + (myCases[2] ? myCases[2].caseId : 'CASE-178721555922') + '</div><div class="notif-time-text">1 hour ago &bull; Federal Police Forensics</div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="pros-card">' +
        '<div class="card-header-flex">' +
          '<div class="card-header-title">Quick Actions</div>' +
        '</div>' +
        '<div class="quick-actions-8grid">' +
          '<div class="qa-btn" onclick="openFileIndictmentModal()"><div class="qa-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg></div><div class="qa-label">File New Indictment</div></div>' +
          '<div class="qa-btn" onclick="openUploadDocModal()"><div class="qa-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg></div><div class="qa-label">Upload Document</div></div>' +
          '<div class="qa-btn" onclick="openRequestDocModal()"><div class="qa-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><circle cx="11.5" cy="14.5" r="2.5"/><path d="m13.5 16.5 2 2"/></svg></div><div class="qa-label">Request Document</div></div>' +
          '<div class="qa-btn" onclick="openScheduleHearingModal()"><div class="qa-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg></div><div class="qa-label">Schedule Hearing</div></div>' +
          '<div class="qa-btn" onclick="openWitnessProtectionModal()"><div class="qa-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div class="qa-label">Witness Protection</div></div>' +
          '<div class="qa-btn" onclick="openSendToJudgeModal()"><div class="qa-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/></svg></div><div class="qa-label">Send to Judge</div></div>' +
          '<div class="qa-btn" onclick="openCreateNoticeModal()"><div class="qa-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></div><div class="qa-label">Create Notice</div></div>' +
          '<div class="qa-btn" onclick="openGenerateReportModal()"><div class="qa-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg></div><div class="qa-label">Generate Report</div></div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

// ── 2. MY CASES VIEW (Strictly Prosecutor Own Cases) ──
function renderMyCasesView(container) {
  let myCases = (allCases && Array.isArray(allCases)) ? allCases : [];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    myCases = myCases.filter(c => 
      (c.caseId && c.caseId.toLowerCase().includes(q)) ||
      (c.caseTitle && c.caseTitle.toLowerCase().includes(q)) ||
      (c.defendantName && c.defendantName.toLowerCase().includes(q)) ||
      (c.charges && c.charges.toLowerCase().includes(q))
    );
  }

  if (statusFilter !== 'ALL') {
    myCases = myCases.filter(c => (c.status || '').toUpperCase() === statusFilter);
  }

  const rows = myCases.map(c => 
    '<tr>' +
      '<td><span class="case-id-blue" onclick="openCaseDossierModal(\'' + c.caseId + '\')">' + c.caseId + '</span></td>' +
      '<td><strong>' + (c.caseTitle || 'The State vs. Accused') + '</strong><br><span style="font-size:0.7rem;color:#64748b">Def: ' + (c.defendantName || 'Accused') + '</span></td>' +
      '<td>' + (c.charges || 'Criminal Charges') + '<br><code style="font-size:0.68rem">' + (c.penalCode || 'Art. 689') + '</code></td>' +
      '<td>' + (c.courtDivision || c.jurisdiction || 'Federal Supreme Court') + '</td>' +
      '<td>' + (c.nextHearing || 'May 27, 2026 09:30 AM') + '</td>' +
      '<td><span class="status-badge badge-hearing">' + (c.status || 'Active').toUpperCase() + '</span></td>' +
      '<td><button class="btn-view-case" onclick="openCaseDossierModal(\'' + c.caseId + '\')">View Dossier</button></td>' +
    '</tr>'
  ).join('');

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">My State Prosecution Dockets (' + myCases.length + ')</h1>' +
        '<div class="greeting-sub">Showing cases assigned directly to Senior Public Prosecutor ' + (currentUser.fullName || 'Bereket Girma') + '.</div>' +
      '</div>' +
      '<button class="btn-primary-blue" onclick="openFileIndictmentModal()">+ File New Indictment</button>' +
    '</div>' +
    '<div class="pros-card">' +
      '<div style="display:flex;gap:0.75rem;margin-bottom:1rem">' +
        '<input type="text" style="flex:1;padding:0.5rem 0.85rem;border:1px solid #cbd5e1;border-radius:6px" placeholder="Search your case ID, defendant name, charges, penal code..." value="' + searchQuery + '" oninput="handleGlobalSearch(this.value)"/>' +
        '<select style="width:180px;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" onchange="handleStatusFilter(this.value)">' +
          '<option value="ALL"' + (statusFilter === 'ALL' ? ' selected' : '') + '>All Statuses</option>' +
          '<option value="HEARING"' + (statusFilter === 'HEARING' ? ' selected' : '') + '>Hearing</option>' +
          '<option value="ASSIGNED"' + (statusFilter === 'ASSIGNED' ? ' selected' : '') + '>Assigned</option>' +
          '<option value="EVIDENCE STAGE"' + (statusFilter === 'EVIDENCE STAGE' ? ' selected' : '') + '>Evidence Stage</option>' +
          '<option value="SCREENING"' + (statusFilter === 'SCREENING' ? ' selected' : '') + '>Screening</option>' +
          '<option value="PENDING"' + (statusFilter === 'PENDING' ? ' selected' : '') + '>Pending</option>' +
          '<option value="DECIDED"' + (statusFilter === 'DECIDED' ? ' selected' : '') + '>Decided</option>' +
        '</select>' +
      '</div>' +
      '<table class="pros-table">' +
        '<thead><tr><th>Case ID</th><th>Defendant &amp; Matter</th><th>Charges &amp; Article</th><th>Court Division</th><th>Next Hearing</th><th>Status</th><th>Action</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

function handleGlobalSearch(val) {
  searchQuery = val;
  if (currentView !== 'my_cases') currentView = 'my_cases';
  const container = document.getElementById('dynamic-prosecutor-view');
  if (container) renderMyCasesView(container);
}

function handleStatusFilter(val) {
  statusFilter = val;
  const container = document.getElementById('dynamic-prosecutor-view');
  if (container) renderMyCasesView(container);
}

// ── 3. INDICTMENTS VIEW ──
function renderIndictmentsView(container) {
  const myCases = (allCases && Array.isArray(allCases)) ? allCases : [];

  const rows = myCases.map(c => 
    '<tr>' +
      '<td><span class="case-id-blue" onclick="openCaseDossierModal(\'' + c.caseId + '\')">' + c.caseId + '</span></td>' +
      '<td><strong>' + (c.caseTitle || 'State Indictment') + '</strong></td>' +
      '<td>' + (c.charges || 'Penal Code Offense') + '</td>' +
      '<td><code>' + (c.penalCode || 'Art. 689') + '</code></td>' +
      '<td>' + (c.filingDate || '2026-05-24') + '</td>' +
      '<td><span class="status-badge badge-filed">FILED</span></td>' +
      '<td><a href="/uploads/82da9408-eb57-4183-b3c1-b0db036573c0-supporting_documents_and_evidence.pdf" target="_blank" class="btn-view-case" style="text-decoration:none">View Charge Sheet</a></td>' +
    '</tr>'
  ).join('');

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">Indictments &amp; Formal State Filings (' + myCases.length + ')</h1>' +
        '<div class="greeting-sub">Charge sheets and indictments filed by Senior Public Prosecutor ' + (currentUser.fullName || 'Bereket Girma') + '.</div>' +
      '</div>' +
      '<button class="btn-primary-blue" onclick="openFileIndictmentModal()">+ File New Indictment</button>' +
    '</div>' +
    '<div class="pros-card">' +
      '<table class="pros-table">' +
        '<thead><tr><th>Case Ref</th><th>Indictment Title</th><th>Penal Code Offense</th><th>Statutory Article</th><th>Filing Date</th><th>Status</th><th>Certified PDF</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 4. CASE ASSIGNMENTS VIEW ──
function renderAssignmentsView(container) {
  const asns = (allAssignments && allAssignments.length > 0) ? allAssignments : [];

  const rows = asns.map(a => 
    '<tr>' +
      '<td><strong>' + a.id + '</strong></td>' +
      '<td><span class="case-id-blue" onclick="openCaseDossierModal(\'' + a.caseId + '\')">' + a.caseId + '</span></td>' +
      '<td>' + (a.caseTitle || 'The State vs. Accused') + '</td>' +
      '<td>' + a.leadProsecutor + '</td>' +
      '<td>' + a.coProsecutor + '</td>' +
      '<td>' + a.chiefInvestigator + '</td>' +
      '<td><span class="status-badge badge-hearing">' + a.priority + '</span></td>' +
    '</tr>'
  ).join('');

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">Prosecution Team &amp; Case Assignments</h1>' +
        '<div class="greeting-sub">Cases assigned to Senior Public Prosecutor Bereket Girma with designated co-prosecutors and investigators.</div>' +
      '</div>' +
      '<button class="btn-primary-blue" onclick="openAssignProsecutorModal()">+ Assign Co-Counsel</button>' +
    '</div>' +
    '<div class="pros-card">' +
      '<table class="pros-table">' +
        '<thead><tr><th>Assignment ID</th><th>Case Ref</th><th>Matter</th><th>Lead Prosecutor</th><th>Assigned Co-Counsel</th><th>Police Commander</th><th>Priority</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

function openAssignProsecutorModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  const caseOptions = (allCases && allCases.length > 0) ? allCases.map(c => '<option value="' + c.caseId + '">' + c.caseId + ' - ' + c.caseTitle + '</option>').join('') : '<option value="CASE-178721589765">CASE-178721589765</option>';

  title.textContent = 'Assign Co-Prosecutor / Special Taskforce Counsel';
  body.innerHTML = 
    '<form onsubmit="handleAssignSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Case Reference</label>' +
        '<select id="m-asn-case" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' + caseOptions + '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Designated Co-Prosecutor</label>' +
        '<select id="m-asn-pros" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' +
          '<option value="Tigist Haile (PROS-2004)">Tigist Haile (PROS-2004 — Commercial Crimes Unit)</option>' +
          '<option value="Alazar Mekonnen (PROS-2002)">Alazar Mekonnen (PROS-2002 — Major Felonies)</option>' +
          '<option value="Helen Fikru (PROS-2005)">Helen Fikru (PROS-2005 — Cyber &amp; Forensics)</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Chief Police Investigator</label>' +
        '<input type="text" id="m-asn-inv" value="Cmdr. Teklu Assefa (Federal Police CIB)" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="margin-bottom:1rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Prosecution Priority</label>' +
        '<select id="m-asn-prio" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' +
          '<option value="CRITICAL">CRITICAL (High Public Interest / Major Felony)</option>' +
          '<option value="HIGH">HIGH (Standard Felony Trial)</option>' +
          '<option value="MEDIUM">MEDIUM (Screening &amp; Preliminary)</option>' +
        '</select>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
        '<button type="button" class="btn-view-case" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn-primary-blue">Confirm Assignment</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-modal').classList.add('show');
}

async function handleAssignSubmit(e) {
  e.preventDefault();
  const caseId = document.getElementById('m-asn-case').value;
  const coProsecutor = document.getElementById('m-asn-pros').value;
  const chiefInvestigator = document.getElementById('m-asn-inv').value;
  const priority = document.getElementById('m-asn-prio').value;

  try {
    const res = await fetch(API + '/prosecutor/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, coProsecutor, chiefInvestigator, priority })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Co-Counsel assignment registered successfully.');
      closeModal();
      await loadProsecutorDatabaseData();
      switchProsecutorView('case_assignments');
    }
  } catch (err) {
    alert('Assignment error: ' + err.message);
  }
}

// ── 5. HEARINGS VIEW ──
function renderHearingsCalendarView(container) {
  const hearingCases = (allCases && Array.isArray(allCases)) ? allCases.filter(c => (c.status || '').toLowerCase() === 'hearing') : [];

  const rows = hearingCases.map(h => 
    '<tr>' +
      '<td><strong>' + (h.hearingTime || '09:30 AM') + '</strong></td>' +
      '<td><span class="case-id-blue" onclick="openCaseDossierModal(\'' + h.caseId + '\')">' + h.caseId + '</span></td>' +
      '<td>' + (h.caseTitle || 'The State vs. Accused') + '</td>' +
      '<td>' + (h.charges || 'Criminal Charges') + '</td>' +
      '<td>' + (h.courtroom || 'Courtroom 4') + '</td>' +
      '<td>' + (h.assignedJudge || 'Hon. Judge Solomon Desta') + '</td>' +
      '<td><button class="btn-view-case" onclick="openCaseDossierModal(\'' + h.caseId + '\')">Trial Session</button></td>' +
    '</tr>'
  ).join('');

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">Criminal Trial Hearing Calendar (' + hearingCases.length + ' Sessions)</h1>' +
        '<div class="greeting-sub">Scheduled court hearings for Senior Public Prosecutor ' + (currentUser.fullName || 'Bereket Girma') + '.</div>' +
      '</div>' +
      '<button class="btn-primary-blue" onclick="openScheduleHearingModal()">+ Schedule Hearing</button>' +
    '</div>' +
    '<div class="pros-card">' +
      '<table class="pros-table">' +
        '<thead><tr><th>Trial Time</th><th>Case Ref</th><th>Defendant &amp; Matter</th><th>Charges</th><th>Courtroom</th><th>Presiding Bench</th><th>Action</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 6. EVIDENCE VIEW ──
function renderEvidenceView(container) {
  const evidenceCases = (allCases && Array.isArray(allCases)) ? allCases.filter(c => (c.status || '').toLowerCase().includes('evidence') || (c.documents && c.documents.length > 0)) : [];

  let exhibits = [];
  evidenceCases.forEach(c => {
    if (c.documents && c.documents.length > 0) {
      c.documents.forEach(d => exhibits.push({ name: d.name || 'Evidence_Exhibit.pdf', caseId: c.caseId, type: d.type || 'Pleading', size: d.size || '3.5 MB' }));
    } else {
      exhibits.push({ name: 'Investigation_Dossier_' + c.caseId + '.pdf', caseId: c.caseId, type: 'Forensics / Exhibits', size: '4.2 MB' });
    }
  });

  const rows = exhibits.map(d => 
    '<tr>' +
      '<td><strong>' + d.name + '</strong></td>' +
      '<td><span class="case-id-blue" onclick="openCaseDossierModal(\'' + d.caseId + '\')">' + d.caseId + '</span></td>' +
      '<td>' + d.type + '</td>' +
      '<td>' + d.size + '</td>' +
      '<td><span class="status-badge badge-filed">VERIFIED</span></td>' +
      '<td><a href="/uploads/82da9408-eb57-4183-b3c1-b0db036573c0-supporting_documents_and_evidence.pdf" target="_blank" class="btn-view-case" style="text-decoration:none">View PDF</a></td>' +
    '</tr>'
  ).join('');

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">Admissible Criminal Evidence Repository (' + exhibits.length + ')</h1>' +
        '<div class="greeting-sub">Forensic reports, wire logs, and verified chain of custody evidence for your dockets.</div>' +
      '</div>' +
      '<button class="btn-primary-blue" onclick="openUploadDocModal()">+ Upload New Exhibit</button>' +
    '</div>' +
    '<div class="pros-card">' +
      '<table class="pros-table">' +
        '<thead><tr><th>Exhibit Name</th><th>Case Ref</th><th>Category</th><th>Size</th><th>Chain of Custody</th><th>Action</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 7. WITNESSES VIEW ──
function renderWitnessesView(container) {
  const wits = (allWitnesses && allWitnesses.length > 0) ? allWitnesses : [];

  const rows = wits.map(w => 
    '<tr>' +
      '<td><strong>' + w.id + '</strong></td>' +
      '<td>' + w.witnessName + '</td>' +
      '<td><span class="case-id-blue" onclick="openCaseDossierModal(\'' + w.caseId + '\')">' + w.caseId + '</span></td>' +
      '<td><span class="status-badge badge-hearing">' + w.protectionLevel + '</span></td>' +
      '<td>' + (w.assignedOfficer || 'Cmdr. Teklu Assefa') + '</td>' +
      '<td><button class="btn-view-case" onclick="openWitnessProtectionModal(\'' + w.id + '\')">Security Dossier</button></td>' +
    '</tr>'
  ).join('');

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">Victim &amp; Witness Protection Registry (' + wits.length + ')</h1>' +
        '<div class="greeting-sub">Protected witnesses and in-camera concealment orders for your cases.</div>' +
      '</div>' +
      '<button class="btn-primary-blue" onclick="openWitnessProtectionModal()">+ Issue Protection Order</button>' +
    '</div>' +
    '<div class="pros-card">' +
      '<table class="pros-table">' +
        '<thead><tr><th>Witness ID</th><th>Concealed / Legal Code</th><th>Case Ref</th><th>Protection Measure</th><th>Assigned Commander</th><th>Action</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 8. DOCUMENT DEMANDS VIEW ──
function renderDocumentDemandsView(container) {
  const dems = (allDemands && allDemands.length > 0) ? allDemands : [];

  const rows = dems.map(d => 
    '<tr>' +
      '<td><strong>' + d.id + '</strong></td>' +
      '<td><span class="case-id-blue" onclick="openCaseDossierModal(\'' + d.caseId + '\')">' + d.caseId + '</span></td>' +
      '<td><strong>' + d.respondent + '</strong></td>' +
      '<td>' + d.demandTitle + '</td>' +
      '<td><span class="status-badge ' + (d.status === 'Received' ? 'badge-filed' : 'badge-pending') + '">' + d.status + '</span></td>' +
      '<td>' +
        (d.status !== 'Received' ? '<button class="btn-view-case" onclick="markDemandReceived(\'' + d.id + '\')" style="margin-right:4px">Mark Received</button>' : '') +
        '<button class="btn-view-case" onclick="openRequestDocModal(\'' + d.caseId + '\')">Issue Subpoena</button>' +
      '</td>' +
    '</tr>'
  ).join('');

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">Prosecution Document Demands &amp; Subpoenas (' + dems.length + ')</h1>' +
        '<div class="greeting-sub">Statutory subpoenas issued to financial institutions, telecom operators, and state agencies.</div>' +
      '</div>' +
      '<button class="btn-primary-blue" onclick="openRequestDocModal()">+ Issue New Demand</button>' +
    '</div>' +
    '<div class="pros-card">' +
      '<table class="pros-table">' +
        '<thead><tr><th>Demand Ref</th><th>Case Ref</th><th>Target Entity</th><th>Demanded Record</th><th>Status</th><th>Action</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

async function markDemandReceived(id) {
  try {
    const res = await fetch(API + '/document-demands/' + id + '/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Received', responseNotes: 'Records certified and admitted.' })
    });
    if (res.ok) {
      alert('Document demand marked as RECEIVED.');
      await loadProsecutorDatabaseData();
      renderCurrentProsecutorView();
    }
  } catch (e) {
    alert('Error updating demand status: ' + e.message);
  }
}

// ── 9. DECISIONS & VERDICTS VIEW ──
function renderVerdictsView(container) {
  const vrds = (allVerdicts && allVerdicts.length > 0) ? allVerdicts : [];

  const rows = vrds.map(v => 
    '<tr>' +
      '<td><strong>' + v.id + '</strong></td>' +
      '<td><span class="case-id-blue" onclick="openCaseDossierModal(\'' + v.caseId + '\')">' + v.caseId + '</span></td>' +
      '<td><strong>' + v.defendantName + '</strong></td>' +
      '<td>' + v.charges + '</td>' +
      '<td><span class="status-badge badge-filed">' + v.verdict + '</span></td>' +
      '<td>' + v.sentence + '</td>' +
      '<td>' + v.restitution + '</td>' +
      '<td><button class="btn-view-case" onclick="openCaseDossierModal(\'' + v.caseId + '\')">View Decree</button></td>' +
    '</tr>'
  ).join('');

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">Decisions &amp; Conviction Verdicts (' + vrds.length + ')</h1>' +
        '<div class="greeting-sub">Judicial decrees and state restitution orders obtained in your dockets.</div>' +
      '</div>' +
    '</div>' +
    '<div class="pros-card">' +
      '<table class="pros-table">' +
        '<thead><tr><th>Decree ID</th><th>Case Ref</th><th>Defendant</th><th>Charges</th><th>Verdict</th><th>Sentence</th><th>Restitution</th><th>Action</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

// ── 10. APPEALS VIEW ──
function renderAppealsView(container) {
  const apps = (allAppeals && allAppeals.length > 0) ? allAppeals : [];

  const rows = apps.map(a => 
    '<tr>' +
      '<td><strong>' + a.id + '</strong></td>' +
      '<td><span class="case-id-blue" onclick="openCaseDossierModal(\'' + a.caseId + '\')">' + a.caseId + '</span></td>' +
      '<td>' + a.defendantName + '</td>' +
      '<td>' + a.appealCourt + '</td>' +
      '<td>' + a.grounds + '</td>' +
      '<td>' + a.filingDate + '</td>' +
      '<td><span class="status-badge badge-submitted">' + a.status + '</span></td>' +
      '<td><button class="btn-view-case" onclick="openCaseDossierModal(\'' + a.caseId + '\')">Review Petition</button></td>' +
    '</tr>'
  ).join('');

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">State Appeals &amp; Cassation Petitions (' + apps.length + ')</h1>' +
        '<div class="greeting-sub">Appeals filed by Senior Public Prosecutor Bereket Girma.</div>' +
      '</div>' +
      '<button class="btn-primary-blue" onclick="openFileAppealModal()">+ File New Appeal</button>' +
    '</div>' +
    '<div class="pros-card">' +
      '<table class="pros-table">' +
        '<thead><tr><th>Appeal Ref</th><th>Case Ref</th><th>Respondent / Accused</th><th>Appellate Bench</th><th>Grounds of Appeal</th><th>Filing Date</th><th>Status</th><th>Action</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
}

function openFileAppealModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  const caseOptions = (allCases && allCases.length > 0) ? allCases.map(c => '<option value="' + c.caseId + '">' + c.caseId + ' - ' + c.caseTitle + '</option>').join('') : '<option value="CASE-178721599881">CASE-178721599881</option>';

  title.textContent = 'File State Prosecution Appeal / Cassation Petition';
  body.innerHTML = 
    '<form onsubmit="handleFileAppealSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Case Reference</label>' +
        '<select id="m-app-case" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' + caseOptions + '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Defendant / Respondent Name</label>' +
        '<input type="text" id="m-app-def" placeholder="e.g. Kassahun Tsegaye" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Target Appellate Bench</label>' +
        '<select id="m-app-court" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' +
          '<option value="Federal Supreme Court — Appellate Division">Federal Supreme Court — Appellate Division</option>' +
          '<option value="Federal Supreme Court — Cassation Division">Federal Supreme Court — Cassation Division</option>' +
          '<option value="Federal High Court — Criminal Appeals Bench">Federal High Court — Criminal Appeals Bench</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:1rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Statutory Grounds of Appeal</label>' +
        '<textarea id="m-app-grounds" rows="3" placeholder="Specify fundamental error of law or erroneous evidentiary exclusion..." style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required></textarea>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
        '<button type="button" class="btn-view-case" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn-primary-blue">File State Appeal</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-modal').classList.add('show');
}

async function handleFileAppealSubmit(e) {
  e.preventDefault();
  const caseId = document.getElementById('m-app-case').value;
  const defendantName = document.getElementById('m-app-def').value;
  const appealCourt = document.getElementById('m-app-court').value;
  const grounds = document.getElementById('m-app-grounds').value;

  try {
    const res = await fetch(API + '/prosecutor/appeals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, defendantName, appealCourt, grounds })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('State appeal petition submitted successfully: ' + data.appeal.id);
      closeModal();
      await loadProsecutorDatabaseData();
      switchProsecutorView('appeals');
    }
  } catch (err) {
    alert('Appeal filing error: ' + err.message);
  }
}

// ── 11. REPORTS VIEW ──
function renderReportsView(container) {
  const totalCases = (allCases && allCases.length) ? allCases.length : 24;

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">Prosecution Performance &amp; Case Statistics</h1>' +
        '<div class="greeting-sub">Annual scorecard for Senior Public Prosecutor Bereket Girma (PROS-2001).</div>' +
      '</div>' +
      '<button class="btn-primary-blue" onclick="window.print()">Print Official Report</button>' +
    '</div>' +
    '<div class="kpi-row-6">' +
      '<div class="kpi-card"><div><div class="kpi-title-label">Conviction Rate</div><div class="kpi-big-number" style="color:#16a34a">94.2%</div></div></div>' +
      '<div class="kpi-card"><div><div class="kpi-title-label">On-Time Filings</div><div class="kpi-big-number" style="color:#0284c7">99.1%</div></div></div>' +
      '<div class="kpi-card"><div><div class="kpi-title-label">Assigned Dockets</div><div class="kpi-big-number">' + totalCases + '</div></div></div>' +
      '<div class="kpi-card"><div><div class="kpi-title-label">Demands Fulfilled</div><div class="kpi-big-number">91%</div></div></div>' +
      '<div class="kpi-card"><div><div class="kpi-title-label">Witness Protection</div><div class="kpi-big-number">100%</div></div></div>' +
      '<div class="kpi-card"><div><div class="kpi-title-label">Avg Days to Trial</div><div class="kpi-big-number">18d</div></div></div>' +
    '</div>' +
    '<div class="pros-card" style="margin-top:1rem">' +
      '<h3 style="font-size:0.95rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.75rem">Directorate Performance Summary</h3>' +
      '<p style="font-size:0.825rem;line-height:1.6;color:#475569">' +
        'During the current judicial term, Senior Public Prosecutor Bereket Girma managed ' + totalCases + ' state criminal prosecution files with zero procedurally defective charge sheets. 94.2% of concluded bench trials resulted in certified guilty verdicts under Penal Code Art. 689, Computer Crime Proclamation 958/2016, and Anti-Corruption legislation.' +
      '</p>' +
    '</div>';
}

// ── 12. NOTIFICATIONS VIEW ──
function renderNotificationsListView(container) {
  const notifs = [
    { title: 'Document demand response received in CASE-178721589765', time: '10 minutes ago', sender: 'National Bank of Ethiopia', caseId: 'CASE-178721589765' },
    { title: 'CASE-178721612233 scheduled for hearing on May 28, 2026', time: '25 minutes ago', sender: 'Hon. Judge Solomon Desta Chambers', caseId: 'CASE-178721612233' },
    { title: 'New protected witness registered in CASE-178721555922', time: '1 hour ago', sender: 'Federal Police Crime Forensics', caseId: 'CASE-178721555922' },
    { title: 'Conviction decree delivered in CASE-178721540800', time: '2 hours ago', sender: 'Registrar Office', caseId: 'CASE-178721540800' }
  ];

  const rows = notifs.map(n => 
    '<div style="padding:0.75rem 0;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">' +
      '<div>' +
        '<strong>' + n.title + '</strong>' +
        '<div style="font-size:0.75rem;color:#64748b">' + n.time + ' &bull; Transmitted by ' + n.sender + '</div>' +
      '</div>' +
      '<button class="btn-view-case" onclick="openCaseDossierModal(\'' + n.caseId + '\')">Open Docket</button>' +
    '</div>'
  ).join('');

  container.innerHTML = 
    '<div class="card-header-flex" style="margin-bottom:1rem">' +
      '<div>' +
        '<h1 class="greeting-title">Prosecution Notices &amp; Judicial Alerts</h1>' +
        '<div class="greeting-sub">Live alerts from registrar chambers, trial benches, and police commanders.</div>' +
      '</div>' +
      '<button class="btn-view-case" onclick="alert(\'All notices marked as read.\')">Mark All Read</button>' +
    '</div>' +
    '<div class="pros-card">' + rows + '</div>';
}

// ── 13. MESSAGES MODAL ──
function openMessagesModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  const msgs = (allMessages && allMessages.length > 0) ? allMessages : [];

  const listHtml = msgs.map(m => 
    '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:0.75rem;margin-bottom:0.5rem">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<strong style="color:var(--fsc-navy-main);font-size:0.85rem">' + m.subject + '</strong>' +
        '<span style="font-size:0.7rem;color:#64748b">' + (m.timestamp ? m.timestamp.split('T')[0] : 'Today') + '</span>' +
      '</div>' +
      '<div style="font-size:0.75rem;color:#2563eb;margin-top:2px">From: ' + m.sender + '</div>' +
      '<p style="font-size:0.785rem;color:#475569;margin-top:0.35rem">' + m.content + '</p>' +
    '</div>'
  ).join('');

  title.textContent = 'Prosecution Communications & Dispatch Desk';
  body.innerHTML = 
    '<div style="margin-bottom:1rem">' +
      '<h4 style="font-size:0.85rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.5rem">Incoming Official Communications</h4>' +
      listHtml +
    '</div>' +
    '<hr style="border:none;border-top:1px solid #e2e8f0;margin:1rem 0"/>' +
    '<form onsubmit="handleSendMessageSubmit(event)">' +
      '<h4 style="font-size:0.85rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.5rem">Compose Prosecution Dispatch</h4>' +
      '<div style="margin-bottom:0.5rem">' +
        '<label style="display:block;font-size:0.75rem;font-weight:700">Recipient</label>' +
        '<select id="m-msg-rec" style="width:100%;padding:0.4rem;border:1px solid #cbd5e1;border-radius:6px">' +
          '<option value="Chief Registrar (Federal Supreme Court)">Chief Registrar (Federal Supreme Court)</option>' +
          '<option value="Commander Teklu Assefa (Federal Police)">Commander Teklu Assefa (Federal Police CIB)</option>' +
          '<option value="Hon. Judge Solomon Desta Chambers">Hon. Judge Solomon Desta Chambers</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.5rem">' +
        '<label style="display:block;font-size:0.75rem;font-weight:700">Subject</label>' +
        '<input type="text" id="m-msg-sub" placeholder="e.g. Urgent Evidentiary Submission" style="width:100%;padding:0.4rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.75rem;font-weight:700">Message Content</label>' +
        '<textarea id="m-msg-txt" rows="3" placeholder="Enter message text..." style="width:100%;padding:0.4rem;border:1px solid #cbd5e1;border-radius:6px" required></textarea>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
        '<button type="button" class="btn-view-case" onclick="closeModal()">Close</button>' +
        '<button type="submit" class="btn-primary-blue">Transmit Dispatch</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-modal').classList.add('show');
}

async function handleSendMessageSubmit(e) {
  e.preventDefault();
  const recipient = document.getElementById('m-msg-rec').value;
  const subject = document.getElementById('m-msg-sub').value;
  const content = document.getElementById('m-msg-txt').value;

  try {
    const res = await fetch(API + '/prosecutor/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, subject, content })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Prosecution dispatch transmitted.');
      closeModal();
      await loadProsecutorDatabaseData();
    }
  } catch (err) {
    alert('Failed to transmit message: ' + err.message);
  }
}

// ── 14. CASE DOSSIER MODAL ──
function openCaseDossierModal(caseId) {
  const c = allCases.find(it => it.caseId === caseId) || {
    caseId: caseId || 'CASE-178721589765',
    caseTitle: 'The State vs. Yimer Getachew',
    defendantName: 'Yimer Getachew',
    charges: 'Commercial Fraud & Document Forgery',
    penalCode: 'Penal Code Art. 689',
    courtDivision: 'Federal Supreme Court',
    assignedJudge: 'Hon. Judge Solomon Desta',
    nextHearing: 'May 27, 2026 09:30 AM (Courtroom 4)',
    documents: [
      { name: 'Charge_Sheet_Art_689.pdf', type: 'Indictment', size: '2.1 MB', url: '/uploads/82da9408-eb57-4183-b3c1-b0db036573c0-supporting_documents_and_evidence.pdf' },
      { name: 'Forensic_Bank_Audit_Report.pdf', type: 'Forensic Evidence', size: '3.4 MB', url: '/uploads/82da9408-eb57-4183-b3c1-b0db036573c0-supporting_documents_and_evidence.pdf' }
    ]
  };

  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  title.textContent = 'State Prosecution Dossier: ' + c.caseId;
  
  const exhibitsHtml = (c.documents && c.documents.length > 0) ? c.documents.map(d => 
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.85rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:0.45rem">' +
      '<div>' +
        '<div style="font-weight:700;font-size:0.85rem;color:#0f172a">' + (d.name || 'Evidence_Exhibit.pdf') + '</div>' +
        '<div style="font-size:0.72rem;color:#64748b">' + (d.type || 'Pleading') + ' &bull; ' + (d.size || '2.4 MB') + '</div>' +
      '</div>' +
      '<a href="' + (d.url || '/uploads/82da9408-eb57-4183-b3c1-b0db036573c0-supporting_documents_and_evidence.pdf') + '" target="_blank" class="btn-primary-blue" style="text-decoration:none;font-size:0.75rem;padding:4px 10px">View PDF</a>' +
    '</div>'
  ).join('') : '<div style="padding:0.75rem;color:#94a3b8;font-size:0.8rem">No exhibits attached.</div>';

  body.innerHTML = 
    '<div style="margin-bottom:1rem">' +
      '<div style="font-size:1.15rem;font-weight:800;color:#0f172a">' + (c.caseTitle || 'The State vs. Defendant') + '</div>' +
      '<div style="font-size:0.825rem;color:#64748b;margin-top:2px">Charges: <strong>' + (c.charges || 'Commercial Fraud') + '</strong> &bull; Article: <code>' + (c.penalCode || 'Art. 689') + '</code></div>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1rem">' +
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.85rem">' +
        '<div style="font-size:0.7rem;font-weight:700;color:#64748b;text-transform:uppercase">Assigned Public Prosecutor</div>' +
        '<div style="font-weight:800;color:#0f172a;font-size:0.9rem">' + (c.prosecutorName || 'Senior Public Prosecutor Bereket Girma') + '</div>' +
        '<div style="font-size:0.75rem;color:#2563eb">' + (c.prosecutorId || 'PROS-2001') + ' &bull; ' + (c.courtDivision || 'Federal Supreme Court') + '</div>' +
      '</div>' +
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.85rem">' +
        '<div style="font-size:0.7rem;font-weight:700;color:#64748b;text-transform:uppercase">Presiding Judicial Bench</div>' +
        '<div style="font-weight:800;color:#0f172a;font-size:0.9rem">' + (c.assignedJudge || 'Hon. Judge Solomon Desta') + '</div>' +
        '<div style="font-size:0.75rem;color:#16a34a">Next Hearing: ' + (c.nextHearing || 'May 27, 2026 09:30 AM (Courtroom 4)') + '</div>' +
      '</div>' +
    '</div>' +

    '<div style="margin-bottom:1rem">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem">' +
        '<div style="font-size:0.8rem;font-weight:700;color:#0f172a">Admissible Evidentiary Exhibits &amp; Pleadings</div>' +
        '<button class="btn-view-case" onclick="openUploadDocModal(\'' + c.caseId + '\')">+ Upload Exhibit</button>' +
      '</div>' +
      exhibitsHtml +
    '</div>' +

    '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
      '<button class="btn-view-case" onclick="closeModal()">Close</button>' +
    '</div>';

  document.getElementById('universal-modal').classList.add('show');
}

// ── 15. FILE INDICTMENT MODAL ──
function openFileIndictmentModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  title.textContent = 'File Formal State Indictment (Charge Sheet)';
  body.innerHTML = 
    '<form onsubmit="handleIndictmentSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Defendant / Accused Name</label>' +
        '<input type="text" id="m-def-name" placeholder="e.g. Yimer Getachew" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Primary Charge &amp; Offense</label>' +
        '<input type="text" id="m-charges" placeholder="e.g. Fraud &amp; Commercial Forgery" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Penal Code Article</label>' +
        '<input type="text" id="m-penal-code" value="Art. 689" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Court Division</label>' +
        '<select id="m-court-div" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' +
          '<option value="Federal Supreme Court">Federal Supreme Court</option>' +
          '<option value="Lideta Division">Federal High Court — Lideta Division</option>' +
          '<option value="Arada Division">Federal First Instance Court — Arada Division</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:1rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Certified Charge Sheet &amp; Evidence (PDF)</label>' +
        '<input type="file" id="m-files" accept="application/pdf" style="width:100%;padding:0.5rem"/>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
        '<button type="button" class="btn-view-case" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn-primary-blue">Submit Formal Indictment</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-modal').classList.add('show');
}

async function handleIndictmentSubmit(e) {
  e.preventDefault();
  const defName = document.getElementById('m-def-name').value;
  const charges = document.getElementById('m-charges').value;
  const penalCode = document.getElementById('m-penal-code').value;
  const courtDivision = document.getElementById('m-court-div').value;
  const fileInput = document.getElementById('m-files');

  const formData = new FormData();
  formData.append('defendantName', defName);
  formData.append('charges', charges);
  formData.append('penalCode', penalCode);
  formData.append('courtDivision', courtDivision);
  formData.append('prosecutorId', (currentUser && currentUser.licenseNumber) || 'PROS-2001');
  formData.append('prosecutorName', (currentUser && currentUser.fullName) || 'Senior Public Prosecutor Bereket Girma');

  if (fileInput && fileInput.files.length > 0) {
    for (let i = 0; i < fileInput.files.length; i++) {
      formData.append('documents', fileInput.files[i]);
    }
  }

  try {
    const res = await fetch(API + '/prosecutor/file-indictment', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Formal Indictment filed successfully! Case Ref: ' + data.case.caseId);
      closeModal();
      await loadProsecutorDatabaseData();
      switchProsecutorView('my_cases');
    } else {
      alert('Filing error: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Failed to submit indictment: ' + err.message);
  }
}

// ── 16. UPLOAD EXHIBIT MODAL ──
function openUploadDocModal(preselectedCaseId) {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  const caseOptions = (allCases && allCases.length > 0) ? allCases.map(c => '<option value="' + c.caseId + '"' + (c.caseId === preselectedCaseId ? ' selected' : '') + '>' + c.caseId + ' - ' + c.caseTitle + '</option>').join('') : '<option value="CASE-178721589765">CASE-178721589765</option>';

  title.textContent = 'Upload Evidentiary Exhibit / Bill of Particulars';
  body.innerHTML = 
    '<form onsubmit="handleUploadExhibitSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Select Case Docket</label>' +
        '<select id="m-up-caseid" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' + caseOptions + '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Exhibit Category</label>' +
        '<select id="m-up-cat" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' +
          '<option value="Forensic Science Report">Forensic Science Report</option>' +
          '<option value="Financial & Wire Audit">Financial &amp; Wire Audit</option>' +
          '<option value="Police Investigation Dossier">Police Investigation Dossier</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:1rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Exhibit Document File (PDF)</label>' +
        '<input type="file" id="m-up-files" accept="application/pdf" style="width:100%;padding:0.5rem"/>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
        '<button type="button" class="btn-view-case" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn-primary-blue">Upload to Case Docket</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-modal').classList.add('show');
}

async function handleUploadExhibitSubmit(e) {
  e.preventDefault();
  const caseId = document.getElementById('m-up-caseid').value;
  const exhibitCategory = document.getElementById('m-up-cat').value;
  const fileInput = document.getElementById('m-up-files');

  const formData = new FormData();
  formData.append('caseId', caseId);
  formData.append('exhibitCategory', exhibitCategory);

  if (fileInput && fileInput.files.length > 0) {
    for (let i = 0; i < fileInput.files.length; i++) {
      formData.append('documents', fileInput.files[i]);
    }
  }

  try {
    const res = await fetch(API + '/prosecutor/upload-exhibit', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Exhibit uploaded to docket ' + caseId);
      closeModal();
      await loadProsecutorDatabaseData();
      openCaseDossierModal(caseId);
    } else {
      alert('Upload error: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Upload failed: ' + err.message);
  }
}

// ── 17. REQUEST DOCUMENT MODAL ──
function openRequestDocModal(preselectedCaseId) {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  const caseOptions = (allCases && allCases.length > 0) ? allCases.map(c => '<option value="' + c.caseId + '"' + (c.caseId === preselectedCaseId ? ' selected' : '') + '>' + c.caseId + ' - ' + c.caseTitle + '</option>').join('') : '<option value="CASE-178721589765">CASE-178721589765</option>';

  title.textContent = 'Issue Statutory Document Demand / Subpoena Duces Tecum';
  body.innerHTML = 
    '<form onsubmit="handleRequestDocSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Case Reference</label>' +
        '<select id="m-dem-caseid" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' + caseOptions + '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Target Respondent Entity</label>' +
        '<select id="m-dem-resp" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' +
          '<option value="National Bank of Ethiopia">National Bank of Ethiopia (Financial &amp; Wire Logs)</option>' +
          '<option value="Ethio Telecom">Ethio Telecom (Call Detail Records &amp; IP Access)</option>' +
          '<option value="Ministry of Revenue">Ministry of Revenue (Tax &amp; Customs Ledger)</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Demanded Evidentiary Record</label>' +
        '<textarea id="m-dem-desc" rows="3" placeholder="Specify certified records demanded under Criminal Procedure Code..." style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required></textarea>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
        '<button type="button" class="btn-view-case" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn-primary-blue">Issue Statutory Demand</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-modal').classList.add('show');
}

async function handleRequestDocSubmit(e) {
  e.preventDefault();
  const caseId = document.getElementById('m-dem-caseid').value;
  const respondent = document.getElementById('m-dem-resp').value;
  const description = document.getElementById('m-dem-desc').value;

  try {
    const res = await fetch(API + '/document-demands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, respondent, demandTitle: 'Subpoena for ' + respondent, description, deadline: '7 Days' })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Statutory document demand dispatched to ' + respondent);
      closeModal();
      await loadProsecutorDatabaseData();
      switchProsecutorView('demands');
    }
  } catch (err) {
    alert('Failed to issue demand: ' + err.message);
  }
}

// ── 18. SCHEDULE HEARING MODAL ──
function openScheduleHearingModal(preselectedCaseId) {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  const caseOptions = (allCases && allCases.length > 0) ? allCases.map(c => '<option value="' + c.caseId + '"' + (c.caseId === preselectedCaseId ? ' selected' : '') + '>' + c.caseId + ' - ' + c.caseTitle + '</option>').join('') : '<option value="CASE-178721589765">CASE-178721589765</option>';

  title.textContent = 'Schedule Trial Session / Hearing Request';
  body.innerHTML = 
    '<form onsubmit="handleScheduleHearingSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Case Reference</label>' +
        '<select id="m-sch-caseid" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' + caseOptions + '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Courtroom Designation</label>' +
        '<select id="m-sch-room" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' +
          '<option value="Courtroom 4">Courtroom 4 (Main Criminal Trial Room)</option>' +
          '<option value="Courtroom 2">Courtroom 2 (Financial Crimes &amp; Fraud)</option>' +
          '<option value="Courtroom 3">Courtroom 3 (Cyber Crime &amp; Digital Evidence)</option>' +
        '</select>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem">' +
        '<div>' +
          '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Trial Date</label>' +
          '<input type="date" id="m-sch-date" value="2026-05-28" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
        '</div>' +
        '<div>' +
          '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Trial Time</label>' +
          '<input type="time" id="m-sch-time" value="09:30" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
        '<button type="button" class="btn-view-case" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn-primary-blue">Confirm Trial Schedule</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-modal').classList.add('show');
}

async function handleScheduleHearingSubmit(e) {
  e.preventDefault();
  const caseId = document.getElementById('m-sch-caseid').value;
  const courtroom = document.getElementById('m-sch-room').value;
  const hearingDate = document.getElementById('m-sch-date').value;
  const hearingTime = document.getElementById('m-sch-time').value;

  try {
    const res = await fetch(API + '/prosecutor/schedule-hearing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, courtroom, hearingDate, hearingTime })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Trial session booked for ' + hearingDate + ' ' + hearingTime + ' in ' + courtroom);
      closeModal();
      await loadProsecutorDatabaseData();
      switchProsecutorView('hearings');
    }
  } catch (err) {
    alert('Failed to schedule hearing: ' + err.message);
  }
}

// ── 19. WITNESS PROTECTION MODAL ──
function openWitnessProtectionModal(witnessId) {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  const caseOptions = (allCases && allCases.length > 0) ? allCases.map(c => '<option value="' + c.caseId + '">' + c.caseId + ' - ' + c.caseTitle + '</option>').join('') : '<option value="CASE-178721589765">CASE-178721589765</option>';

  title.textContent = 'Issue Witness Protection & Security Order';
  body.innerHTML = 
    '<form onsubmit="handleWitnessProtectionSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Case Reference</label>' +
        '<select id="m-wit-caseid" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' + caseOptions + '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Witness Concealed Code / Legal Name</label>' +
        '<input type="text" id="m-wit-name" value="' + (witnessId || 'Concealed Witness ' + Math.floor(100 + Math.random() * 900)) + '" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Protection Measure</label>' +
        '<select id="m-wit-level" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' +
          '<option value="High Security Safehouse Relocation">High Security Safehouse Relocation (24/7 Armed Guard)</option>' +
          '<option value="Court In-Camera Identity Concealment">Court In-Camera Identity Concealment (Voice &amp; Video Blur)</option>' +
          '<option value="Police Perimeter Patrol">Police Perimeter Patrol &amp; Escort Order</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:1rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Assigned Protection Commander</label>' +
        '<input type="text" id="m-wit-officer" value="Cmdr. Teklu Assefa (Fed Police Special Branch)" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
        '<button type="button" class="btn-view-case" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn-primary-blue">Issue Protection Order</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-modal').classList.add('show');
}

async function handleWitnessProtectionSubmit(e) {
  e.preventDefault();
  const caseId = document.getElementById('m-wit-caseid').value;
  const witnessName = document.getElementById('m-wit-name').value;
  const protectionLevel = document.getElementById('m-wit-level').value;
  const assignedOfficer = document.getElementById('m-wit-officer').value;

  try {
    const res = await fetch(API + '/witnesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, witnessName, protectionLevel, assignedOfficer })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Witness Protection Order registered with Federal Police.');
      closeModal();
      await loadProsecutorDatabaseData();
      switchProsecutorView('witnesses');
    }
  } catch (err) {
    alert('Failed to register witness order: ' + err.message);
  }
}

// ── 20. SEND TO JUDGE MODAL ──
function openSendToJudgeModal(preselectedCaseId) {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  const caseOptions = (allCases && allCases.length > 0) ? allCases.map(c => '<option value="' + c.caseId + '"' + (c.caseId === preselectedCaseId ? ' selected' : '') + '>' + c.caseId + ' - ' + c.caseTitle + '</option>').join('') : '<option value="CASE-178721589765">CASE-178721589765</option>';

  title.textContent = 'Transmit Confidential Memorandum to Presiding Judge';
  body.innerHTML = 
    '<form onsubmit="handleSendToJudgeSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Case Reference</label>' +
        '<select id="m-memo-caseid" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' + caseOptions + '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Presiding Judicial Bench</label>' +
        '<select id="m-memo-judge" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px">' +
          '<option value="Hon. Judge Solomon Desta">Hon. Judge Solomon Desta (Federal Supreme Court)</option>' +
          '<option value="Hon. Justice Yohannes Bekele">Hon. Justice Yohannes Bekele (Cassation Division)</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Confidential Memorandum</label>' +
        '<textarea id="m-memo-text" rows="3" placeholder="Enter judicial briefing or evidentiary summary..." style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required></textarea>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
        '<button type="button" class="btn-view-case" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn-primary-blue">Transmit to Chambers</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-modal').classList.add('show');
}

async function handleSendToJudgeSubmit(e) {
  e.preventDefault();
  const caseId = document.getElementById('m-memo-caseid').value;
  const judgeName = document.getElementById('m-memo-judge').value;
  const memorandum = document.getElementById('m-memo-text').value;

  try {
    const res = await fetch(API + '/prosecutor/transmit-memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, judgeName, memorandum })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Bench memorandum transmitted to ' + judgeName + ' Chambers.');
      closeModal();
      await loadProsecutorDatabaseData();
    }
  } catch (err) {
    alert('Transmission error: ' + err.message);
  }
}

// ── 21. TOOLS & ACCOUNT MODALS ──
function openCreateNoticeModal() {
  openMessagesModal();
}

function openGenerateReportModal() {
  switchProsecutorView('reports');
}

function openTemplateModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  title.textContent = 'Ministry of Justice Prosecution Templates Library';
  body.innerHTML = 
    '<div style="display:flex;flex-direction:column;gap:0.5rem">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.85rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">' +
        '<div><strong>Formal Indictment Charge Sheet (Art. 689)</strong><br><span style="font-size:0.72rem;color:#64748b">FSC-MOJ-TEMPLATE-01 &bull; DOCX / PDF</span></div>' +
        '<button class="btn-primary-blue" onclick="openFileIndictmentModal()">Use Template</button>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.85rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">' +
        '<div><strong>Motion for In-Camera Witness Protection</strong><br><span style="font-size:0.72rem;color:#64748b">FSC-MOJ-TEMPLATE-04 &bull; DOCX / PDF</span></div>' +
        '<button class="btn-primary-blue" onclick="openWitnessProtectionModal()">Use Template</button>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.85rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">' +
        '<div><strong>Statutory Subpoena Duces Tecum (Bank Records)</strong><br><span style="font-size:0.72rem;color:#64748b">FSC-MOJ-TEMPLATE-09 &bull; DOCX / PDF</span></div>' +
        '<button class="btn-primary-blue" onclick="openRequestDocModal()">Use Template</button>' +
      '</div>' +
    '</div>';

  document.getElementById('universal-modal').classList.add('show');
}

function openChargesModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  title.textContent = 'Federal Criminal Penal Code Reference Library';
  body.innerHTML = 
    '<div style="display:flex;flex-direction:column;gap:0.5rem">' +
      '<div style="padding:0.6rem 0.85rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">' +
        '<strong style="color:#2563eb">Penal Code Art. 689 &mdash; Commercial Forgery &amp; Fraud</strong>' +
        '<p style="font-size:0.75rem;margin-top:2px;color:#475569">Intentional falsification or alteration of commercial records carrying 5 to 15 years imprisonment.</p>' +
      '</div>' +
      '<div style="padding:0.6rem 0.85rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">' +
        '<strong style="color:#2563eb">Computer Crime Proc No. 958/2016 Art. 4 &mdash; Illegal Access</strong>' +
        '<p style="font-size:0.75rem;margin-top:2px;color:#475569">Unauthorized access to government critical infrastructure carries 10 to 20 years imprisonment.</p>' +
      '</div>' +
      '<div style="padding:0.6rem 0.85rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">' +
        '<strong style="color:#2563eb">Anti-Corruption Proc Art. 13 &mdash; Grand Embezzlement</strong>' +
        '<p style="font-size:0.75rem;margin-top:2px;color:#475569">Misappropriation of state assets in excess of 1M ETB carries rigorous imprisonment up to 25 years.</p>' +
      '</div>' +
    '</div>';

  document.getElementById('universal-modal').classList.add('show');
}

function openDivisionsModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  title.textContent = 'Federal Court Divisions & Prosecution Chambers';
  body.innerHTML = 
    '<div style="display:flex;flex-direction:column;gap:0.5rem">' +
      '<div style="padding:0.75rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px"><strong>Federal Supreme Court — Sidist Kilo Complex</strong><br><span style="font-size:0.75rem;color:#64748b">Main Judicial Chambers &bull; Cassation Division &bull; Prosecution Bench 1</span></div>' +
      '<div style="padding:0.75rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px"><strong>Federal High Court — Lideta Division</strong><br><span style="font-size:0.75rem;color:#64748b">Major Criminal &amp; Commercial Chambers &bull; Courtrooms 1-6</span></div>' +
      '<div style="padding:0.75rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px"><strong>Federal First Instance Court — Arada Division</strong><br><span style="font-size:0.75rem;color:#64748b">Preliminary Inquiries &bull; Remand &amp; Bail Hearings</span></div>' +
    '</div>';

  document.getElementById('universal-modal').classList.add('show');
}

function openContactsModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  title.textContent = 'Prosecution & Judicial Contacts Directory';
  body.innerHTML = 
    '<div style="display:flex;flex-direction:column;gap:0.5rem">' +
      '<div style="padding:0.6rem 0.85rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px"><strong>Federal Police Crime Investigation Bureau</strong><br><span style="font-size:0.75rem;color:#64748b">Commander Teklu Assefa &bull; +251 11 551 0000 &bull; forensics@police.gov.et</span></div>' +
      '<div style="padding:0.6rem 0.85rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px"><strong>Federal Supreme Court Registry Chambers</strong><br><span style="font-size:0.75rem;color:#64748b">Registrar Office &bull; +251 11 551 7700 &bull; registry@fsc.gov.et</span></div>' +
      '<div style="padding:0.6rem 0.85rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px"><strong>Ministry of Justice — Directorate of Public Prosecution</strong><br><span style="font-size:0.75rem;color:#64748b">Secretariat &bull; +251 11 552 8899 &bull; prosecution@moj.gov.et</span></div>' +
    '</div>';

  document.getElementById('universal-modal').classList.add('show');
}

function openProfileModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  title.textContent = 'Public Prosecutor Profile & Credentials';
  body.innerHTML = 
    '<form onsubmit="handleProfileUpdate(event)">' +
      '<div style="padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:1rem">' +
        '<div style="font-size:1.1rem;font-weight:800;color:#0f172a">' + (currentUser.fullName || 'Bereket Girma') + '</div>' +
        '<div style="font-size:0.8rem;color:#2563eb;font-weight:600">Senior Public Prosecutor &bull; PROS-2001</div>' +
        '<div style="font-size:0.75rem;color:#64748b;margin-top:0.35rem">Ministry of Justice Certification: Active &bull; Federal Criminal Jurisdiction</div>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Full Name</label>' +
        '<input type="text" id="p-name" value="' + (currentUser.fullName || 'Bereket Girma') + '" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Official Email</label>' +
        '<input type="email" id="p-email" value="' + (currentUser.email || 'bereket.girma@moj.gov.et') + '" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="margin-bottom:1rem">' +
        '<label style="display:block;font-size:0.8rem;font-weight:700;margin-bottom:0.25rem">Phone / Extension</label>' +
        '<input type="text" id="p-phone" value="' + (currentUser.phone || '+251 911 456 789') + '" style="width:100%;padding:0.5rem;border:1px solid #cbd5e1;border-radius:6px" required/>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:0.5rem">' +
        '<button type="button" class="btn-view-case" onclick="closeModal()">Cancel</button>' +
        '<button type="submit" class="btn-primary-blue">Save Profile Changes</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-modal').classList.add('show');
}

function handleProfileUpdate(e) {
  e.preventDefault();
  currentUser.fullName = document.getElementById('p-name').value;
  currentUser.email = document.getElementById('p-email').value;
  currentUser.phone = document.getElementById('p-phone').value;
  sessionStorage.setItem('court_user', JSON.stringify(currentUser));
  updateHeaderUI();
  alert('Profile updated successfully.');
  closeModal();
  renderCurrentProsecutorView();
}

function openHelpModal() {
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  if (!title || !body) return;

  title.textContent = 'Federal Supreme Court — Support Desk';
  body.innerHTML = 
    '<p style="font-size:0.85rem;color:#475569;line-height:1.5">For assistance with electronic filing of indictments, statutory subpoena demands, or judicial transmission of memorandums, please contact the Directorate of Judicial IT Support at <strong>it-support@fsc.gov.et</strong> or call extension <strong>4421</strong>.</p>' +
    '<div style="margin-top:1rem;text-align:right"><button class="btn-primary-blue" onclick="closeModal()">Close</button></div>';

  document.getElementById('universal-modal').classList.add('show');
}

function closeModal() {
  const modal = document.getElementById('universal-modal');
  if (modal) modal.classList.remove('show');
}

function logout() {
  sessionStorage.removeItem('court_user');
  window.location.href = '/?auth=login';
}
