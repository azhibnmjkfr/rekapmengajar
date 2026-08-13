// ============================================================
// script.js — Rekap Mengajar SIAQ
// ============================================================

// ============================================================
// LOADING SCREEN - 2 detik
// ============================================================
const loadingScreen = document.getElementById('loadingScreen');
const dashboard = document.getElementById('dashboard');

setTimeout(() => {
    loadingScreen.classList.add('hide');
    dashboard.classList.add('show');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 600);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}, 2000);

// ============================================================
// KONFIG
// ============================================================
const SHEET_ID = '1YBFPTE_TaE5n5FJrmE9RY5i7_ZWdAPVi2cEss-diNy8';
const JADWAL_URL =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=JADWAL`;
const REKAP_URL =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=REKAP`;

// ============================================================
// STATE
// ============================================================
let allJadwal = [];
let allRekap = [];
let currentTab = 'semua';

// ============================================================
// DOM
// ============================================================
const $ = id => document.getElementById(id);
const headerHome = $('headerHome');

const navTabs = $('navTabs');
const semuaContent = $('semuaContent');
const regulerContent = $('regulerContent');
const clubContent = $('clubContent');
const rekapContent = $('rekapContent');

const filterSemua = $('filterSemua');
const filterReguler = $('filterReguler');
const filterClub = $('filterClub');

const resetSemua = $('resetSemua');
const resetReguler = $('resetReguler');
const resetClub = $('resetClub');

const tableSemua = $('tableSemua');
const tableReguler = $('tableReguler');
const tableClub = $('tableClub');

const tableWrapSemua = $('semuaTableWrap');
const tableWrapReguler = $('regulerTableWrap');
const tableWrapClub = $('clubTableWrap');

const emptySemua = $('emptySemua');
const emptyReguler = $('emptyReguler');
const emptyClub = $('emptyClub');

const rekapList = $('rekapList');

const statPertemuan = $('statPertemuan');
const statJam = $('statJam');
const statSudah = $('statSudah');
const statBelum = $('statBelum');

const goTop = $('goTop');

// Modal Detail Jadwal
const modalOverlay = $('modalOverlay');
const modalClose = $('modalClose');
const modalTitle = $('modalTitle');
const modalTanggal = $('modalTanggal');
const modalHari = $('modalHari');
const modalKelas = $('modalKelas');
const modalJam = $('modalJam');
const modalMateri = $('modalMateri');
const modalKeterangan = $('modalKeterangan');

// Profile Modal
const profileTrigger = $('profileTrigger');
const profileModal = $('profileModal');
const profileModalClose = $('profileModalClose');

// ============================================================
// MODAL DETAIL JADWAL
// ============================================================
function openModal(data) {
    modalTitle.innerHTML = `<span class="info-icon"><i data-lucide="info"></i></span> Detail`;
    modalTanggal.textContent = data.TANGGAL || '-';
    modalHari.textContent = data.HARI || '-';
    modalKelas.textContent = data.KELAS || '-';
    modalJam.textContent = data.JAM || '-';
    modalMateri.textContent = data.MATERI || '-';
    modalKeterangan.textContent = data.KETERANGAN || '-';

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ============================================================
// PROFILE MODAL
// ============================================================
function openProfileModal() {
    profileModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    profileModal.classList.remove('open');
    document.body.style.overflow = '';
}

profileTrigger.addEventListener('click', openProfileModal);

profileModalClose.addEventListener('click', closeProfileModal);

profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) closeProfileModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProfileModal();
});

// ============================================================
// HEADER HOME
// ============================================================
headerHome.addEventListener('click', () => {
    navTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    navTabs.querySelector('[data-tab="semua"]').classList.add('active');
    switchTab('semua');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================================
// GO TOP
// ============================================================
window.addEventListener('scroll', () => {
    goTop.classList.toggle('visible', window.scrollY > 300);
});
goTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================================
// PARSE CSV
// ============================================================
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = [];
        let cur = '',
            inQ = false;
        for (const ch of lines[i]) {
            if (ch === '"') inQ = !inQ;
            else if (ch === ',' && !inQ) { cols.push(cur.trim().replace(/^"|"$/g, ''));
                cur = ''; } else cur += ch;
        }
        cols.push(cur.trim().replace(/^"|"$/g, ''));
        if (cols.length < headers.length) continue;
        const obj = {};
        headers.forEach((h, idx) => obj[h] = cols[idx] || '');
        rows.push(obj);
    }
    return rows;
}

// ============================================================
// FETCH
// ============================================================
async function fetchData() {
    const [r1, r2] = await Promise.all([fetch(JADWAL_URL), fetch(REKAP_URL)]);
    if (!r1.ok || !r2.ok) throw new Error('Gagal fetch data');
    const j = parseCSV(await r1.text());
    const re = parseCSV(await r2.text());
    if (!j.length || !re.length) throw new Error('Data kosong');
    return { jadwal: j, rekap: re };
}

// ============================================================
// UPDATE STATISTIK
// ============================================================
function updateStats(jadwal, rekap) {
    const totalP = jadwal.length;
    const totalJ = jadwal.reduce((s, r) => s + (parseFloat(String(r.TOTAL_JAM).replace(/[^0-9.]/g, '')) || 0), 0);
    const totalS = rekap.reduce((s, r) => s + (parseFloat(String(r.SUDAH).replace(/[^0-9.]/g, '')) || 0), 0);
    const totalB = rekap.reduce((s, r) => s + (parseFloat(String(r.BELUM).replace(/[^0-9.]/g, '')) || 0), 0);

    statPertemuan.textContent = totalP;
    statJam.textContent = totalJ;
    statSudah.textContent = totalS;
    statBelum.textContent = totalB;
}

// ============================================================
// RENDER TABLE DENGAN ROW CLICK + ARROW
// ============================================================
function renderTableWithModal(tbody, data) {
    if (!data || !data.length) {
        tbody.innerHTML =
            `<tr><td colspan="5" style="text-align:center;padding:30px 0;color:#6f84a0;">Tidak ada data.</td></tr>`;
        return;
    }

    const sorted = [...data].sort((a, b) => {
        const da = a.TANGGAL ? a.TANGGAL.split('/').reverse().join('') : '';
        const db = b.TANGGAL ? b.TANGGAL.split('/').reverse().join('') : '';
        return db.localeCompare(da);
    });

    let html = '';
    for (const r of sorted) {
        const tag = r.KETERANGAN === 'Club' ? 'tag-club' : 'tag-reguler';
        const dataAttr = JSON.stringify(r).replace(/"/g, '&quot;');
        html += `
                    <tr class="row-clickable" data-row='${dataAttr}'>
                        <td><strong>${r.TANGGAL || '-'}</strong></td>
                        <td>${r.HARI || '-'}</td>
                        <td><span class="tag tag-grade">${r.KELAS || '-'}</span></td>
                        <td>${r.JAM || '-'}</td>
                        <td class="arrow-cell"><i data-lucide="chevron-right"></i></td>
                    </tr>
                `;
    }
    tbody.innerHTML = html;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    tbody.querySelectorAll('.row-clickable').forEach(row => {
        row.addEventListener('click', () => {
            try {
                const data = JSON.parse(row.dataset.row);
                openModal(data);
            } catch (e) {
                console.error('Modal error:', e);
            }
        });
    });
}

// ============================================================
// POPULATE DROPDOWNS
// ============================================================
function populateDropdowns(jadwal) {
    const months = [...new Set(jadwal.map(r => r.PERIODE).filter(Boolean))].sort();

    const selects = [filterSemua, filterReguler, filterClub];
    selects.forEach(select => {
        const currentVal = select.value;
        select.innerHTML = `<option value="">— Pilih Bulan —</option><option value="all">Semua Bulan</option>`;
        for (const m of months) {
            select.innerHTML += `<option value="${m}">${m}</option>`;
        }
        if (currentVal && [...select.options].some(o => o.value === currentVal)) {
            select.value = currentVal;
        }
    });
}

// ============================================================
// FILTER LOGIC
// ============================================================
function applyFilter(tab) {
    const selectMap = {
        'semua': filterSemua,
        'reguler': filterReguler,
        'club': filterClub
    };
    const tableWrapMap = {
        'semua': tableWrapSemua,
        'reguler': tableWrapReguler,
        'club': tableWrapClub
    };
    const emptyMap = {
        'semua': emptySemua,
        'reguler': emptyReguler,
        'club': emptyClub
    };
    const tableMap = {
        'semua': tableSemua,
        'reguler': tableReguler,
        'club': tableClub
    };

    const select = selectMap[tab];
    const tableWrap = tableWrapMap[tab];
    const empty = emptyMap[tab];
    const tbody = tableMap[tab];

    const selectedMonth = select.value;

    if (!selectedMonth) {
        tableWrap.classList.add('hidden-table');
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    let filtered = [...allJadwal];
    if (tab === 'reguler') {
        filtered = filtered.filter(r => r.KETERANGAN === 'Reguler');
    } else if (tab === 'club') {
        filtered = filtered.filter(r => r.KETERANGAN === 'Club');
    }

    if (selectedMonth !== 'all') {
        filtered = filtered.filter(r => r.PERIODE === selectedMonth);
    }

    tableWrap.classList.remove('hidden-table');
    renderTableWithModal(tbody, filtered);
}

function resetFilter(tab) {
    const selectMap = {
        'semua': filterSemua,
        'reguler': filterReguler,
        'club': filterClub
    };
    const tableWrapMap = {
        'semua': tableWrapSemua,
        'reguler': tableWrapReguler,
        'club': tableWrapClub
    };
    const emptyMap = {
        'semua': emptySemua,
        'reguler': emptyReguler,
        'club': emptyClub
    };

    const select = selectMap[tab];
    select.value = '';
    tableWrapMap[tab].classList.add('hidden-table');
    emptyMap[tab].style.display = 'block';
}

// ============================================================
// RENDER REKAP
// ============================================================
function renderRekap(rekap) {
    let html = '';
    for (const r of rekap) {
        const p = r.PERIODE || 'Tanpa Periode';
        const total = parseFloat(String(r.TOTAL_JAM).replace(/[^0-9.]/g, '')) || 0;
        const reguler = parseFloat(String(r.REGULER).replace(/[^0-9.]/g, '')) || 0;
        const club = parseFloat(String(r.CLUB).replace(/[^0-9.]/g, '')) || 0;
        const sudah = parseFloat(String(r.SUDAH).replace(/[^0-9.]/g, '')) || 0;
        const belum = parseFloat(String(r.BELUM).replace(/[^0-9.]/g, '')) || 0;

        html += `
                    <div class="rekap-card">
                        <div class="rekap-left">
                            <span class="rekap-name">${p}</span>
                            <span class="rekap-total">${total} <small>jam</small></span>
                        </div>
                        <div class="rekap-detail">
                            <span>Reguler ${reguler}</span>
                            <span>Club ${club}</span>
                            <span class="status-badge green">🟢 ${sudah}</span>
                            <span class="status-badge red">🔴 ${belum}</span>
                        </div>
                    </div>
                `;
    }
    rekapList.innerHTML = html ||
        '<p style="text-align:center;color:#6f84a0;padding:30px 0;">Belum ada data rekap</p>';
}

// ============================================================
// SWITCH TAB
// ============================================================
function switchTab(tab) {
    currentTab = tab;
    semuaContent.style.display = 'none';
    regulerContent.style.display = 'none';
    clubContent.style.display = 'none';
    rekapContent.style.display = 'none';

    if (tab === 'semua') {
        semuaContent.style.display = 'block';
        applyFilter('semua');
    } else if (tab === 'reguler') {
        regulerContent.style.display = 'block';
        applyFilter('reguler');
    } else if (tab === 'club') {
        clubContent.style.display = 'block';
        applyFilter('club');
    } else if (tab === 'rekap') {
        rekapContent.style.display = 'block';
        renderRekap(allRekap);
    }

    navTabs.querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
}

// ============================================================
// INIT
// ============================================================
async function init() {
    try {
        const { jadwal, rekap } = await fetchData();
        allJadwal = jadwal;
        allRekap = rekap;

        updateStats(jadwal, rekap);
        populateDropdowns(jadwal);

        filterSemua.addEventListener('change', () => applyFilter('semua'));
        filterReguler.addEventListener('change', () => applyFilter('reguler'));
        filterClub.addEventListener('change', () => applyFilter('club'));

        resetSemua.addEventListener('click', () => resetFilter('semua'));
        resetReguler.addEventListener('click', () => resetFilter('reguler'));
        resetClub.addEventListener('click', () => resetFilter('club'));

        navTabs.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        emptySemua.style.display = 'block';
        emptyReguler.style.display = 'block';
        emptyClub.style.display = 'block';

        switchTab('semua');
    } catch (err) {
        document.querySelectorAll('tbody').forEach(t => {
            t.innerHTML =
                `<tr><td colspan="5"><div class="error-msg">Gagal memuat data.<br/><span style="font-size:12px;">${err.message}</span><br/><span style="font-size:12px;">Pastikan spreadsheet sudah dipublikasikan.</span></div></td></tr>`;
        });
        console.error(err);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

init();