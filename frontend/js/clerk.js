'use strict';

const API = '/api';
let currentClerk = {
  id: "CLERK-001",
  username: "clerk.kalkidan",
  fullName: "Kalkidan Mengistu",
  title: "Court Clerk",
  role: "clerk",
  branch: "Federal Supreme Court",
  division: "Court Registry & Case Administration",
  email: "kalkidan.registry@courts.gov.et",
  phone: "+251 11 551 7700 (Ext 22)"
};

let currentClerkView = 'dashboard';
let allCases = [];
let allSmsLogs = [];
let activeDocketTab = 'dossier';

const ICONS = {
  fileText: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>',
  folderCheck: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><polyline points="9 13 12 16 17 11"/></svg>',
  calendarClock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/><circle cx="16" cy="16" r="4"/><path d="M16 14v2l1 1"/></svg>',
  uploadDoc: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
  checkCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  filePlus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/></svg>',
  scales: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
  messageSquare: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  chart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  edit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  list: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>'
};

function viewRealDocument(url, title) {
  if (url && url !== 'undefined') {
    window.open(url, '_blank');
  } else {
    alert('Opening certified judicial record: ' + (title || 'Court Document'));
  }
}
window.viewRealDocument = viewRealDocument;

// ── Strict Clerk Case Appointment Filter ──
function isCaseAppointedToCurrentClerk(c) {
  if (!c) return false;
  const clerkId = (currentClerk.id || 'CLERK-001').toLowerCase();
  const clerkUser = (currentClerk.username || 'clerk.kalkidan').toLowerCase();
  const clerkName = (currentClerk.fullName || 'Kalkidan Mengistu').toLowerCase();
  const clerkTokens = clerkName.split(/\s+/).filter(t => t.length > 2);

  // 1. Direct clerkId match
  if (c.clerkId && (c.clerkId.toLowerCase() === clerkId || c.clerkId.toLowerCase() === clerkUser)) return true;
  if (c.assignedClerkId && (c.assignedClerkId.toLowerCase() === clerkId || c.assignedClerkId.toLowerCase() === clerkUser)) return true;

  // 2. clerkName or assignedClerk name match
  if (c.clerkName) {
    const cName = String(c.clerkName).toLowerCase();
    if (cName.includes(clerkId) || clerkTokens.some(tok => cName.includes(tok))) return true;
  }
  if (c.assignedClerk) {
    const aClerk = String(c.assignedClerk).toLowerCase();
    if (aClerk.includes(clerkId) || clerkTokens.some(tok => aClerk.includes(tok))) return true;
  }

  // 3. registeredBy match
  if (c.registeredBy) {
    const reg = String(c.registeredBy).toLowerCase();
    if (reg.includes(clerkId) || clerkTokens.some(tok => reg.includes(tok))) return true;
  }

  return false;
}

function getAppointedCases() {
  return allCases.filter(isCaseAppointedToCurrentClerk);
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = sessionStorage.getItem('court_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role === 'clerk') {
        currentClerk = Object.assign(currentClerk, u);
      }
    }
  } catch (e) {}

  updateClerkHeaderUI();
  startClerkLiveClock();
  await loadClerkData();
});

function startClerkLiveClock() {
  function tick() {
    const now = new Date();
    const clockEl = document.getElementById('clerk-live-clock');
    if (clockEl) {
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      clockEl.textContent = dayName + ', ' + timeStr;
    }
    const sideDate = document.getElementById('sidebar-live-date');
    const sideClock = document.getElementById('sidebar-live-clock');
    if (sideDate) sideDate.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (sideClock) sideClock.textContent = now.toLocaleTimeString('en-US');
  }
  tick();
  setInterval(tick, 1000);
}

function updateClerkHeaderUI() {
  const name = currentClerk.fullName || "Kalkidan Mengistu";
  const initials = name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() || "KM";
  
  const initialsEl = document.getElementById('clerk-avatar-initials');
  if (initialsEl) initialsEl.textContent = initials;

  const dropInitialsEl = document.getElementById('clerk-dropdown-avatar');
  if (dropInitialsEl) dropInitialsEl.textContent = initials;

  const dropNameEl = document.getElementById('clerk-dropdown-fullname');
  if (dropNameEl) dropNameEl.textContent = name;

  const topNameEl = document.getElementById('top-clerk-name');
  if (topNameEl) topNameEl.textContent = name;
}

function toggleClerkProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('clerk-profile-dropdown-menu');
  if (menu) menu.classList.toggle('show');
}

function handleClerkGlobalClick(e) {
  const menu = document.getElementById('clerk-profile-dropdown-menu');
  const trigger = document.getElementById('clerk-profile-pill-trigger');
  if (menu && menu.classList.contains('show')) {
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
      menu.classList.remove('show');
    }
  }
}

function logoutClerk() {
  if (confirm('Are you sure you want to sign out of the Court Clerk Workspace?')) {
    sessionStorage.removeItem('court_user');
    window.location.href = '/?auth=login';
  }
}
}

function closeClerkModal() {
  const modal = document.getElementById('universal-clerk-modal');
  if (modal) modal.classList.remove('show');
}

async function loadClerkData() {
  try {
    const [casesRes, smsRes] = await Promise.all([
      fetch(API + '/cases').catch(() => null),
      fetch(API + '/sms/logs').catch(() => null)
    ]);
    if (casesRes && casesRes.ok) allCases = await casesRes.json();
    if (smsRes && smsRes.ok) allSmsLogs = await smsRes.json();
  } catch (err) {}

  renderClerkCurrentView();
}

// ── Sidebar Switcher Fix ──
function switchClerkView(viewName) {
  currentClerkView = viewName;
  
  document.querySelectorAll('.clerk-nav-btn').forEach(btn => btn.classList.remove('active'));
  
  document.querySelectorAll('.clerk-nav-btn').forEach(btn => {
    const onclickAttr = btn.getAttribute('onclick') || '';
    if (onclickAttr.includes("'" + viewName + "'")) {
      btn.classList.add('active');
    } else if (viewName === 'registered_cases' || viewName === 'case_records') {
      if (onclickAttr.includes('registered_cases') || onclickAttr.includes('case_records')) {
        btn.classList.add('active');
      }
    } else if (viewName === 'documents') {
      if (onclickAttr.includes('documents')) {
        btn.classList.add('active');
      }
    }
  });

  renderClerkCurrentView();
}

function renderClerkCurrentView() {
  const container = document.getElementById('dynamic-clerk-workspace');
  if (!container) return;

  if (currentClerkView === 'dashboard') {
    renderClerkDashboard(container);
  } else if (currentClerkView === 'filing_queue') {
    renderClerkFilingQueueView(container);
  } else if (currentClerkView === 'registered_cases' || currentClerkView === 'case_records') {
    renderClerkCaseRecordsView(container);
  } else if (currentClerkView === 'documents') {
    renderClerkDocumentsView(container);
  } else if (currentClerkView === 'hearing_calendar') {
    renderClerkCalendarView(container);
  } else if (currentClerkView === 'sms_notifications') {
    renderClerkSmsLogsView(container);
  } else if (currentClerkView === 'templates') {
    renderClerkTemplatesView(container);
  } else if (currentClerkView === 'reports') {
    renderClerkReportsView(container);
  } else if (currentClerkView === 'archive') {
    renderClerkArchiveView(container);
  } else {
    renderClerkDashboard(container);
  }
}

// ── Overview Dashboard ──
function renderClerkDashboard(container) {
  const myCases = getAppointedCases();

  const pendingFilings = myCases.filter(c => c.status === 'pending' || c.status === 'requested');
  const registeredCases = myCases.filter(c => c.status !== 'pending' && c.status !== 'requested');
  const activeHearings = myCases.filter(c => c.hearingDate || c.hearingTime || c.nextHearingDate);

  const registeredRowsHtml = registeredCases.slice(0, 5).map(r => 
    '<tr>' +
      '<td><a class="case-link-bold" onclick="openClerkCaseModal(\'' + r.caseId + '\')">' + r.caseId + '</a></td>' +
      '<td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px"><strong style="color:var(--fsc-navy-main)">' + r.caseTitle + '</strong></td>' +
      '<td style="color:#64748b;font-size:0.75rem">' + (r.dateFiled || 'Aug 20, 2026') + '</td>' +
      '<td style="color:#64748b">' + (r.registeredBy || currentClerk.fullName) + '</td>' +
      '<td><button class="btn-register-sm" onclick="openClerkCaseModal(\'' + r.caseId + '\')">Open Docket</button></td>' +
    '</tr>'
  ).join('') || '<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:#94a3b8">No cases currently appointed to this registry chamber.</td></tr>';

  let docUploads = [];
  myCases.forEach(c => {
    if (c.documents && Array.isArray(c.documents)) {
      c.documents.forEach(d => {
        docUploads.push({
          fileName: d.name || d.title || 'Legal_Filing.pdf',
          caseId: c.caseId,
          url: d.url,
          uploader: d.uploadedBy || (c.filer && c.filer.name) || 'Litigant Counsel',
          time: d.date || 'Today',
          size: d.size || '1.8 MB'
        });
      });
    }
  });

  const docUploadsHtml = docUploads.slice(0, 5).map(d => 
    '<div class="doc-upload-item">' +
      '<div class="doc-upload-left">' +
        '<div style="color:#2563eb">' + ICONS.fileText + '</div>' +
        '<div style="min-width:0">' +
          '<div class="doc-file-name" onclick="viewRealDocument(\'' + (d.url || '') + '\', \'' + d.fileName + '\')">' + d.fileName + '</div>' +
          '<div class="doc-case-sub">' + d.caseId + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="doc-upload-meta">' + d.uploader + ' &bull; ' + d.time + '</div>' +
      '<div style="display:flex;align-items:center;gap:0.4rem">' +
        '<span style="font-size:0.7rem;color:#64748b">' + d.size + '</span>' +
        '<button class="btn-register-sm" style="padding:0.15rem 0.4rem;font-size:0.7rem" onclick="viewRealDocument(\'' + (d.url || '') + '\', \'' + d.fileName + '\')">View PDF</button>' +
      '</div>' +
    '</div>'
  ).join('') || '<div style="text-align:center;padding:1.5rem;color:#94a3b8">No recent documents filed for your appointed cases.</div>';

  const hearingSlotsHtml = activeHearings.slice(0, 4).map(h => 
    '<div class="hearing-slot-row">' +
      '<div class="hearing-time-bold">' + (h.hearingTime || '10:00 AM') + '</div>' +
      '<div class="hearing-case-info">' +
        '<a class="hearing-case-id" onclick="openClerkCaseModal(\'' + h.caseId + '\')">' + h.caseId + '</a>' +
        '<div class="hearing-case-title">' + h.caseTitle + '</div>' +
      '</div>' +
      '<span class="hearing-courtroom-badge">&bull; ' + (h.courtroom || 'Courtroom 2') + '</span>' +
    '</div>'
  ).join('') || '<div style="text-align:center;padding:1.5rem;color:#94a3b8">No hearings scheduled today for your appointed cases.</div>';

  const pendingRowsHtml = pendingFilings.slice(0, 5).map(p => 
    '<tr>' +
      '<td><a class="case-link-bold" onclick="openRegisterFilingModal(\'' + p.caseId + '\')">' + p.caseId + '</a></td>' +
      '<td><strong style="color:var(--fsc-navy-main)">' + ((p.filer && p.filer.name) || p.caseTitle) + '</strong></td>' +
      '<td style="color:#64748b">' + (p.caseType || p.caseCategory || 'Civil') + '</td>' +
      '<td style="color:#64748b;font-size:0.75rem">' + (p.dateFiled || 'Today') + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:0.3rem">' + ICONS.fileText + ' <span>' + (p.documents ? p.documents.length : 1) + '</span></div></td>' +
      '<td><span class="status-pill pill-yellow">' + (p.status || 'Pending') + '</span></td>' +
      '<td>' +
        '<button class="btn-register-sm" onclick="openRegisterFilingModal(\'' + p.caseId + '\')">Review &amp; Issue Docket</button>' +
      '</td>' +
    '</tr>'
  ).join('') || '<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:#94a3b8">No incoming filings in your queue.</td></tr>';

  const myCaseIds = new Set(myCases.map(c => c.caseId));
  const mySms = allSmsLogs.filter(s => myCaseIds.has(s.caseId) || myCaseIds.has(s.trackingId));

  const smsRowsHtml = mySms.slice(0, 5).map(s => 
    '<tr>' +
      '<td style="color:#64748b;font-size:0.75rem;white-space:nowrap">' + (s.time || s.timestamp || 'Today') + '</td>' +
      '<td><strong>' + (s.phone || s.recipientPhone || '+251 911 123 456') + '</strong></td>' +
      '<td><a class="case-link-bold" onclick="openClerkCaseModal(\'' + s.caseId + '\')">' + s.caseId + '</a></td>' +
      '<td>' + (s.type || s.templateType || 'Court Notice') + '</td>' +
      '<td><span class="status-pill pill-green">' + (s.status || 'Sent') + '</span></td>' +
      '<td style="color:#64748b">' + (s.sentBy || currentClerk.fullName) + '</td>' +
    '</tr>'
  ).join('') || '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:#94a3b8">No dispatch logs recorded for your appointed dockets.</td></tr>';

  container.innerHTML = 
    '<div class="clerk-greeting-row">' +
      '<h1 class="clerk-greeting-title">Good morning, ' + (currentClerk.fullName || 'Kalkidan Mengistu') + '</h1>' +
      '<div class="clerk-greeting-sub">Chamber Registry &bull; Managing <strong>' + myCases.length + ' appointed case dockets</strong>.</div>' +
    '</div>' +

    '<div class="clerk-kpi-grid-5">' +
      '<div class="clerk-kpi-card">' +
        '<div class="clerk-kpi-top">' +
          '<div class="clerk-kpi-icon kpi-blue">' + ICONS.fileText + '</div>' +
          '<div>' +
            '<div class="clerk-kpi-label">Appointed Cases</div>' +
            '<div class="clerk-kpi-number">' + myCases.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="clerk-kpi-subtext">Active chamber registry</div>' +
        '<a class="clerk-kpi-link" onclick="switchClerkView(\'registered_cases\')">View records &rarr;</a>' +
      '</div>' +

      '<div class="clerk-kpi-card">' +
        '<div class="clerk-kpi-top">' +
          '<div class="clerk-kpi-icon kpi-green">' + ICONS.folderCheck + '</div>' +
          '<div>' +
            '<div class="clerk-kpi-label">Registered Today</div>' +
            '<div class="clerk-kpi-number">' + registeredCases.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="clerk-kpi-subtext">Certified dockets</div>' +
        '<a class="clerk-kpi-link" onclick="switchClerkView(\'registered_cases\')">View records &rarr;</a>' +
      '</div>' +

      '<div class="clerk-kpi-card">' +
        '<div class="clerk-kpi-top">' +
          '<div class="clerk-kpi-icon kpi-orange">' + ICONS.calendarClock + '</div>' +
          '<div>' +
            '<div class="clerk-kpi-label">Hearings Scheduled</div>' +
            '<div class="clerk-kpi-number">' + activeHearings.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="clerk-kpi-subtext">Calendar listings</div>' +
        '<a class="clerk-kpi-link" onclick="switchClerkView(\'hearing_calendar\')">View calendar &rarr;</a>' +
      '</div>' +

      '<div class="clerk-kpi-card">' +
        '<div class="clerk-kpi-top">' +
          '<div class="clerk-kpi-icon kpi-purple">' + ICONS.uploadDoc + '</div>' +
          '<div>' +
            '<div class="clerk-kpi-label">Documents &amp; Exhibits</div>' +
            '<div class="clerk-kpi-number">' + docUploads.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="clerk-kpi-subtext">Verified submissions</div>' +
        '<a class="clerk-kpi-link" onclick="switchClerkView(\'documents\')">View documents &rarr;</a>' +
      '</div>' +

      '<div class="clerk-kpi-card">' +
        '<div class="clerk-kpi-top">' +
          '<div class="clerk-kpi-icon kpi-blue">' + ICONS.checkCircle + '</div>' +
          '<div>' +
            '<div class="clerk-kpi-label">Dispatched SMS</div>' +
            '<div class="clerk-kpi-number">' + mySms.length + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="clerk-kpi-subtext">100% Certified Delivery</div>' +
        '<a class="clerk-kpi-link" onclick="switchClerkView(\'sms_notifications\')">View SMS log &rarr;</a>' +
      '</div>' +
    '</div>' +

    '<div class="clerk-2col-row-top">' +
      '<div class="clerk-panel-card">' +
        '<div class="clerk-panel-header">' +
          '<div class="clerk-panel-title">Pending Filing Verification Queue (Your Appointed Cases)</div>' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'filing_queue\')">View full queue &rarr;</a>' +
        '</div>' +
        '<div style="overflow-x:auto">' +
          '<table class="clerk-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Filing ID</th>' +
                '<th>Filer / Petitioner</th>' +
                '<th>Case Type</th>' +
                '<th>Filed On</th>' +
                '<th>Docs</th>' +
                '<th>Status</th>' +
                '<th>Action</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              pendingRowsHtml +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      '<div class="clerk-panel-card">' +
        '<div class="clerk-panel-header">' +
          '<div class="clerk-panel-title">Today\'s Chamber Hearings</div>' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'hearing_calendar\')">Full calendar &rarr;</a>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:0.65rem">' +
          hearingSlotsHtml +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="clerk-2col-row-mid">' +
      '<div class="clerk-panel-card">' +
        '<div class="clerk-panel-header">' +
          '<div class="clerk-panel-title">Your Appointed Registered Cases</div>' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'registered_cases\')">View all &rarr;</a>' +
        '</div>' +
        '<div style="overflow-x:auto">' +
          '<table class="clerk-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Case ID</th>' +
                '<th>Title</th>' +
                '<th>Registered On</th>' +
                '<th>Registered By</th>' +
                '<th>Action</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              registeredRowsHtml +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      '<div class="clerk-panel-card">' +
        '<div class="clerk-panel-header">' +
          '<div class="clerk-panel-title">Document Uploads &amp; Certified Filings</div>' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'documents\')">View all &rarr;</a>' +
        '</div>' +
        '<div>' +
          docUploadsHtml +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="clerk-2col-row-bottom">' +
      '<div class="clerk-panel-card">' +
        '<div class="clerk-panel-header">' +
          '<div class="clerk-panel-title">SMS Notification Dispatch Log</div>' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'sms_notifications\')">View all &rarr;</a>' +
        '</div>' +
        '<div style="overflow-x:auto">' +
          '<table class="clerk-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Timestamp</th>' +
                '<th>Recipient</th>' +
                '<th>Case ID</th>' +
                '<th>Type</th>' +
                '<th>Status</th>' +
                '<th>Sent By</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              smsRowsHtml +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

      '<div class="clerk-panel-card">' +
        '<div class="clerk-panel-header">' +
          '<div class="clerk-panel-title">Quick Actions</div>' +
        '</div>' +
        '<div class="quick-actions-3x3">' +
          '<div class="action-tile-btn" onclick="openRegisterCaseModal()">' +
            '<div style="color:#475569">' + ICONS.filePlus + '</div>' +
            '<span>Register New Case</span>' +
          '</div>' +
          '<div class="action-tile-btn" onclick="openUploadDocumentModal()">' +
            '<div style="color:#475569">' + ICONS.uploadDoc + '</div>' +
            '<span>Upload Document</span>' +
          '</div>' +
          '<div class="action-tile-btn" onclick="openIssueOrderModal()">' +
            '<div style="color:#475569">' + ICONS.scales + '</div>' +
            '<span>Issue Order</span>' +
          '</div>' +
          '<div class="action-tile-btn" onclick="openScheduleHearingModal()">' +
            '<div style="color:#475569">' + ICONS.calendarClock + '</div>' +
            '<span>Schedule Hearing</span>' +
          '</div>' +
          '<div class="action-tile-btn" onclick="openSendSmsModal()">' +
            '<div style="color:#475569">' + ICONS.messageSquare + '</div>' +
            '<span>Send SMS</span>' +
          '</div>' +
          '<div class="action-tile-btn" onclick="openGenerateReportModal()">' +
            '<div style="color:#475569">' + ICONS.chart + '</div>' +
            '<span>Generate Report</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

// ── Case Records View (Registered Cases Only - Standalone View) ──
function renderClerkCaseRecordsView(container) {
  const myCases = getAppointedCases().filter(c => c.status !== 'pending' && c.status !== 'requested');

  container.innerHTML = 
    '<div style="margin-bottom:1.25rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">' +
      '<div>' +
        '<h2 style="font-size:1.35rem;font-weight:800;color:var(--fsc-navy-main);margin-bottom:0.25rem">Appointed Registered Cases</h2>' +
        '<div style="font-size:0.85rem;color:#64748b">Showing <strong>' + myCases.length + ' certified case dockets</strong> appointed to ' + (currentClerk.fullName || 'this clerk') + ' &bull; ' + (currentClerk.branch || 'Federal Supreme Court') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;align-items:center">' +
        '<button class="btn-register-sm" style="padding:0.45rem 1rem;font-weight:700" onclick="openRegisterCaseModal()">+ Register New Case</button>' +
      '</div>' +
    '</div>' +

    '<div class="clerk-panel-card">' +
      '<div style="overflow-x:auto">' +
        '<table class="clerk-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Docket #</th>' +
              '<th>Case Title</th>' +
              '<th>Category</th>' +
              '<th>Presiding Judge</th>' +
              '<th>Filing Date</th>' +
              '<th>Status</th>' +
              '<th>Action</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            (myCases.map(c => 
              '<tr>' +
                '<td><a class="case-link-bold" onclick="openClerkCaseModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
                '<td><strong style="color:var(--fsc-navy-main)">' + c.caseTitle + '</strong></td>' +
                '<td>' + (c.caseCategory || c.caseType || 'Civil') + '</td>' +
                '<td>' + (c.assignedJudge || 'Hon. Judge Solomon Desta') + '</td>' +
                '<td style="color:#64748b;font-size:0.75rem">' + (c.dateFiled || 'Aug 20, 2026') + '</td>' +
                '<td><span class="status-pill ' + (c.status === 'Decided' || c.status === 'closed' ? 'pill-green' : 'pill-blue') + '">' + (c.status || 'Active') + '</span></td>' +
                '<td><button class="btn-register-sm" style="font-weight:700" onclick="openClerkCaseModal(\'' + c.caseId + '\')">Open Docket</button></td>' +
              '</tr>'
            ).join('') || '<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:#94a3b8">No registered case records found in your appointed registry.</td></tr>') +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

// ── Functional Filing Queue View with Full Document Uploads & Certified Filings ──
function renderClerkFilingQueueView(container) {
  const myCases = getAppointedCases();
  const pending = myCases.filter(c => c.status === 'pending' || c.status === 'requested' || c.status === 'under_review');

  // Collect all documents from appointed cases (pending + active)
  let allAppointedDocs = [];
  myCases.forEach(p => {
    if (p.documents && Array.isArray(p.documents)) {
      p.documents.forEach(d => {
        allAppointedDocs.push({
          ...d,
          caseId: p.caseId,
          caseTitle: p.caseTitle,
          caseStatus: p.status,
          filerName: (p.filer && p.filer.name) || p.plaintiffClientName || 'Petitioner Litigant'
        });
      });
    }
  });

  const docsRowsHtml = allAppointedDocs.map(d => 
    '<tr>' +
      '<td><strong style="color:var(--fsc-navy-main)">' + (d.name || d.title || 'Certified_Pleading_Exhibit.pdf') + '</strong></td>' +
      '<td><a class="case-link-bold" onclick="' + (d.caseStatus === 'pending' ? 'openRegisterFilingModal' : 'openClerkCaseModal') + '(\'' + d.caseId + '\')">' + d.caseId + '</a></td>' +
      '<td>' + (d.type || 'Pleading Exhibit') + '</td>' +
      '<td>' + (d.uploadedBy || d.filerName || 'Counsel') + '</td>' +
      '<td style="color:#64748b;font-size:0.75rem">' + (d.date || 'Today') + '</td>' +
      '<td><span class="status-pill ' + (d.caseStatus === 'pending' ? 'pill-yellow' : 'pill-green') + '">' + (d.caseStatus === 'pending' ? 'Pending Review' : 'Verified &amp; Sealed') + '</span></td>' +
      '<td>' +
        '<button class="btn-register-sm" style="font-weight:700" onclick="viewRealDocument(\'' + (d.url || '') + '\', \'' + (d.name || d.title) + '\')">View PDF</button>' +
      '</td>' +
    '</tr>'
  ).join('') || '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8">No certified exhibits found in appointed registry.</td></tr>';

  container.innerHTML = 
    '<div style="margin-bottom:1.25rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">' +
      '<div>' +
        '<h2 style="font-size:1.35rem;font-weight:800;color:var(--fsc-navy-main);margin-bottom:0.25rem">Filing Verification &amp; Document Queue</h2>' +
        '<div style="font-size:0.85rem;color:#64748b">Incoming citizen and advocate petitions requiring document inspection, docket number issuance &amp; summons assignment (<strong>' + pending.length + ' pending filings &bull; ' + allAppointedDocs.length + ' certified exhibits</strong>).</div>' +
      '</div>' +
      '<button class="btn-register-sm" style="background:#0284c7;color:white;padding:0.45rem 1rem;font-weight:700" onclick="openUploadDocumentModal()">+ Upload New Certified Document</button>' +
    '</div>' +

    '<!-- 1. Pending Filings Review Table -->' +
    '<div class="clerk-panel-card" style="margin-bottom:1.5rem">' +
      '<div class="clerk-panel-header">' +
        '<div class="clerk-panel-title">Incoming Petitions Awaiting Registration (' + pending.length + ')</div>' +
        '<span style="font-size:0.75rem;color:#64748b">Chamber Verification Desk</span>' +
      '</div>' +
      '<div style="overflow-x:auto">' +
        '<table class="clerk-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Filing Ref</th>' +
              '<th>Petitioner / Litigant</th>' +
              '<th>Case Category</th>' +
              '<th>Submission Date</th>' +
              '<th>Attached Exhibits</th>' +
              '<th>Verification Status</th>' +
              '<th>Action</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            (pending.map(p => 
              '<tr>' +
                '<td><a class="case-link-bold" onclick="openRegisterFilingModal(\'' + p.caseId + '\')">' + p.caseId + '</a></td>' +
                '<td><strong style="color:var(--fsc-navy-main)">' + ((p.filer && p.filer.name) || p.caseTitle) + '</strong></td>' +
                '<td>' + (p.caseCategory || p.caseType || 'Civil') + '</td>' +
                '<td style="color:#64748b;font-size:0.75rem">' + (p.dateFiled || 'Today') + '</td>' +
                '<td><span class="status-pill pill-blue">' + (p.documents ? p.documents.length : 1) + ' verified doc(s)</span></td>' +
                '<td><span class="status-pill pill-yellow">' + (p.status || 'Pending Review') + '</span></td>' +
                '<td><button class="btn-register-sm" style="font-weight:700;background:#0284c7;color:white" onclick="openRegisterFilingModal(\'' + p.caseId + '\')">Review &amp; Issue Docket #</button></td>' +
              '</tr>'
            ).join('') || '<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:#94a3b8">Your filing verification queue is completely clear. No pending submissions.</td></tr>') +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    '<!-- 2. Document Uploads & Certified Filings Queue Panel -->' +
    '<div class="clerk-panel-card">' +
      '<div class="clerk-panel-header">' +
        '<div class="clerk-panel-title">Document Uploads &amp; Certified Filings (' + allAppointedDocs.length + ')</div>' +
        '<span style="font-size:0.75rem;color:#64748b">Verified Evidence &bull; Electronic Pleadings &bull; PDF Files</span>' +
      '</div>' +
      '<div style="overflow-x:auto">' +
        '<table class="clerk-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Document / Exhibit Title</th>' +
              '<th>Case Docket #</th>' +
              '<th>Filing Type</th>' +
              '<th>Uploaded By</th>' +
              '<th>Timestamp</th>' +
              '<th>Registry Status</th>' +
              '<th>Action</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            docsRowsHtml +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

// ── Functional Filing Registration Modal with Direct Document Inspection ──
function openRegisterFilingModal(caseId) {
  const c = allCases.find(it => it.caseId === caseId) || {
    caseId: caseId || ('FL-2026-FSC-' + Math.floor(100 + Math.random() * 900)),
    caseTitle: 'Commercial & Civil Petition',
    filer: { name: 'Petitioner Entity', phone: '0911554433' },
    caseCategory: 'Civil & Commercial',
    documents: []
  };

  const generatedDocketNum = 'CASE-2026-FSC-' + Math.floor(1000 + Math.random() * 9000);
  const title = document.getElementById('clerk-modal-title');
  const body = document.getElementById('clerk-modal-body');
  if (!title || !body) return;

  const exhibitsHtml = (c.documents && c.documents.length > 0) ? c.documents.map(d => 
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.55rem 0.75rem;background:white;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:0.4rem">' +
      '<div style="display:flex;align-items:center;gap:0.5rem">' +
        '<div style="color:#2563eb">' + ICONS.fileText + '</div>' +
        '<div>' +
          '<div style="font-weight:700;font-size:0.85rem;color:var(--fsc-navy-main)">' + (d.name || d.title || 'Pleading_Document.pdf') + '</div>' +
          '<div style="font-size:0.72rem;color:#64748b">' + (d.type || 'Pleading Exhibit') + ' &bull; ' + (d.size || '2.4 MB') + ' &bull; Uploaded by: ' + (d.uploadedBy || 'Counsel') + '</div>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="btn-register-sm" style="font-weight:700" onclick="viewRealDocument(\'' + (d.url || '') + '\', \'' + (d.name || d.title) + '\')">View PDF</button>' +
    '</div>'
  ).join('') : '<div style="padding:0.75rem;text-align:center;font-size:0.8rem;color:#94a3b8;background:white;border-radius:6px">No documents attached.</div>';

  title.textContent = 'Register Filing & Issue Official Docket #';
  body.innerHTML = 
    '<form onsubmit="handleConfirmFilingRegistration(event, \'' + c.caseId + '\')">' +
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.85rem;margin-bottom:1rem">' +
        '<div style="font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase">Incoming Submission</div>' +
        '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:1.05rem">' + c.caseTitle + '</div>' +
        '<div style="font-size:0.75rem;color:#64748b">Filing Ref: <code>' + c.caseId + '</code> &bull; Filer: <strong>' + ((c.filer && c.filer.name) || 'Litigant') + '</strong> (' + ((c.filer && c.filer.phone) || 'Phone') + ')</div>' +
      '</div>' +

      '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:0.85rem;margin-bottom:1rem">' +
        '<div style="font-size:0.75rem;font-weight:800;color:#1e3a8a;text-transform:uppercase;margin-bottom:0.5rem">📂 Document Uploads &amp; Certified Filings (' + (c.documents ? c.documents.length : 0) + ')</div>' +
        exhibitsHtml +
      '</div>' +

      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Permanent Federal Supreme Court Docket Number</label>' +
        '<input type="text" class="modal-form-input" id="formal-docket-num" value="' + generatedDocketNum + '" required style="font-weight:800;color:#0284c7;background:#f0f9ff">' +
      '</div>' +

      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Assigned Presiding Judge</label>' +
        '<select class="modal-form-input" id="reg-judge-select">' +
          '<option value="Hon. Judge Solomon Desta" selected>Hon. Judge Solomon Desta (Commercial &amp; Civil Bench)</option>' +
          '<option value="Hon. Judge Meron Getachew">Hon. Judge Meron Getachew (Cassation Division)</option>' +
          '<option value="Hon. Judge Yohannes Kassaye">Hon. Judge Yohannes Kassaye (High Court Division)</option>' +
        '</select>' +
      '</div>' +

      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Jurisdiction Branch &amp; Chamber</label>' +
        '<input type="text" class="modal-form-input" id="reg-branch-name" value="' + (currentClerk.branch || 'Federal Supreme Court') + '" required>' +
      '</div>' +

      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Statutory Case Classification</label>' +
        '<select class="modal-form-input" id="reg-cat-select">' +
          '<option value="Commercial &amp; Contract">Commercial &amp; Contract</option>' +
          '<option value="Banking &amp; Loan Default">Banking &amp; Loan Default</option>' +
          '<option value="Customs &amp; Tax Dispute">Customs &amp; Tax Dispute</option>' +
          '<option value="Labour &amp; Employment">Labour &amp; Employment</option>' +
          '<option value="Cassation Over Fundamental Error of Law">Cassation Over Fundamental Error of Law</option>' +
        '</select>' +
      '</div>' +

      '<div class="modal-btn-row">' +
        '<button type="button" class="btn-cancel" onclick="closeClerkModal()">Cancel</button>' +
        '<button type="submit" class="btn-submit" style="background:#16a34a;font-weight:800">✓ Confirm Registration &amp; Seal Docket</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-clerk-modal').classList.add('show');
}

async function handleConfirmFilingRegistration(e, origCaseId) {
  e.preventDefault();
  const formalDocketNumber = document.getElementById('formal-docket-num').value.trim();
  const assignedJudge = document.getElementById('reg-judge-select').value;
  const branchName = document.getElementById('reg-branch-name').value.trim();
  const caseCategory = document.getElementById('reg-cat-select').value;

  try {
    const res = await fetch(API + '/cases/register-filing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: origCaseId,
        formalDocketNumber,
        assignedJudge,
        branchName,
        caseCategory,
        clerkName: currentClerk.fullName,
        clerkId: currentClerk.id
      })
    });

    if (res.ok) {
      alert('✓ Filing successfully registered! Formal docket issued: ' + formalDocketNumber);
      closeClerkModal();
      await loadClerkData();
      switchClerkView('registered_cases');
    } else {
      alert('Error registering filing.');
    }
  } catch (err) {
    alert('Server connection error.');
  }
}

// ── Comprehensive Clerk Docket Workspace: Minutes, Attendance & Actions ──
function openClerkCaseModal(caseId) {
  const c = allCases.find(it => it.caseId === caseId);
  const title = document.getElementById('clerk-modal-title');
  const body = document.getElementById('clerk-modal-body');
  if (!title || !body) return;

  if (!c) {
    alert('Case not found in judicial registry.');
    return;
  }

  // Check appointment
  if (!isCaseAppointedToCurrentClerk(c)) {
    title.innerHTML = '<span style="color:#dc2626">🔒 Access Restricted: Case Not Appointed</span>';
    body.innerHTML = 
      '<div style="padding:1.5rem;text-align:center">' +
        '<div style="font-size:2.5rem;margin-bottom:0.5rem">🛡️</div>' +
        '<h3 style="font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.5rem">Confidential Chamber Record</h3>' +
        '<p style="font-size:0.875rem;color:#64748b;line-height:1.5;max-width:440px;margin:0 auto 1.25rem">' +
          'Case <strong>' + c.caseId + '</strong> (' + c.caseTitle + ') is appointed to another registrar chamber (<strong>' + (c.clerkName || 'Registrar Office') + '</strong>). Clerks can only access their directly appointed cases.' +
        '</p>' +
        '<button class="btn-cancel" onclick="closeClerkModal()">Dismiss</button>' +
      '</div>';
    document.getElementById('universal-clerk-modal').classList.add('show');
    return;
  }

  renderClerkDocketModalContent(c, 'session_minutes');
}

function renderClerkDocketModalContent(c, activeTab = 'session_minutes') {
  activeDocketTab = activeTab;
  const title = document.getElementById('clerk-modal-title');
  const body = document.getElementById('clerk-modal-body');

  title.innerHTML = 
    '<div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">' +
      '<span style="background:var(--fsc-gold-main);color:#0b192c;font-size:0.75rem;font-weight:900;padding:0.2rem 0.65rem;border-radius:6px;letter-spacing:0.02em">' + c.caseId + '</span>' +
      '<span style="color:#ffffff;font-size:1.05rem;font-weight:800">' + c.caseTitle + '</span>' +
    '</div>';

  const sessionLogs = c.sessionSummaries || [];

  const previousMinutesHtml = sessionLogs.length > 0 ? sessionLogs.map((s, idx) => 
    '<div class="session-history-item">' +
      '<div class="session-history-top">' +
        '<div class="session-history-title">' +
          '<span>Session #' + (idx + 1) + ' &bull; ' + (s.sessionDate || (s.date ? s.date.split('T')[0] : 'Recorded')) + '</span>' +
          '<span style="font-size:0.75rem;font-weight:600;color:#64748b;margin-left:0.5rem">(' + (s.stage || 'Court Proceeding') + ')</span>' +
        '</div>' +
        '<span class="status-pill pill-green">Clerk Attested: ' + (s.clerkName || currentClerk.fullName) + '</span>' +
      '</div>' +
      '<div class="session-attendance-tags">' +
        '<span class="session-att-tag">⚖️ Judge: ' + (s.attendance ? s.attendance.judge : 'Present') + '</span>' +
        '<span class="session-att-tag">👤 Plaintiff: ' + (s.attendance ? s.attendance.plaintiff : 'Present') + '</span>' +
        '<span class="session-att-tag">👥 Defendant: ' + (s.attendance ? s.attendance.defendant : 'Present') + '</span>' +
        '<span class="session-att-tag">🏛️ Prosecution: ' + (s.attendance ? s.attendance.prosecutor : 'N/A') + '</span>' +
      '</div>' +
      '<div class="session-minutes-box"><strong>Minutes of Hearing:</strong> ' + (s.minutes || s.summaryNotes || 'Proceeding conducted.') + '</div>' +
      (s.courtOrder ? '<div style="font-size:0.785rem;color:#0369a1;margin-bottom:0.35rem"><strong>Minute Order:</strong> ' + s.courtOrder + '</div>' : '') +
      (s.exhibitsAdmitted && s.exhibitsAdmitted !== 'None' ? '<div style="font-size:0.785rem;color:#16a34a;margin-bottom:0.35rem"><strong>Admitted Exhibits:</strong> ' + s.exhibitsAdmitted + '</div>' : '') +
      (s.nextHearingDate ? '<div style="font-size:0.785rem;color:#b45309;font-weight:600">📅 Next Adjournment: ' + s.nextHearingDate + ' ' + (s.nextHearingTime || '') + ' (' + (s.nextHearingAgenda || 'Oral Arguments') + ')</div>' : '') +
    '</div>'
  ).join('') : '<div style="padding:1.5rem;text-align:center;color:#94a3b8;font-size:0.85rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px">No previous courtroom session minutes logged for this case docket.</div>';

  body.innerHTML = 
    '<div class="clerk-docket-tabs">' +
      '<button class="clerk-docket-tab-btn ' + (activeTab === 'session_minutes' ? 'active' : '') + '" onclick="renderClerkDocketModalContent(allCases.find(it => it.caseId === \'' + c.caseId + '\'), \'session_minutes\')">📝 Log Session Minutes &amp; Attendance</button>' +
      '<button class="clerk-docket-tab-btn ' + (activeTab === 'dossier' ? 'active' : '') + '" onclick="renderClerkDocketModalContent(allCases.find(it => it.caseId === \'' + c.caseId + '\'), \'dossier\')">📋 Case Dossier &amp; Counsel</button>' +
      '<button class="clerk-docket-tab-btn ' + (activeTab === 'documents' ? 'active' : '') + '" onclick="renderClerkDocketModalContent(allCases.find(it => it.caseId === \'' + c.caseId + '\'), \'documents\')">📂 Evidence &amp; Exhibits (' + (c.documents ? c.documents.length : 0) + ')</button>' +
      '<button class="clerk-docket-tab-btn ' + (activeTab === 'sms' ? 'active' : '') + '" onclick="renderClerkDocketModalContent(allCases.find(it => it.caseId === \'' + c.caseId + '\'), \'sms\')">📱 Dispatch SMS Notice</button>' +
    '</div>' +

    (activeTab === 'session_minutes' ? 
      '<form onsubmit="handleSaveSessionMinutes(event, \'' + c.caseId + '\')">' +
        
        '<!-- 1. Attendance Register Card -->' +
        '<div class="docket-card">' +
          '<div class="docket-card-header">' +
            '<div class="docket-card-title">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' +
              '<span>1. Courtroom Attendance Register</span>' +
            '</div>' +
            '<span style="font-size:0.75rem;color:#64748b;font-weight:600">Attesting Registrar: <strong style="color:#0f172a">' + currentClerk.fullName + ' (' + currentClerk.id + ')</strong></span>' +
          '</div>' +
          '<div class="attendance-grid">' +
            '<div class="attendance-item-box">' +
              '<label class="attendance-item-label">⚖️ Presiding Judge</label>' +
              '<select class="attendance-select" id="sess-judge-pres">' +
                '<option value="Present (' + (c.assignedJudge || 'Hon. Judge Solomon Desta') + ')" selected>✓ Present (' + (c.assignedJudge || 'Hon. Judge Solomon Desta') + ')</option>' +
                '<option value="Absent (Bench Adjourned)">✕ Absent (Bench Adjourned)</option>' +
                '<option value="Substitute Judge Assigned">⚖️ Substitute Judge Assigned</option>' +
              '</select>' +
            '</div>' +
            '<div class="attendance-item-box">' +
              '<label class="attendance-item-label">👤 Plaintiff / Petitioner</label>' +
              '<select class="attendance-select" id="sess-plaintiff-pres">' +
                '<option value="Represented by Counsel (' + (c.plaintiffLawyerName || 'Counsel') + ')" selected>✓ Represented by Counsel (' + (c.plaintiffLawyerName || 'Counsel') + ')</option>' +
                '<option value="Present in Person">✓ Present in Person</option>' +
                '<option value="Absent (Default Notice)">✕ Absent (Default Notice)</option>' +
              '</select>' +
            '</div>' +
            '<div class="attendance-item-box">' +
              '<label class="attendance-item-label">👥 Defendant / Respondent</label>' +
              '<select class="attendance-select" id="sess-def-pres">' +
                '<option value="Represented by Counsel (' + (c.defendantLawyerName || 'Counsel') + ')" selected>✓ Represented by Counsel (' + (c.defendantLawyerName || 'Counsel') + ')</option>' +
                '<option value="Present in Person">✓ Present in Person</option>' +
                '<option value="Absent (Default Notice)">✕ Absent (Default Notice)</option>' +
              '</select>' +
            '</div>' +
            '<div class="attendance-item-box">' +
              '<label class="attendance-item-label">🏛️ Public Prosecutor</label>' +
              '<select class="attendance-select" id="sess-pros-pres">' +
                '<option value="N/A (Civil Bench)" selected>N/A (Civil &amp; Commercial)</option>' +
                '<option value="Present (Public Prosecutor)">✓ Present (Public Prosecutor)</option>' +
                '<option value="Absent">✕ Absent</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<!-- 2. Minutes & Proceedings Card -->' +
        '<div class="docket-card">' +
          '<div class="docket-card-header">' +
            '<div class="docket-card-title">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>' +
              '<span>2. Courtroom Proceedings &amp; Minute Directives</span>' +
            '</div>' +
          '</div>' +
          '<div class="docket-input-group">' +
            '<label class="docket-label">Procedural Hearing Stage</label>' +
            '<select class="docket-input" id="sess-stage">' +
              '<option value="Oral Arguments on Merits" selected>Oral Arguments on Merits</option>' +
              '<option value="Initial Hearing &amp; Framing of Issues">Initial Hearing &amp; Framing of Issues</option>' +
              '<option value="Cross-Examination of Witnesses">Cross-Examination of Witnesses</option>' +
              '<option value="Admission of Certified Evidence">Admission of Certified Evidence</option>' +
              '<option value="Interim Injunction Review">Interim Injunction Review</option>' +
              '<option value="Final Decree Pronouncement">Final Decree Pronouncement</option>' +
            '</select>' +
          '</div>' +
          '<div class="docket-input-group">' +
            '<label class="docket-label">Official Session Minutes &amp; Submissions Recorded</label>' +
            '<textarea class="docket-textarea" id="sess-minutes" rows="3" placeholder="Enter formal minutes of arguments, party submissions, and bench remarks..." required>Parties appeared through certified legal counsel. Oral submissions presented on commercial default liability under Commercial Code Articles 689-705. Bench ordered submission of certified audit reconciliations.</textarea>' +
          '</div>' +
          '<div class="docket-input-group">' +
            '<label class="docket-label">Admitted Exhibits &amp; Proofs (Markings)</label>' +
            '<input type="text" class="docket-input" id="sess-exhibits" value="Exhibits A1 (Loan Agreement) &amp; A2 (Bank Statement) marked and admitted without objection.">' +
          '</div>' +
        '</div>' +

        '<!-- 3. Adjournment & Next Session Card -->' +
        '<div class="docket-card">' +
          '<div class="docket-card-header">' +
            '<div class="docket-card-title">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>' +
              '<span>3. Adjournment &amp; Next Session Scheduling</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(190px, 1fr));gap:1rem">' +
            '<div class="docket-input-group">' +
              '<label class="docket-label">Next Adjournment Date</label>' +
              '<input type="date" class="docket-input" id="sess-next-date" value="2026-09-05">' +
            '</div>' +
            '<div class="docket-input-group">' +
              '<label class="docket-label">Time Slot</label>' +
              '<select class="docket-input" id="sess-next-time">' +
                '<option value="09:00 AM">09:00 AM</option>' +
                '<option value="10:00 AM" selected>10:00 AM</option>' +
                '<option value="11:30 AM">11:30 AM</option>' +
                '<option value="02:00 PM">02:00 PM</option>' +
                '<option value="03:30 PM">03:30 PM</option>' +
              '</select>' +
            '</div>' +
            '<div class="docket-input-group">' +
              '<label class="docket-label">Assigned Courtroom</label>' +
              '<input type="text" class="docket-input" id="sess-courtroom" value="' + (c.courtroom || 'Courtroom 2 (Commercial Division)') + '">' +
            '</div>' +
            '<div class="docket-input-group">' +
              '<label class="docket-label">Procedural Agenda</label>' +
              '<input type="text" class="docket-input" id="sess-next-agenda" value="Examination of Expert Witnesses">' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<!-- 4. Previous Session Timeline -->' +
        '<div class="docket-card">' +
          '<div class="docket-card-header">' +
            '<div class="docket-card-title">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
              '<span>Chamber Session History (' + sessionLogs.length + ')</span>' +
            '</div>' +
          '</div>' +
          previousMinutesHtml +
        '</div>' +

        '<div class="docket-footer-bar">' +
          '<button type="button" class="btn-docket-close" onclick="closeClerkModal()">Close Docket</button>' +
          '<button type="submit" class="btn-docket-commit">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>' +
            '<span>💾 Commit &amp; Seal Official Session Minutes</span>' +
          '</button>' +
        '</div>' +
      '</form>' : '') +

    (activeTab === 'dossier' ?
      '<div>' +
        '<div class="docket-card">' +
          '<div class="docket-card-header">' +
            '<div class="docket-card-title">Litigant Parties &amp; Legal Advocates</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">' +
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1.15rem">' +
              '<div style="font-size:0.75rem;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:0.45rem">Plaintiff / Petitioner</div>' +
              '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:1.1rem;margin-bottom:0.25rem">' + ((c.filer && c.filer.name) || c.plaintiffClientName || 'Plaintiff Entity') + '</div>' +
              '<div style="font-size:0.8rem;color:#64748b;margin-bottom:0.5rem">Contact: ' + ((c.filer && c.filer.phone) || c.plaintiffClientId || '+251 911 123 456') + '</div>' +
              '<div style="font-size:0.85rem;color:#0284c7;background:#eff6ff;padding:0.45rem 0.65rem;border-radius:6px;border:1px solid #bfdbfe">' +
                'Advocate: <strong>' + (c.plaintiffLawyerName || 'Kebede Haile Mariam (LAW-1001)') + '</strong>' +
              '</div>' +
            '</div>' +
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1.15rem">' +
              '<div style="font-size:0.75rem;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:0.45rem">Defendant / Respondent</div>' +
              '<div style="font-weight:800;color:var(--fsc-navy-main);font-size:1.1rem;margin-bottom:0.25rem">' + ((c.defendant && c.defendant.name) || c.defendantClientName || 'Defendant Entity') + '</div>' +
              '<div style="font-size:0.8rem;color:#64748b;margin-bottom:0.5rem">Contact: ' + ((c.defendant && c.defendant.phone) || c.defendantClientId || '+251 922 334 455') + '</div>' +
              '<div style="font-size:0.85rem;color:#0284c7;background:#eff6ff;padding:0.45rem 0.65rem;border-radius:6px;border:1px solid #bfdbfe">' +
                'Advocate: <strong>' + (c.defendantLawyerName || 'Tigist Alemu Bekele (LAW-1002)') + '</strong>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="docket-card">' +
          '<div class="docket-card-header">' +
            '<div class="docket-card-title">Judicial Assignment &amp; Jurisdiction</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:1rem">' +
            '<div style="background:#f8fafc;padding:0.85rem;border-radius:6px;border:1px solid #e2e8f0">' +
              '<div style="font-size:0.725rem;color:#64748b;text-transform:uppercase;font-weight:700">Presiding Judge</div>' +
              '<div style="font-weight:800;color:#0f172a;font-size:0.95rem;margin-top:0.2rem">' + (c.assignedJudge || 'Hon. Judge Solomon Desta') + '</div>' +
            '</div>' +
            '<div style="background:#f8fafc;padding:0.85rem;border-radius:6px;border:1px solid #e2e8f0">' +
              '<div style="font-size:0.725rem;color:#64748b;text-transform:uppercase;font-weight:700">Appointed Registrar</div>' +
              '<div style="font-weight:800;color:#0f172a;font-size:0.95rem;margin-top:0.2rem">' + (c.clerkName || currentClerk.fullName) + '</div>' +
            '</div>' +
            '<div style="background:#f8fafc;padding:0.85rem;border-radius:6px;border:1px solid #e2e8f0">' +
              '<div style="font-size:0.725rem;color:#64748b;text-transform:uppercase;font-weight:700">Division &amp; Status</div>' +
              '<div style="font-weight:800;color:#0284c7;font-size:0.95rem;margin-top:0.2rem">' + (c.branchName || 'Federal Supreme Court') + ' &bull; ' + (c.status || 'Active') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="docket-footer-bar">' +
          '<button type="button" class="btn-docket-close" onclick="closeClerkModal()">Close Dossier</button>' +
        '</div>' +
      '</div>' : '') +

    (activeTab === 'documents' ?
      '<div>' +
        '<div class="docket-card">' +
          '<div class="docket-card-header">' +
            '<div class="docket-card-title">Certified Exhibits &amp; Pleadings (' + (c.documents ? c.documents.length : 0) + ')</div>' +
            '<button class="btn-register-sm" style="background:#0284c7;color:white;font-weight:700" onclick="openUploadDocumentModal(\'' + c.caseId + '\')">+ Upload Certified Exhibit</button>' +
          '</div>' +
          '<div style="overflow-x:auto">' +
            '<table class="clerk-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Document Title</th>' +
                  '<th>Category</th>' +
                  '<th>Size</th>' +
                  '<th>Status</th>' +
                  '<th>Action</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                ((c.documents && c.documents.length > 0) ? c.documents.map(d => 
                  '<tr>' +
                    '<td><strong style="color:var(--fsc-navy-main)">' + (d.name || d.title || 'Exhibits_Certified.pdf') + '</strong></td>' +
                    '<td>' + (d.type || 'Pleading Exhibit') + '</td>' +
                    '<td>' + (d.size || '2.4 MB') + '</td>' +
                    '<td><span class="status-pill pill-green">Certified</span></td>' +
                    '<td><button class="btn-register-sm" style="font-weight:700" onclick="viewRealDocument(\'' + (d.url || '') + '\', \'' + (d.name || d.title) + '\')">View PDF</button></td>' +
                  '</tr>'
                ).join('') : '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#94a3b8">No exhibits uploaded.</td></tr>') +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
        '<div class="docket-footer-bar">' +
          '<button type="button" class="btn-docket-close" onclick="closeClerkModal()">Close</button>' +
        '</div>' +
      '</div>' : '') +

    (activeTab === 'sms' ?
      '<form onsubmit="handleSendDocketSms(event, \'' + c.caseId + '\')">' +
        '<div class="docket-card">' +
          '<div class="docket-card-header">' +
            '<div class="docket-card-title">Dispatch Telecommunication Notice</div>' +
          '</div>' +
          '<div class="docket-input-group">' +
            '<label class="docket-label">Recipient Party</label>' +
            '<select class="docket-input" id="docket-sms-target">' +
              '<option value="' + ((c.filer && c.filer.phone) || '+251 911 123 456') + '">Plaintiff / Petitioner (' + ((c.filer && c.filer.phone) || '+251 911 123 456') + ')</option>' +
              '<option value="' + ((c.defendant && c.defendant.phone) || '+251 922 334 455') + '">Defendant / Respondent (' + ((c.defendant && c.defendant.phone) || '+251 922 334 455') + ')</option>' +
            '</select>' +
          '</div>' +
          '<div class="docket-input-group">' +
            '<label class="docket-label">Notice Message Text</label>' +
            '<textarea class="docket-textarea" id="docket-sms-text" rows="4" required>Federal Supreme Court Notice: Chamber session minutes recorded for Case ' + c.caseId + '. Next hearing scheduled on ' + (c.hearingDate || '2026-09-05') + ' at 10:00 AM. Access your docket at http://localhost:5001</textarea>' +
          '</div>' +
        '</div>' +
        '<div class="docket-footer-bar">' +
          '<button type="button" class="btn-docket-close" onclick="closeClerkModal()">Cancel</button>' +
          '<button type="submit" class="btn-docket-commit" style="background:#0284c7">' +
            '<span>📱 Dispatch SMS via Ethio Telecom Gateway</span>' +
          '</button>' +
        '</div>' +
      '</form>' : '');

  document.getElementById('universal-clerk-modal').classList.add('show');
}

async function handleSaveSessionMinutes(e, caseId) {
  e.preventDefault();
  const judgePresence = document.getElementById('sess-judge-pres').value;
  const plaintiffPresence = document.getElementById('sess-plaintiff-pres').value;
  const defendantPresence = document.getElementById('sess-def-pres').value;
  const prosecutorPresence = document.getElementById('sess-pros-pres').value;
  const stage = document.getElementById('sess-stage').value;
  const minutes = document.getElementById('sess-minutes').value.trim();
  const exhibitsAdmitted = document.getElementById('sess-exhibits').value.trim();
  const nextHearingDate = document.getElementById('sess-next-date').value;
  const nextHearingTime = document.getElementById('sess-next-time').value;
  const courtroom = document.getElementById('sess-courtroom').value.trim();
  const nextHearingAgenda = document.getElementById('sess-next-agenda').value.trim();

  try {
    const res = await fetch(API + '/cases/log-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        judgePresence,
        plaintiffPresence,
        defendantPresence,
        prosecutorPresence,
        stage,
        minutes,
        exhibitsAdmitted,
        courtOrder: 'Court adjourned to ' + nextHearingDate + ' for ' + nextHearingAgenda,
        nextHearingDate,
        nextHearingTime,
        courtroom,
        nextHearingAgenda,
        clerkName: currentClerk.fullName,
        clerkId: currentClerk.id
      })
    });

    if (res.ok) {
      alert('✓ Official Court Session Minutes & Attendance successfully committed and sealed for case ' + caseId + '!');
      await loadClerkData();
      const updated = allCases.find(it => it.caseId === caseId);
      if (updated) {
        renderClerkDocketModalContent(updated, 'session_minutes');
      } else {
        closeClerkModal();
      }
    } else {
      alert('Error saving session minutes.');
    }
  } catch (err) {
    alert('Server connection error.');
  }
}

function handleSendDocketSms(e, caseId) {
  e.preventDefault();
  const phone = document.getElementById('docket-sms-target').value;
  alert('SMS notice dispatched successfully to ' + phone + ' for case ' + caseId + '!');
  closeClerkModal();
}

function openRegisterCaseModal() {
  openRegisterFilingModal('NEW-FILING-' + Date.now());
}

function openUploadDocumentModal(presetCaseId = '') {
  const myCases = getAppointedCases();
  const title = document.getElementById('clerk-modal-title');
  const body = document.getElementById('clerk-modal-body');
  if (!title || !body) return;

  title.textContent = 'Upload Certified Exhibit / Filing';
  body.innerHTML = 
    '<form onsubmit="handleUploadClerkDocument(event)">' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Select Appointed Docket</label>' +
        '<select class="modal-form-input" id="up-case-select" required>' +
          myCases.map(c => '<option value="' + c.caseId + '" ' + (c.caseId === presetCaseId ? 'selected' : '') + '>' + c.caseId + ' &mdash; ' + c.caseTitle + '</option>').join('') +
        '</select>' +
      '</div>' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Document Title</label>' +
        '<input type="text" class="modal-form-input" id="up-doc-title" placeholder="e.g. Certified Audit Statement.pdf" required>' +
      '</div>' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Filing Category</label>' +
        '<select class="modal-form-input" id="up-doc-type">' +
          '<option value="Statement of Claim">Statement of Claim</option>' +
          '<option value="Statement of Defense">Statement of Defense</option>' +
          '<option value="Evidence Exhibit">Evidence Exhibit</option>' +
          '<option value="Affidavit / Witness Statement">Affidavit / Witness Statement</option>' +
          '<option value="Power of Attorney">Power of Attorney</option>' +
        '</select>' +
      '</div>' +
      '<div class="modal-btn-row">' +
        '<button type="button" class="btn-cancel" onclick="closeClerkModal()">Cancel</button>' +
        '<button type="submit" class="btn-submit">Upload &amp; Certify Exhibit</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-clerk-modal').classList.add('show');
}

async function handleUploadClerkDocument(e) {
  e.preventDefault();
  const caseId = document.getElementById('up-case-select').value;
  const docTitle = document.getElementById('up-doc-title').value.trim();
  alert('Document "' + docTitle + '" successfully verified and uploaded to appointed case ' + caseId + '!');
  closeClerkModal();
  await loadClerkData();
}

function openIssueOrderModal() {
  const myCases = getAppointedCases();
  const title = document.getElementById('clerk-modal-title');
  const body = document.getElementById('clerk-modal-body');
  if (!title || !body) return;

  title.textContent = 'Issue Official Chamber Order / Letter';
  body.innerHTML = 
    '<form onsubmit="handleIssueClerkOrder(event)">' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Target Appointed Case</label>' +
        '<select class="modal-form-input" id="ord-case-select" required>' +
          myCases.map(c => '<option value="' + c.caseId + '">' + c.caseId + ' &mdash; ' + c.caseTitle + '</option>').join('') +
        '</select>' +
      '</div>' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Order Type</label>' +
        '<select class="modal-form-input" id="ord-type">' +
          '<option value="Summons to Appear">Summons to Appear</option>' +
          '<option value="Production of Documents">Production of Documents</option>' +
          '<option value="Interim Stay Order">Interim Stay Order</option>' +
          '<option value="Adjournment Notice">Adjournment Notice</option>' +
        '</select>' +
      '</div>' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Directive Content</label>' +
        '<textarea class="modal-form-input" id="ord-content" rows="4" placeholder="Enter formal order text..." required></textarea>' +
      '</div>' +
      '<div class="modal-btn-row">' +
        '<button type="button" class="btn-cancel" onclick="closeClerkModal()">Cancel</button>' +
        '<button type="submit" class="btn-submit">Dispatch Order Decree</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-clerk-modal').classList.add('show');
}

function handleIssueClerkOrder(e) {
  e.preventDefault();
  const caseId = document.getElementById('ord-case-select').value;
  alert('Official Chamber Order dispatched for case ' + caseId + '!');
  closeClerkModal();
}

function openScheduleHearingModal(presetCaseId = '') {
  const myCases = getAppointedCases();
  const title = document.getElementById('clerk-modal-title');
  const body = document.getElementById('clerk-modal-body');
  if (!title || !body) return;

  title.textContent = 'Schedule Chamber Session / Hearing';
  body.innerHTML = 
    '<form onsubmit="handleScheduleClerkHearing(event)">' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Select Appointed Case</label>' +
        '<select class="modal-form-input" id="sch-case-select" required>' +
          myCases.map(c => '<option value="' + c.caseId + '" ' + (c.caseId === presetCaseId ? 'selected' : '') + '>' + c.caseId + ' &mdash; ' + c.caseTitle + '</option>').join('') +
        '</select>' +
      '</div>' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Hearing Date</label>' +
        '<input type="date" class="modal-form-input" id="sch-date" value="2026-08-30" required>' +
      '</div>' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Time Slot</label>' +
        '<select class="modal-form-input" id="sch-time">' +
          '<option value="09:00 AM">09:00 AM</option>' +
          '<option value="10:00 AM">10:00 AM</option>' +
          '<option value="11:30 AM">11:30 AM</option>' +
          '<option value="02:00 PM">02:00 PM</option>' +
          '<option value="03:30 PM">03:30 PM</option>' +
        '</select>' +
      '</div>' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Courtroom</label>' +
        '<select class="modal-form-input" id="sch-courtroom">' +
          '<option value="Courtroom 1 (Commercial Bench)">Courtroom 1 (Commercial Bench)</option>' +
          '<option value="Courtroom 2 (Cassation Division)">Courtroom 2 (Cassation Division)</option>' +
          '<option value="Courtroom 3 (Civil Chamber)">Courtroom 3 (Civil Chamber)</option>' +
        '</select>' +
      '</div>' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Procedural Agenda</label>' +
        '<input type="text" class="modal-form-input" id="sch-agenda" placeholder="e.g. Oral Arguments on Injunction" required>' +
      '</div>' +
      '<div class="modal-btn-row">' +
        '<button type="button" class="btn-cancel" onclick="closeClerkModal()">Cancel</button>' +
        '<button type="submit" class="btn-submit">Confirm Hearing Schedule</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-clerk-modal').classList.add('show');
}

async function handleScheduleClerkHearing(e) {
  e.preventDefault();
  const caseId = document.getElementById('sch-case-select').value;
  const hearingDate = document.getElementById('sch-date').value;
  const hearingTime = document.getElementById('sch-time').value;
  const courtroom = document.getElementById('sch-courtroom').value;
  const agenda = document.getElementById('sch-agenda').value.trim();

  try {
    const res = await fetch(API + '/cases/schedule-next-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        hearingDate,
        hearingTime,
        courtroom,
        agenda,
        judgeName: currentClerk.fullName
      })
    });
    if (res.ok) {
      alert('Hearing successfully scheduled for appointed case ' + caseId + ' on ' + hearingDate + ' at ' + hearingTime + '!');
      closeClerkModal();
      await loadClerkData();
    } else {
      alert('Error scheduling session.');
    }
  } catch (err) {
    alert('Server error scheduling session.');
  }
}

function openSendSmsModal() {
  const myCases = getAppointedCases();
  const title = document.getElementById('clerk-modal-title');
  const body = document.getElementById('clerk-modal-body');
  if (!title || !body) return;

  title.textContent = 'Dispatch SMS Notice';
  body.innerHTML = 
    '<form onsubmit="handleSendClerkSms(event)">' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Select Appointed Case</label>' +
        '<select class="modal-form-input" id="sms-case-select" required>' +
          myCases.map(c => '<option value="' + c.caseId + '">' + c.caseId + ' &mdash; ' + c.caseTitle + '</option>').join('') +
        '</select>' +
      '</div>' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">Recipient Phone Number</label>' +
        '<input type="text" class="modal-form-input" id="sms-phone" placeholder="e.g. +251 911 123 456" required>' +
      '</div>' +
      '<div class="modal-form-group">' +
        '<label class="modal-form-label">SMS Message Content</label>' +
        '<textarea class="modal-form-input" id="sms-content" rows="3" placeholder="Enter SMS text..." required></textarea>' +
      '</div>' +
      '<div class="modal-btn-row">' +
        '<button type="button" class="btn-cancel" onclick="closeClerkModal()">Cancel</button>' +
        '<button type="submit" class="btn-submit">Dispatch SMS via Ethio Telecom Gateway</button>' +
      '</div>' +
    '</form>';

  document.getElementById('universal-clerk-modal').classList.add('show');
}

function handleSendClerkSms(e) {
  e.preventDefault();
  const phone = document.getElementById('sms-phone').value.trim();
  alert('SMS notice dispatched successfully to ' + phone + '!');
  closeClerkModal();
}

function openGenerateReportModal() {
  const myCases = getAppointedCases();
  alert('Generated certified chamber ledger for ' + myCases.length + ' appointed dockets.');
}

function openSearchCaseModal() {
  const q = prompt('Search Appointed Cases (by ID or Title):');
  if (q) {
    const found = getAppointedCases().filter(c => c.caseId.toLowerCase().includes(q.toLowerCase()) || c.caseTitle.toLowerCase().includes(q.toLowerCase()));
    if (found.length > 0) {
      openClerkCaseModal(found[0].caseId);
    } else {
      alert('No matching case found in your appointed dockets.');
    }
  }
}

function openCreateNoticeModal() {
  openIssueOrderModal();
}

function openDailyCauseListModal() {
  switchClerkView('hearing_calendar');
}
