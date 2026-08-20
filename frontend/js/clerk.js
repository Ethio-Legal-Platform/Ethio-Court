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

function openClerkEditProfileModal() {
  const menu = document.getElementById('clerk-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');

  document.getElementById('clerk-modal-title').textContent = 'Edit Court Clerk Profile';
  document.getElementById('clerk-modal-body').innerHTML = 
    '<form onsubmit="handleClerkEditProfileSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Full Legal Name</label>' +
        '<input type="text" id="edit-clk-fullname" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentClerk.fullName || 'Kalkidan Mengistu') + '" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Registry Email</label>' +
          '<input type="email" id="edit-clk-email" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentClerk.email || 'kalkidan.registry@courts.gov.et') + '" required/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Desk Extension</label>' +
          '<input type="text" id="edit-clk-phone" class="top-search-input" style="border-radius:6px;width:100%" value="' + (currentClerk.phone || '+251 11 551 7700 (Ext 22)') + '" required/>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:1rem;border-top:1px solid #f1f5f9;padding-top:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Update Password (leave blank to keep current)</label>' +
        '<input type="password" id="edit-clk-password" class="top-search-input" style="border-radius:6px;width:100%" placeholder="••••••••"/>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem">' +
        '<button type="submit" class="btn btn-primary" style="flex:1;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Save Clerk Profile</button>' +
        '<button type="button" class="btn btn-outline" style="padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer" onclick="closeClerkModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openClerkModal();
}

function handleClerkEditProfileSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('edit-clk-fullname').value.trim();
  const email = document.getElementById('edit-clk-email').value.trim();
  const phone = document.getElementById('edit-clk-phone').value.trim();

  currentClerk.fullName = fullName;
  currentClerk.email = email;
  currentClerk.phone = phone;

  sessionStorage.setItem('court_user', JSON.stringify(currentClerk));
  updateClerkHeaderUI();
  alert('Clerk profile updated.');
  closeClerkModal();
  renderClerkCurrentView();
}

function logoutClerk() {
  const menu = document.getElementById('clerk-profile-dropdown-menu');
  if (menu) menu.classList.remove('show');
  sessionStorage.removeItem('court_user');
  window.location.href = '/';
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

function switchClerkView(viewName) {
  currentClerkView = viewName;
  document.querySelectorAll('.clerk-nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(document.querySelectorAll('.clerk-nav-btn')).find(b => 
    b.textContent.toLowerCase().includes(viewName.replace('_', ' '))
  );
  if (activeBtn) activeBtn.classList.add('active');

  renderClerkCurrentView();
}

function renderClerkCurrentView() {
  const container = document.getElementById('dynamic-clerk-workspace');
  if (!container) return;

  if (currentClerkView === 'dashboard') {
    renderClerkDashboard(container);
  } else if (currentClerkView === 'filing_queue') {
    renderClerkFilingQueueView(container);
  } else if (currentClerkView === 'case_records') {
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

function renderClerkDashboard(container) {
  const pendingFilingsList = [
    { tempId: 'TEMP-240524-0018', filerName: 'Abebe Kebede', caseType: 'Civil', filedOn: 'May 24, 2026 10:30 AM', docCount: 4, status: 'Pending' },
    { tempId: 'TEMP-240524-0017', filerName: 'Hana Tesfaye', caseType: 'Labour', filedOn: 'May 24, 2026 10:21 AM', docCount: 3, status: 'Pending' },
    { tempId: 'TEMP-240524-0016', filerName: 'Zewdu Getachew', caseType: 'Land', filedOn: 'May 24, 2026 10:15 AM', docCount: 5, status: 'Pending' },
    { tempId: 'TEMP-240524-0015', filerName: 'Yalemwork Alemu', caseType: 'Family', filedOn: 'May 24, 2026 10:05 AM', docCount: 2, status: 'Pending' },
    { tempId: 'TEMP-240524-0014', filerName: 'Awash International Bank', caseType: 'Corporate', filedOn: 'May 24, 2026 09:55 AM', docCount: 6, status: 'Pending' }
  ];

  const pendingRowsHtml = pendingFilingsList.map(p => 
    '<tr>' +
      '<td><a class="case-link-bold" onclick="openRegisterFilingModal(\'' + p.tempId + '\', \'' + p.filerName + '\', \'' + p.caseType + '\')">' + p.tempId + '</a></td>' +
      '<td><strong style="color:var(--fsc-navy-main)">' + p.filerName + '</strong></td>' +
      '<td style="color:#64748b">' + p.caseType + '</td>' +
      '<td style="color:#64748b;font-size:0.75rem">' + p.filedOn + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:0.3rem"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> <span>' + p.docCount + '</span></div></td>' +
      '<td><span class="status-pill pill-yellow">' + p.status + '</span></td>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:0.35rem">' +
          '<button class="btn-register-sm" onclick="openRegisterFilingModal(\'' + p.tempId + '\', \'' + p.filerName + '\', \'' + p.caseType + '\')">Register</button>' +
          '<button class="btn-register-sm" style="padding:0.25rem 0.4rem" onclick="openRegisterFilingModal(\'' + p.tempId + '\', \'' + p.filerName + '\', \'' + p.caseType + '\')">⋮</button>' +
        '</div>' +
      '</td>' +
    '</tr>'
  ).join('');

  const registeredCasesList = [
    { caseId: 'CASE-240521596417', title: 'Awash International Bank vs. Blue Nile Holdings', registeredOn: 'May 24, 2026 10:32 AM', registeredBy: 'Kalkidan M.' },
    { caseId: 'CASE-178721612233', title: 'Abebe Kebede vs. Zenebe Tadesse', registeredOn: 'May 24, 2026 10:18 AM', registeredBy: 'Kalkidan M.' },
    { caseId: 'CASE-178721608884', title: 'Hana Tesfaye vs. Worku Alemu', registeredOn: 'May 24, 2026 10:10 AM', registeredBy: 'Kalkidan M.' },
    { caseId: 'CASE-178721598765', title: 'Zewdu Getachew vs. Tesfaye Yimer', registeredOn: 'May 24, 2026 09:58 AM', registeredBy: 'Kalkidan M.' },
    { caseId: 'CASE-178721595551', title: 'Yalemwork Alemu vs. Fitsum Abebe', registeredOn: 'May 24, 2026 09:45 AM', registeredBy: 'Kalkidan M.' }
  ];

  const registeredRowsHtml = registeredCasesList.map(r => 
    '<tr>' +
      '<td><a class="case-link-bold" onclick="openClerkCaseModal(\'' + r.caseId + '\')">' + r.caseId + '</a></td>' +
      '<td style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px"><strong style="color:var(--fsc-navy-main)">' + r.title + '</strong></td>' +
      '<td style="color:#64748b;font-size:0.75rem">' + r.registeredOn + '</td>' +
      '<td style="color:#64748b">' + r.registeredBy + '</td>' +
      '<td><button class="btn-register-sm" onclick="openClerkCaseModal(\'' + r.caseId + '\')">Open</button></td>' +
    '</tr>'
  ).join('');

  const docUploadsList = [
    { fileName: 'Evidence_01.pdf', caseId: 'CASE-178721596417', uploader: 'Awash Bank', time: '10:32 AM', size: '2.4 MB' },
    { fileName: 'Contract.pdf', caseId: 'CASE-178721612233', uploader: 'Abebe Kebede', time: '10:18 AM', size: '5.1 MB' },
    { fileName: 'Witness_Statement.pdf', caseId: 'CASE-178721608884', uploader: 'Hana Tesfaye', time: '10:10 AM', size: '1.8 MB' },
    { fileName: 'Land_Document.pdf', caseId: 'CASE-178721608884', uploader: 'Hana Tesfaye', time: '10:10 AM', size: '3.2 MB' },
    { fileName: 'ID_Copy.pdf', caseId: 'CASE-178721598765', uploader: 'Zewdu Getachew', time: '09:58 AM', size: '900 KB' }
  ];

  const docUploadsHtml = docUploadsList.map(d => 
    '<div class="doc-upload-item">' +
      '<div class="doc-upload-left">' +
        '<div style="color:#2563eb">' + ICONS.fileText + '</div>' +
        '<div style="min-width:0">' +
          '<div class="doc-file-name" onclick="alert(\'Viewing verified PDF: ' + d.fileName + '\')">' + d.fileName + '</div>' +
          '<div class="doc-case-sub">' + d.caseId + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="doc-upload-meta">' + d.uploader + ' &bull; ' + d.time + '</div>' +
      '<div style="display:flex;align-items:center;gap:0.4rem">' +
        '<span style="font-size:0.7rem;color:#64748b">' + d.size + '</span>' +
        '<span class="status-pill pill-green">Uploaded</span>' +
      '</div>' +
    '</div>'
  ).join('');

  const smsLogsList = [
    { time: 'May 24, 2026 10:35 AM', phone: '+251 911 123 456', caseId: 'CASE-178721596417', type: 'Hearing Notice', status: 'Sent', statusClass: 'pill-green', sentBy: 'Kalkidan M.' },
    { time: 'May 24, 2026 10:22 AM', phone: '+251 912 789 123', caseId: 'CASE-178721612233', type: 'Filing Confirmation', status: 'Sent', statusClass: 'pill-green', sentBy: 'Kalkidan M.' },
    { time: 'May 24, 2026 10:15 AM', phone: '+251 913 456 789', caseId: 'CASE-178721608884', type: 'Hearing Notice', status: 'Sent', statusClass: 'pill-green', sentBy: 'Kalkidan M.' },
    { time: 'May 24, 2026 09:48 AM', phone: '+251 911 987 654', caseId: 'CASE-178721598765', type: 'Filing Confirmation', status: 'Delivered', statusClass: 'pill-blue', sentBy: 'Kalkidan M.' },
    { time: 'May 24, 2026 09:40 AM', phone: '+251 919 654 321', caseId: 'CASE-178721595551', type: 'Court Order', status: 'Sent', statusClass: 'pill-green', sentBy: 'Kalkidan M.' }
  ];

  const smsRowsHtml = smsLogsList.map(s => 
    '<tr>' +
      '<td style="color:#64748b;font-size:0.75rem;white-space:nowrap">' + s.time + '</td>' +
      '<td><strong>' + s.phone + '</strong></td>' +
      '<td><a class="case-link-bold" onclick="openClerkCaseModal(\'' + s.caseId + '\')">' + s.caseId + '</a></td>' +
      '<td>' + s.type + '</td>' +
      '<td><span class="status-pill ' + s.statusClass + '">' + s.status + '</span></td>' +
      '<td style="color:#64748b">' + s.sentBy + '</td>' +
    '</tr>'
  ).join('');

  container.innerHTML = 
    '<div class="clerk-greeting-row">' +
      '<h1 class="clerk-greeting-title">Good morning, ' + (currentClerk.fullName || 'Kalkidan Mengistu') + '</h1>' +
      '<div class="clerk-greeting-sub">Here\'s what\'s happening in the registry today.</div>' +
    '</div>' +

    '<div class="clerk-kpi-grid-5">' +
      '<div class="clerk-kpi-card">' +
        '<div class="clerk-kpi-top">' +
          '<div class="clerk-kpi-icon kpi-blue">' + ICONS.fileText + '</div>' +
          '<div>' +
            '<div class="clerk-kpi-label">Pending Filings</div>' +
            '<div class="clerk-kpi-number">18</div>' +
          '</div>' +
        '</div>' +
        '<div class="clerk-kpi-subtext">Awaiting registration</div>' +
        '<a class="clerk-kpi-link" onclick="switchClerkView(\'filing_queue\')">View queue &rarr;</a>' +
      '</div>' +

      '<div class="clerk-kpi-card">' +
        '<div class="clerk-kpi-top">' +
          '<div class="clerk-kpi-icon kpi-green">' + ICONS.folderCheck + '</div>' +
          '<div>' +
            '<div class="clerk-kpi-label">Registered Today</div>' +
            '<div class="clerk-kpi-number">12</div>' +
          '</div>' +
        '</div>' +
        '<div class="clerk-kpi-subtext">This day</div>' +
        '<a class="clerk-kpi-link" onclick="switchClerkView(\'case_records\')">View records &rarr;</a>' +
      '</div>' +

      '<div class="clerk-kpi-card">' +
        '<div class="clerk-kpi-top">' +
          '<div class="clerk-kpi-icon kpi-orange">' + ICONS.calendarClock + '</div>' +
          '<div>' +
            '<div class="clerk-kpi-label">Hearings Today</div>' +
            '<div class="clerk-kpi-number">6</div>' +
          '</div>' +
        '</div>' +
        '<div class="clerk-kpi-subtext">Scheduled</div>' +
        '<a class="clerk-kpi-link" onclick="switchClerkView(\'hearing_calendar\')">View calendar &rarr;</a>' +
      '</div>' +

      '<div class="clerk-kpi-card">' +
        '<div class="clerk-kpi-top">' +
          '<div class="clerk-kpi-icon kpi-purple">' + ICONS.uploadDoc + '</div>' +
          '<div>' +
            '<div class="clerk-kpi-label">Documents Uploaded</div>' +
            '<div class="clerk-kpi-number">24</div>' +
          '</div>' +
        '</div>' +
        '<div class="clerk-kpi-subtext">This day</div>' +
        '<a class="clerk-kpi-link" onclick="switchClerkView(\'documents\')">View documents &rarr;</a>' +
      '</div>' +

      '<div class="clerk-kpi-card">' +
        '<div class="clerk-kpi-top">' +
          '<div class="clerk-kpi-icon kpi-teal">' + ICONS.checkCircle + '</div>' +
          '<div>' +
            '<div class="clerk-kpi-label">Orders Issued</div>' +
            '<div class="clerk-kpi-number">8</div>' +
          '</div>' +
        '</div>' +
        '<div class="clerk-kpi-subtext">This day</div>' +
        '<a class="clerk-kpi-link" onclick="switchClerkView(\'templates\')">View orders &rarr;</a>' +
      '</div>' +
    '</div>' +

    '<div class="clerk-2col-row-top">' +

      '<div class="clerk-panel-card">' +
        '<div class="clerk-panel-header">' +
          '<div>' +
            '<div class="clerk-panel-title">' +
              '<span>Filing Queue</span>' +
              '<span class="badge-gold-pill">18</span>' +
            '</div>' +
            '<div style="font-size:0.75rem;color:#64748b;margin-top:2px">New filings submitted by litigants</div>' +
          '</div>' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'filing_queue\')">View all &rarr;</a>' +
        '</div>' +

        '<div style="overflow-x:auto">' +
          '<table class="clerk-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Case ID</th>' +
                '<th>Filer Name</th>' +
                '<th>Case Type</th>' +
                '<th>Filed On</th>' +
                '<th>Documents</th>' +
                '<th>Status</th>' +
                '<th>Action</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              pendingRowsHtml +
            '</tbody>' +
          '</table>' +
        '</div>' +

        '<div style="text-align:center;padding-top:0.75rem;border-top:1px solid #f1f5f9;margin-top:0.65rem">' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'filing_queue\')">View all filings &rarr;</a>' +
        '</div>' +
      '</div>' +

      '<div class="clerk-panel-card">' +
        '<div class="clerk-panel-header">' +
          '<div class="clerk-panel-title">Today\'s Hearings</div>' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'hearing_calendar\')">View full calendar &rarr;</a>' +
        '</div>' +

        '<div>' +
          '<div class="hearing-slot-row">' +
            '<div class="hearing-time-bold">09:30 AM</div>' +
            '<div class="hearing-case-info">' +
              '<a class="hearing-case-id" onclick="openClerkCaseModal(\'CASE-17872154411\')">CASE-17872154411</a>' +
              '<div class="hearing-case-title">Awash Bank vs. Blue Nile Holdings</div>' +
            '</div>' +
            '<span class="hearing-courtroom-badge">&bull; Courtroom 4</span>' +
          '</div>' +

          '<div class="hearing-slot-row">' +
            '<div class="hearing-time-bold">11:00 AM</div>' +
            '<div class="hearing-case-info">' +
              '<a class="hearing-case-id" onclick="openClerkCaseModal(\'CASE-17872155922\')">CASE-17872155922</a>' +
              '<div class="hearing-case-title">Mulualem Desta vs. Ethio Telecom</div>' +
            '</div>' +
            '<span class="hearing-courtroom-badge">&bull; Courtroom 2</span>' +
          '</div>' +

          '<div class="hearing-slot-row">' +
            '<div class="hearing-time-bold">02:00 PM</div>' +
            '<div class="hearing-case-info">' +
              '<a class="hearing-case-id" onclick="openClerkCaseModal(\'CASE-178721552233\')">CASE-178721552233</a>' +
              '<div class="hearing-case-title">Aster Manufacturing vs. Ministry of Rev.</div>' +
            '</div>' +
            '<span class="hearing-courtroom-badge">&bull; Courtroom 3</span>' +
          '</div>' +

          '<div class="hearing-slot-row">' +
            '<div class="hearing-time-bold">03:30 PM</div>' +
            '<div class="hearing-case-info">' +
              '<a class="hearing-case-id" onclick="openClerkCaseModal(\'CASE-178721548800\')">CASE-178721548800</a>' +
              '<div class="hearing-case-title">Yalemwork Alemu vs. Hibret Insurance</div>' +
            '</div>' +
            '<span class="hearing-courtroom-badge">&bull; Courtroom 1</span>' +
          '</div>' +

          '<div class="hearing-slot-row">' +
            '<div class="hearing-time-bold">04:30 PM</div>' +
            '<div class="hearing-case-info">' +
              '<a class="hearing-case-id" onclick="openClerkCaseModal(\'CASE-178721561122\')">CASE-178721561122</a>' +
              '<div class="hearing-case-title">Kidane Tekle vs. Govt. of Ethiopia</div>' +
            '</div>' +
            '<span class="hearing-courtroom-badge">&bull; Courtroom 2</span>' +
          '</div>' +
        '</div>' +

        '<div style="text-align:center;padding-top:0.75rem;border-top:1px solid #f1f5f9;margin-top:0.65rem">' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'hearing_calendar\')">View full calendar &rarr;</a>' +
        '</div>' +
      '</div>' +

    '</div>' +

    '<div class="clerk-3col-row-mid">' +

      '<div class="clerk-panel-card">' +
        '<div class="clerk-panel-header">' +
          '<div class="clerk-panel-title">Recent Registered Cases</div>' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'case_records\')">View all &rarr;</a>' +
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
          '<div class="clerk-panel-title">Document Uploads</div>' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'documents\')">View all &rarr;</a>' +
        '</div>' +

        '<div>' +
          docUploadsHtml +
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
            '<span>Issue Order/Letter</span>' +
          '</div>' +

          '<div class="action-tile-btn" onclick="openScheduleHearingModal()">' +
            '<div style="color:#475569">' + ICONS.calendarClock + '</div>' +
            '<span>Schedule Hearing</span>' +
          '</div>' +

          '<div class="action-tile-btn" onclick="openSendSmsModal()">' +
            '<div style="color:#475569">' + ICONS.messageSquare + '</div>' +
            '<span>Send SMS (Manual)</span>' +
          '</div>' +

          '<div class="action-tile-btn" onclick="openGenerateReportModal()">' +
            '<div style="color:#475569">' + ICONS.chart + '</div>' +
            '<span>Generate Report</span>' +
          '</div>' +

          '<div class="action-tile-btn" onclick="openSearchCaseModal()">' +
            '<div style="color:#475569">' + ICONS.search + '</div>' +
            '<span>Search Case</span>' +
          '</div>' +

          '<div class="action-tile-btn" onclick="openCreateNoticeModal()">' +
            '<div style="color:#475569">' + ICONS.edit + '</div>' +
            '<span>Create Notice</span>' +
          '</div>' +

          '<div class="action-tile-btn" onclick="openDailyCauseListModal()">' +
            '<div style="color:#475569">' + ICONS.list + '</div>' +
            '<span>Daily Cause List</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

    '</div>' +

    '<div class="clerk-2col-row-bottom">' +

      '<div class="clerk-panel-card">' +
        '<div class="clerk-panel-header">' +
          '<div class="clerk-panel-title">SMS Notification Log</div>' +
          '<a class="clerk-panel-link" onclick="switchClerkView(\'sms_notifications\')">View all &rarr;</a>' +
        '</div>' +

        '<div style="overflow-x:auto">' +
          '<table class="clerk-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Date &amp; Time</th>' +
                '<th>Recipient</th>' +
                '<th>Case ID</th>' +
                '<th>SMS Type</th>' +
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
          '<div class="clerk-panel-title">Today\'s Summary</div>' +
        '</div>' +

        '<div>' +
          '<div class="summary-item-row">' +
            '<div class="summary-item-left">' + ICONS.folderCheck + ' <span>Cases Registered</span></div>' +
            '<span class="summary-item-number">12</span>' +
          '</div>' +

          '<div class="summary-item-row">' +
            '<div class="summary-item-left">' + ICONS.fileText + ' <span>Documents Uploaded</span></div>' +
            '<span class="summary-item-number">24</span>' +
          '</div>' +

          '<div class="summary-item-row">' +
            '<div class="summary-item-left">' + ICONS.calendarClock + ' <span>Hearings Scheduled</span></div>' +
            '<span class="summary-item-number">6</span>' +
          '</div>' +

          '<div class="summary-item-row">' +
            '<div class="summary-item-left">' + ICONS.messageSquare + ' <span>SMS Sent</span></div>' +
            '<span class="summary-item-number">15</span>' +
          '</div>' +

          '<div class="summary-item-row">' +
            '<div class="summary-item-left">' + ICONS.checkCircle + ' <span>Orders Issued</span></div>' +
            '<span class="summary-item-number">8</span>' +
          '</div>' +
        '</div>' +

        '<div style="text-align:center;padding-top:0.75rem;border-top:1px solid #f1f5f9;margin-top:0.65rem">' +
          '<a class="clerk-panel-link" onclick="openDailyReportModal()">View full daily report &rarr;</a>' +
        '</div>' +
      '</div>' +

    '</div>';
}

/* Subviews */
function renderClerkFilingQueueView(container) {
  renderClerkDashboard(container);
}

function renderClerkCaseRecordsView(container) {
  container.innerHTML = 
    '<div class="clerk-greeting-row">' +
      '<h1 class="clerk-greeting-title">Court Docket &amp; Registry Records</h1>' +
      '<div class="clerk-greeting-sub">Master archive of registered and pending federal cases.</div>' +
    '</div>' +
    '<div class="clerk-panel-card">' +
      '<table class="clerk-table">' +
        '<thead><tr><th>Case ID</th><th>Title</th><th>Jurisdiction</th><th>Judge</th><th>Status</th><th>Action</th></tr></thead>' +
        '<tbody>' +
          allCases.slice(0, 15).map(c => 
            '<tr>' +
              '<td><a class="case-link-bold" onclick="openClerkCaseModal(\'' + c.caseId + '\')">' + c.caseId + '</a></td>' +
              '<td><strong>' + (c.caseTitle || '') + '</strong></td>' +
              '<td>' + (c.jurisdiction || 'Federal Supreme Court') + '</td>' +
              '<td>' + (c.judgeName || 'Hon. Judge Solomon Desta') + '</td>' +
              '<td><span class="status-pill pill-green">' + (c.status || 'Active').toUpperCase() + '</span></td>' +
              '<td><button class="btn-register-sm" onclick="openClerkCaseModal(\'' + c.caseId + '\')">Open Docket</button></td>' +
            '</tr>'
          ).join('') +
        '</tbody>' +
      '</table>' +
    '</div>';
}

function renderClerkDocumentsView(container) {
  renderClerkDashboard(container);
}

function renderClerkCalendarView(container) {
  renderClerkDashboard(container);
}

function renderClerkSmsLogsView(container) {
  renderClerkDashboard(container);
}

function renderClerkTemplatesView(container) {
  container.innerHTML = 
    '<div class="clerk-greeting-row">' +
      '<h1 class="clerk-greeting-title">Certified Court Order &amp; Letter Templates</h1>' +
      '<div class="clerk-greeting-sub">Official judicial summons, interlocutory decrees, and demand notices.</div>' +
    '</div>' +
    '<div class="clerk-panel-card">' +
      '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:1rem">' +
        '<div style="padding:1.25rem;border:1px solid #cbd5e1;border-radius:8px"><h3 style="font-size:0.95rem;color:var(--fsc-navy-main)">Formal Hearing Summons</h3><p style="font-size:0.75rem;color:#64748b;margin:0.5rem 0">Court order summoning defendant and advocates.</p><button class="btn-register-sm" onclick="openIssueOrderModal()">Use Template</button></div>' +
        '<div style="padding:1.25rem;border:1px solid #cbd5e1;border-radius:8px"><h3 style="font-size:0.95rem;color:var(--fsc-navy-main)">Evidentiary Production Demand</h3><p style="font-size:0.75rem;color:#64748b;margin:0.5rem 0">Demanding production of bank slips, deeds, or records.</p><button class="btn-register-sm" onclick="openIssueOrderModal()">Use Template</button></div>' +
        '<div style="padding:1.25rem;border:1px solid #cbd5e1;border-radius:8px"><h3 style="font-size:0.95rem;color:var(--fsc-navy-main)">Temporary Injunction Order</h3><p style="font-size:0.75rem;color:#64748b;margin:0.5rem 0">Freezing asset or halting property transfer.</p><button class="btn-register-sm" onclick="openIssueOrderModal()">Use Template</button></div>' +
      '</div>' +
    '</div>';
}

function renderClerkReportsView(container) {
  renderClerkDashboard(container);
}

function renderClerkArchiveView(container) {
  container.innerHTML = 
    '<div class="clerk-greeting-row">' +
      '<h1 class="clerk-greeting-title">Archived Judicial Records</h1>' +
      '<div class="clerk-greeting-sub">Digitized historical court records and completed litigation archives.</div>' +
    '</div>' +
    '<div class="clerk-panel-card">' +
      '<p style="color:#64748b">858 concluded court cases have been sealed into permanent legal archives.</p>' +
    '</div>';
}

/* Modals */
function openClerkCaseModal(caseId) {
  const c = allCases.find(it => it.caseId === caseId) || { caseId: caseId, caseTitle: 'Court Case', jurisdiction: 'Federal Supreme Court', status: 'active' };
  document.getElementById('clerk-modal-title').textContent = 'Registry Case Record — ' + c.caseId;
  document.getElementById('clerk-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<h3 style="font-size:1.05rem;font-weight:700;color:var(--fsc-navy-main);margin-bottom:0.5rem">' + (c.caseTitle || '') + '</h3>' +
      '<div><strong>Court Division:</strong> ' + (c.jurisdiction || 'Federal Supreme Court') + '</div>' +
      '<div><strong>Presiding Judge:</strong> ' + (c.judgeName || 'Hon. Judge Solomon Desta') + '</div>' +
      '<div><strong>Registration Status:</strong> <span class="status-pill pill-green">' + ((c.status || 'Active')).toUpperCase() + '</span></div>' +
      '<div style="margin-top:1rem;display:flex;gap:0.5rem">' +
        '<button class="btn btn-primary" style="flex:1;padding:0.6rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="closeClerkModal()">Close Record</button>' +
      '</div>' +
    '</div>';
  openClerkModal();
}

function openRegisterFilingModal(tempId, filerName, caseType) {
  document.getElementById('clerk-modal-title').textContent = 'Register Docket — ' + tempId;
  document.getElementById('clerk-modal-body').innerHTML = 
    '<form onsubmit="handleRegisterFilingSubmit(event, \'' + tempId + '\')">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Filer Name</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="' + filerName + '" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Case Type</label>' +
          '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="' + caseType + '" required/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Assign Permanent Case ID</label>' +
          '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="CASE-' + Date.now().toString().slice(-12) + '" required/>' +
        '</div>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Assign Case Number &amp; Issue Registration Stamp</button>' +
    '</form>';
  openClerkModal();
}

function handleRegisterFilingSubmit(e, tempId) {
  e.preventDefault();
  alert('Case registered successfully. Permanent Case ID issued and filing confirmation SMS dispatched to litigant.');
  closeClerkModal();
}

function openRegisterCaseModal() {
  document.getElementById('clerk-modal-title').textContent = 'Registry Case Entry';
  document.getElementById('clerk-modal-body').innerHTML = 
    '<form onsubmit="handleNewCaseSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Case Title</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="e.g. Plaintiff vs. Defendant" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Jurisdiction</label>' +
          '<select class="top-search-input" style="border-radius:6px;width:100%">' +
            '<option>Federal Supreme Court</option>' +
            '<option>Federal High Court (Lideta)</option>' +
            '<option>Federal First Instance Court</option>' +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Filer Mobile Phone</label>' +
          '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="+251 91 123 4567" required/>' +
        '</div>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Register Case</button>' +
    '</form>';
  openClerkModal();
}

function handleNewCaseSubmit(e) {
  e.preventDefault();
  alert('Case entered into federal registry.');
  closeClerkModal();
}

function openUploadDocumentModal() {
  document.getElementById('clerk-modal-title').textContent = 'Upload Certified Electronic Document';
  document.getElementById('clerk-modal-body').innerHTML = 
    '<form onsubmit="handleUploadDocSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Case Number</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="CASE-178721596417" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Document Name / Title</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="e.g. Certified Power of Attorney.pdf" required/>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Upload &amp; Attach to Docket</button>' +
    '</form>';
  openClerkModal();
}

function handleUploadDocSubmit(e) {
  e.preventDefault();
  alert('Document uploaded and sealed into docket.');
  closeClerkModal();
}

function openIssueOrderModal() {
  document.getElementById('clerk-modal-title').textContent = 'Issue Formal Court Order / Letter';
  document.getElementById('clerk-modal-body').innerHTML = 
    '<form onsubmit="handleIssueOrderSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Case Number</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="CASE-178721596417" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Order Type</label>' +
        '<select class="top-search-input" style="border-radius:6px;width:100%">' +
          '<option>Formal Hearing Summons</option>' +
          '<option>Evidentiary Production Demand</option>' +
          '<option>Adjournment Notice</option>' +
        '</select>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Issue Order &amp; Seal</button>' +
    '</form>';
  openClerkModal();
}

function handleIssueOrderSubmit(e) {
  e.preventDefault();
  alert('Court order issued and dispatched.');
  closeClerkModal();
}

function openScheduleHearingModal() {
  document.getElementById('clerk-modal-title').textContent = 'Schedule Court Hearing';
  document.getElementById('clerk-modal-body').innerHTML = 
    '<form onsubmit="handleScheduleSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Case Number</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="CASE-178721596417" required/>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem">' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Hearing Date</label>' +
          '<input type="date" class="top-search-input" style="border-radius:6px;width:100%" value="2026-05-28" required/>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Time &amp; Courtroom</label>' +
          '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" value="10:00 AM — Courtroom 4" required/>' +
        '</div>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Set Hearing &amp; Dispatch SMS</button>' +
    '</form>';
  openClerkModal();
}

function handleScheduleSubmit(e) {
  e.preventDefault();
  alert('Hearing scheduled and automated notices sent.');
  closeClerkModal();
}

function openSendSmsModal() {
  document.getElementById('clerk-modal-title').textContent = 'Send Manual SMS Notice (SMSEthiopia Gateway)';
  document.getElementById('clerk-modal-body').innerHTML = 
    '<form onsubmit="handleSendSmsSubmit(event)">' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">Recipient Mobile Phone</label>' +
        '<input type="text" class="top-search-input" style="border-radius:6px;width:100%" placeholder="+251 91 123 4567" required/>' +
      '</div>' +
      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem">SMS Message Content</label>' +
        '<textarea class="top-search-input" style="border-radius:6px;width:100%;height:80px;padding:0.5rem" required placeholder="Type court notice text..."></textarea>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Send Immediate SMS</button>' +
    '</form>';
  openClerkModal();
}

function handleSendSmsSubmit(e) {
  e.preventDefault();
  alert('SMS dispatched via SMSEthiopia gateway.');
  closeClerkModal();
}

function openGenerateReportModal() {
  alert('Generating registry statistical report in PDF format...');
}

function openSearchCaseModal() {
  const q = prompt('Enter Case ID or Party Name to search in federal registry:');
  if (q) {
    alert('Found matching records for: ' + q);
  }
}

function openCreateNoticeModal() {
  openIssueOrderModal();
}

function openDailyCauseListModal() {
  alert('Exporting official Daily Cause List for today across Courtrooms 1–4.');
}

function openDailyReportModal() {
  alert('Opening complete daily registry statistics summary.');
}

function openClerkSettingsModal() {
  document.getElementById('clerk-modal-title').textContent = 'Registry Unit Preferences';
  document.getElementById('clerk-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem"><input type="checkbox" checked /> Automated SMS Confirmation on Registration</label>' +
      '<label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem"><input type="checkbox" checked /> Real-time Document Anti-Virus Scan</label>' +
      '<button class="btn btn-primary" style="width:100%;padding:0.75rem;background:var(--fsc-navy-main);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer" onclick="alert(\'Registry preferences saved.\'); closeClerkModal();">Save Preferences</button>' +
    '</div>';
  openClerkModal();
}

function openClerkContactModal() {
  document.getElementById('clerk-modal-title').textContent = 'Registry Internal Directory';
  document.getElementById('clerk-modal-body').innerHTML = 
    '<div style="line-height:1.7">' +
      '<div><strong>Court Registry Block 1:</strong> Ext 22</div>' +
      '<div><strong>Screening Officer Tesfaye:</strong> Ext 14</div>' +
      '<div><strong>Chamber 4 Clerk:</strong> Ext 41</div>' +
      '<button class="btn btn-outline" style="width:100%;margin-top:1rem;padding:0.6rem;cursor:pointer" onclick="closeClerkModal()">Close</button>' +
    '</div>';
  openClerkModal();
}

function openClerkModal() {
  const modal = document.getElementById('universal-clerk-modal');
  if (modal) modal.style.display = 'flex';
}

function closeClerkModal() {
  const modal = document.getElementById('universal-clerk-modal');
  if (modal) modal.style.display = 'none';
}


// ── Clerk Hearing Session Summary Logger (Section 7) ──
function openHearingSummaryModal(caseId) {
  document.getElementById('clerk-modal-title').textContent = 'Log Hearing Session Activity & Attendance — ' + caseId;
  document.getElementById('clerk-modal-body').innerHTML = 
    '<form onsubmit="handleLogSessionSubmit(event, \'' + caseId + '\')">' +
      '<div style="background:#f8fafc;padding:0.75rem;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:0.75rem">' +
        '<div style="font-weight:700;font-size:0.8rem;margin-bottom:0.35rem">Party Attendance Verification</div>' +
        '<div style="display:flex;gap:1.5rem;font-size:0.8rem">' +
          '<label style="display:flex;align-items:center;gap:0.35rem"><input type="checkbox" id="sess-plaintiff-pres" checked/> Plaintiff / Counsel Present</label>' +
          '<label style="display:flex;align-items:center;gap:0.35rem"><input type="checkbox" id="sess-def-pres" checked/> Defendant / Counsel Present</label>' +
        '</div>' +
      '</div>' +

      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">Topics Discussed During Session</label>' +
        '<input type="text" id="sess-topics" class="top-search-input" value="Oral arguments on documentary evidence admissibility and preliminary objections." required/>' +
      '</div>' +

      '<div style="margin-bottom:0.75rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">Session Summary Notes</label>' +
        '<textarea id="sess-summary" class="top-search-input" style="width:100%;height:60px" required>Parties presented submissions. Court ordered cross-examination for next hearing session.</textarea>' +
      '</div>' +

      '<div style="margin-bottom:1rem">' +
        '<label style="font-weight:700;display:block;margin-bottom:0.35rem;font-size:0.8rem">Follow-up Hearing Date (if verbally ordered by Judge)</label>' +
        '<input type="date" id="sess-next-date" class="top-search-input" value="2026-06-12"/>' +
      '</div>' +

      '<div style="display:flex;gap:0.5rem">' +
        '<button type="submit" class="btn-clerk-primary" style="flex:1">Save &amp; Publish Session Summary</button>' +
        '<button type="button" class="btn-clerk-outline" style="padding:0.6rem 1rem" onclick="closeClerkModal()">Cancel</button>' +
      '</div>' +
    '</form>';
  openClerkModal();
}

async function handleLogSessionSubmit(e, caseId) {
  e.preventDefault();
  const plaintiffPresent = document.getElementById('sess-plaintiff-pres').checked;
  const defendantPresent = document.getElementById('sess-def-pres').checked;
  const topicsDiscussed = document.getElementById('sess-topics').value.trim();
  const summaryNotes = document.getElementById('sess-summary').value.trim();
  const nextHearingDate = document.getElementById('sess-next-date').value;

  try {
    const res = await fetch(API + '/cases/log-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        plaintiffPresent,
        defendantPresent,
        topicsDiscussed,
        summaryNotes,
        nextHearingDate,
        clerkName: currentClerk.fullName || 'Court Clerk'
      })
    });
    if (res.ok) {
      alert('Hearing session summary recorded and added to chronological case history.');
      closeClerkModal();
      await loadClerkData();
    }
  } catch (err) {
    alert('Error recording session: ' + err.message);
  }
}
