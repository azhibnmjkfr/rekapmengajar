// ============================================================
// salary.js — Halaman Salary (Success & Pending)
// Optimized · Smooth · Print-ready
// ============================================================

// ============================================================
// KONFIG
// ============================================================
const SHEET_ID = '1YBFPTE_TaE5n5FJrmE9RY5i7_ZWdAPVi2cEss-diNy8';

const PAGE = /pending\.html$/i.test(location.pathname) ? 'pending' : 'success';
const SHEET_NAME = PAGE === 'pending' ? 'FEE_PENDING' : 'FEE_DONE';
const PAGE_TITLE = PAGE === 'pending' ? 'PENDING' : 'SUCCESS';
const HOME_URL = '../index.html';
const IS_PENDING = PAGE === 'pending';

const CSV_URL =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

// ============================================================
// STATE
// ============================================================
let classesData = [];
let clubData = [];
let classesTotal = 0;
let clubTotal = 0;
let currentView = 'home'; // 'home' | 'classes' | 'club'

// ============================================================
// DOM
// ============================================================
const $ = id => document.getElementById(id);

const pageTitle = $('pageTitle');
const viewHome = $('viewHome');
const viewTable = $('viewTable');
const btnBack = $('btnBack');
const btnPrint = $('btnPrint');
const cardClasses = $('cardClasses');
const cardClub = $('cardClub');
const tableTitle = $('tableTitle');
const tableTotal = $('tableTotal');
const tableBody = $('tableBody');
const tableCount = $('tableCount');
const errorBox = $('errorBox');
const printArea = $('printArea');

const modalOverlay = $('modalOverlay');
const modalClose = $('modalClose');
const modalTanggal = $('modalTanggal');
const modalHari = $('modalHari');
const modalKelas = $('modalKelas');
const modalJp = $('modalJp');
const modalStat = $('modalStat');
const modalAmount = $('modalAmount');
const modalTotal = $('modalTotal');

// ============================================================
// SVG INLINE — back & chevron
// ============================================================
const SVG_CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;

// ============================================================
// HELPER — FORMAT
// ============================================================
function formatRupiahShort(value) {
    if (value === '' || value === null || value === undefined) return '-';
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (isNaN(num) || num === 0) return '-';
    return 'Rp' + Math.round(num / 1000) + 'K';
}

function clean(str) {
    return (str || '').trim().replace(/^"|"$/g, '');
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================
// PARSER CSV
// ============================================================
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = [];
        let cur = '', inQ = false;
        for (const ch of lines[i]) {
            if (ch === '"') inQ = !inQ;
            else if (ch === ',' && !inQ) {
                cols.push(clean(cur));
                cur = '';
            } else cur += ch;
        }
        cols.push(clean(cur));
        rows.push(cols);
    }
    return rows;
}

// ============================================================
// EKSTRAK DATA
// ============================================================
function extractData(rows) {
    classesData = [];
    clubData = [];

    if (rows[0]) {
        classesTotal = parseFloat(String(rows[0][6]).replace(/[^0-9.-]/g, '')) || 0;
        clubTotal    = parseFloat(String(rows[0][14]).replace(/[^0-9.-]/g, '')) || 0;
    }

    for (const r of rows) {
        const tglC = r[0] || '', hariC = r[1] || '', kelasC = r[2] || '';
        if (tglC || hariC || kelasC) {
            classesData.push({
                TANGGAL: tglC, HARI: hariC, KELAS: kelasC,
                JP: r[3] || '', STAT: r[4] || '',
                AMOUNT: r[5] || '', TOTAL: r[6] || ''
            });
        }

        const tglK = r[8] || '', hariK = r[9] || '', kelasK = r[10] || '';
        if (tglK || hariK || kelasK) {
            clubData.push({
                TANGGAL: tglK, HARI: hariK, KELAS: kelasK,
                JP: r[11] || '', STAT: r[12] || '',
                AMOUNT: r[13] || '', TOTAL: r[14] || ''
            });
        }
    }
}

// ============================================================
// NAVIGASI VIEW
// ============================================================
function showHome(push = true) {
    currentView = 'home';
    pageTitle.textContent = PAGE_TITLE;
    document.title = PAGE_TITLE + ' — Rekap Mengajar SIAQ';
    if (btnPrint) btnPrint.classList.remove('visible');

    viewTable.style.display = 'none';
    viewHome.style.display = 'block';
    viewHome.classList.remove('view-fade-in');
    void viewHome.offsetWidth;
    viewHome.classList.add('view-fade-in');

    if (push && (!history.state || history.state.view !== 'home')) {
        history.pushState({ view: 'home' }, '', location.pathname);
    }
}

function showTable(type, push = true) {
    currentView = type;
    const isClasses = type === 'classes';
    const data = isClasses ? classesData : clubData;
    const total = isClasses ? classesTotal : clubTotal;
    const label = isClasses ? 'Classes' : 'Club';

    tableTitle.textContent = label;
    tableTotal.textContent = formatRupiahShort(total);
    if (tableCount) tableCount.textContent = data.length + ' data';

    renderTable(data);

    pageTitle.textContent = PAGE_TITLE + ' / ' + label;
    document.title = PAGE_TITLE + ' / ' + label + ' — Rekap Mengajar SIAQ';

    // Tombol print: hanya di halaman pending
    if (btnPrint && IS_PENDING) {
        btnPrint.classList.add('visible');
    }

    viewHome.style.display = 'none';
    viewTable.style.display = 'block';
    viewTable.classList.remove('view-fade-in');
    void viewTable.offsetWidth;
    viewTable.classList.add('view-fade-in');

    if (push) {
        history.pushState({ view: type }, '', '#' + type);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// RENDER TABEL
// ============================================================
function renderTable(data) {
    if (!data || !data.length) {
        tableBody.innerHTML =
            `<tr><td colspan="4" style="text-align:center;padding:40px 0;color:#94a3b8;font-size:13px;">Tidak ada data.</td></tr>`;
        return;
    }

    let html = '';
    for (const r of data) {
        const dataAttr = escapeHtml(JSON.stringify(r));
        html += `
            <tr class="row-clickable" data-row='${dataAttr}'>
                <td><strong>${escapeHtml(r.TANGGAL) || '-'}</strong></td>
                <td>${escapeHtml(r.HARI) || '-'}</td>
                <td><span class="tag tag-grade">${escapeHtml(r.KELAS) || '-'}</span></td>
                <td class="arrow-cell">${SVG_CHEVRON}</td>
            </tr>
        `;
    }
    tableBody.innerHTML = html;

    tableBody.querySelectorAll('.row-clickable').forEach(row => {
        row.addEventListener('click', () => {
            try {
                const data = JSON.parse(row.dataset.row.replace(/&quot;/g, '"'));
                openModal(data);
            } catch (e) {
                console.error('Modal error:', e);
            }
        });
    });
}

// ============================================================
// MODAL DETAIL
// ============================================================
function getStatBadge(stat) {
    const s = String(stat || '').trim();
    if (s.includes('🟢') || /succ|ok|done|selesai/i.test(s)) {
        return `<span class="stat-badge success">Success</span>`;
    }
    if (s.includes('🔴') || /pend|pending|belum/i.test(s)) {
        return `<span class="stat-badge pending">Pending</span>`;
    }
    return `<span class="stat-badge neutral">${escapeHtml(s) || '-'}</span>`;
}

function openModal(data) {
    modalTanggal.textContent = data.TANGGAL || '-';
    modalHari.textContent    = data.HARI || '-';
    modalKelas.textContent   = data.KELAS || '-';
    modalJp.textContent      = data.JP ? data.JP + ' JP' : '-';
    modalStat.innerHTML      = getStatBadge(data.STAT);
    modalAmount.textContent  = formatRupiahShort(data.AMOUNT);
    modalTotal.textContent   = data.TOTAL ? formatRupiahShort(data.TOTAL) : '-';

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (!history.state || history.state.view !== 'modal') {
        history.pushState({ view: 'modal' }, '', location.pathname + location.hash);
    }
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================================
// PRINT — bangun area print, lalu window.print()
// ============================================================
function buildPrintArea() {
    if (!printArea) return;

    const isClasses = currentView === 'classes';
    const data = isClasses ? classesData : clubData;
    const total = isClasses ? classesTotal : clubTotal;
    const label = isClasses ? 'Classes' : 'Club';

    const today = new Date();
    const tanggalCetak = today.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    // Bangun baris tabel
    let rowsHtml = '';
    for (const r of data) {
        const jp = parseFloat(String(r.JP).replace(/[^0-9.-]/g, '')) || 0;
        const amount = parseFloat(String(r.AMOUNT).replace(/[^0-9.-]/g, '')) || 0;
        const lineTotal = jp * amount;

        rowsHtml += `
            <tr>
                <td>${escapeHtml(r.TANGGAL)}</td>
                <td>${escapeHtml(r.HARI)}</td>
                <td>${escapeHtml(r.KELAS)}</td>
                <td>${jp || '-'}</td>
                <td>${formatRupiahShort(r.AMOUNT)}</td>
                <td>${lineTotal ? formatRupiahShort(lineTotal) : '-'}</td>
            </tr>
        `;
    }

    printArea.innerHTML = `
        <div class="print-title">REKAP FEE ${escapeHtml(PAGE_TITLE)}</div>
        <div class="print-subtitle">Sekolah Islam Akhlaqul Quran</div>
        <div class="print-subtitle">Ahmad Zaman Huri</div>
        <div class="print-meta">Kategori: ${escapeHtml(label)} &nbsp;·&nbsp; Dicetak: ${tanggalCetak}</div>
        <div class="print-divider"></div>
        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>Hari</th>
                    <th>Kelas</th>
                    <th>JP</th>
                    <th>Amount</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml || '<tr><td colspan="6" style="text-align:center;">Tidak ada data.</td></tr>'}
            </tbody>
        </table>
        <div class="print-summary">
            <span class="print-summary-label">Jumlah: ${data.length} pertemuan</span>
            <span class="print-summary-value">TOTAL: ${formatRupiahShort(total)}</span>
        </div>
    `;
}

function handlePrint() {
    if (currentView !== 'classes' && currentView !== 'club') return;
    buildPrintArea();
    // Beri waktu browser render area print, lalu panggil print
    setTimeout(() => window.print(), 50);
}

// ============================================================
// ERROR HANDLING
// ============================================================
function showError(message) {
    if (errorBox) {
        errorBox.innerHTML = `
            <div class="error-card">
                <div class="error-title">Gagal Memuat Data</div>
                <div class="error-desc">${escapeHtml(message)}</div>
                <button class="error-retry" id="errorRetry">Coba Lagi</button>
            </div>
        `;
        errorBox.style.display = 'block';

        const retry = $('errorRetry');
        if (retry) retry.addEventListener('click', () => location.reload());
    } else {
        console.error('Error:', message);
    }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
cardClasses.addEventListener('click', () => showTable('classes'));
cardClub.addEventListener('click', () => showTable('club'));

btnBack.addEventListener('click', () => {
    if (history.state && history.state.view !== 'home') {
        history.back();
    } else {
        location.href = HOME_URL;
    }
});

if (btnPrint) {
    btnPrint.addEventListener('click', handlePrint);
}

modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ============================================================
// HISTORY (back & swipe back)
// ============================================================
window.addEventListener('popstate', (e) => {
    const state = e.state || { view: 'home' };

    if (state.view === 'home') {
        closeModal();
        showHome(false);
    } else if (state.view === 'classes' || state.view === 'club') {
        closeModal();
        showTable(state.view, false);
    } else if (state.view === 'modal') {
        closeModal();
    }
});

// ============================================================
// INIT
// ============================================================
async function init() {
    pageTitle.textContent = PAGE_TITLE;
    document.title = PAGE_TITLE + ' — Rekap Mengajar SIAQ';

    try {
        const res = await fetch(CSV_URL);
        if (!res.ok) throw new Error('Koneksi ke spreadsheet gagal.');
        const text = await res.text();
        const rows = parseCSV(text);

        if (!rows.length) throw new Error('Data masih kosong di sheet ' + SHEET_NAME + '.');

        extractData(rows);

        history.replaceState({ view: 'home' }, '', location.pathname);
        showHome(false);

    } catch (err) {
        console.error(err);
        viewHome.style.display = 'none';
        showError(err.message || 'Terjadi kesalahan.');
    }
}

init();
