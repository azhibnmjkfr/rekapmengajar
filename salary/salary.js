// ============================================================
// salary.js — Halaman Salary (Success & Pending)
// Rekap Mengajar SIAQ
// ============================================================

// ============================================================
// KONFIG
// ============================================================
const SHEET_ID = '1YBFPTE_TaE5n5FJrmE9RY5i7_ZWdAPVi2cEss-diNy8';

// Deteksi halaman lebih akurat
const PAGE = /pending\.html$/i.test(location.pathname) ? 'pending' : 'success';
const SHEET_NAME = PAGE === 'pending' ? 'FEE_PENDING' : 'FEE_DONE';
const PAGE_TITLE = PAGE === 'pending' ? 'PENDING' : 'SUCCESS';
const HOME_URL = '../index.html';

const CSV_URL =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

// ============================================================
// STATE
// ============================================================
let classesData = [];
let clubData = [];
let classesTotal = 0;
let clubTotal = 0;
let isLoading = true;

// ============================================================
// DOM
// ============================================================
const $ = id => document.getElementById(id);

const pageTitle = $('pageTitle');
const viewHome = $('viewHome');
const viewTable = $('viewTable');
const btnBack = $('btnBack');
const cardClasses = $('cardClasses');
const cardClub = $('cardClub');
const tableTitle = $('tableTitle');
const tableTotal = $('tableTotal');
const tableBody = $('tableBody');
const tableCount = $('tableCount');
const errorBox = $('errorBox');

// Modal detail
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
// HELPER — FORMAT
// ============================================================
function formatRp(value) {
    if (value === '' || value === null || value === undefined) return '-';
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return '-';
    return 'Rp' + num.toLocaleString('id-ID');
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
        // Blok Classes = kolom A:G
        const tglC = r[0] || '', hariC = r[1] || '', kelasC = r[2] || '';
        if (tglC || hariC || kelasC) {
            classesData.push({
                TANGGAL: tglC, HARI: hariC, KELAS: kelasC,
                JP: r[3] || '', STAT: r[4] || '',
                AMOUNT: r[5] || '', TOTAL: r[6] || ''
            });
        }

        // Blok Club = kolom I:O
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
// NAVIGASI VIEW (dengan animasi smooth)
// ============================================================
function fadeSwitch(fromEl, toEl) {
    fromEl.classList.add('view-fade-out');
    setTimeout(() => {
        fromEl.style.display = 'none';
        fromEl.classList.remove('view-fade-out');
        toEl.style.display = 'block';
        toEl.classList.add('view-fade-in');
        setTimeout(() => toEl.classList.remove('view-fade-in'), 400);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
}

function showHome(push = true) {
    pageTitle.textContent = PAGE_TITLE;
    document.title = PAGE_TITLE + ' — Rekap Mengajar SIAQ';

    if (viewTable.style.display !== 'none') {
        fadeSwitch(viewTable, viewHome);
    } else {
        viewHome.style.display = 'block';
        viewTable.style.display = 'none';
    }

    if (push && (!history.state || history.state.view !== 'home')) {
        history.pushState({ view: 'home' }, '', location.pathname);
    }
}

function showTable(type, push = true) {
    const isClasses = type === 'classes';
    const data = isClasses ? classesData : clubData;
    const total = isClasses ? classesTotal : clubTotal;
    const label = isClasses ? 'Classes' : 'Club';

    tableTitle.textContent = label;
    tableTotal.textContent = formatRp(total);
    if (tableCount) tableCount.textContent = data.length + ' data';

    renderTable(data);

    pageTitle.textContent = PAGE_TITLE + ' / ' + label;
    document.title = PAGE_TITLE + ' / ' + label + ' — Rekap Mengajar SIAQ';

    if (viewHome.style.display !== 'none') {
        fadeSwitch(viewHome, viewTable);
    } else {
        viewHome.style.display = 'none';
        viewTable.style.display = 'block';
    }

    if (push) {
        history.pushState({ view: type }, '', '#' + type);
    }
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
                <td class="arrow-cell"><i data-lucide="chevron-right"></i></td>
            </tr>
        `;
    }
    tableBody.innerHTML = html;

    if (typeof lucide !== 'undefined') lucide.createIcons();

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
        return `<span class="stat-badge success"><i data-lucide="check-circle"></i> Success</span>`;
    }
    if (s.includes('🔴') || /pend|pending|belum/i.test(s)) {
        return `<span class="stat-badge pending"><i data-lucide="clock"></i> Pending</span>`;
    }
    return `<span class="stat-badge neutral">${escapeHtml(s) || '-'}</span>`;
}

function openModal(data) {
    modalTanggal.textContent = data.TANGGAL || '-';
    modalHari.textContent    = data.HARI || '-';
    modalKelas.textContent   = data.KELAS || '-';
    modalJp.textContent      = data.JP ? data.JP + ' JP' : '-';
    modalStat.innerHTML      = getStatBadge(data.STAT);
    modalAmount.textContent  = formatRp(data.AMOUNT);
    modalTotal.textContent   = data.TOTAL ? formatRp(data.TOTAL) : '-';

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (!history.state || history.state.view !== 'modal') {
        history.pushState({ view: 'modal' }, '', location.pathname + location.hash);
    }
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

// ============================================================
// ERROR HANDLING
// ============================================================
function showError(message) {
    if (errorBox) {
        errorBox.innerHTML = `
            <div class="error-card">
                <div class="error-icon"><i data-lucide="alert-triangle"></i></div>
                <div class="error-title">Gagal Memuat Data</div>
                <div class="error-desc">${escapeHtml(message)}</div>
                <button class="error-retry" id="errorRetry">
                    <i data-lucide="refresh-cw"></i> Coba Lagi
                </button>
            </div>
        `;
        errorBox.style.display = 'block';
        if (typeof lucide !== 'undefined') lucide.createIcons();

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

    // Loading state
    if (viewHome) viewHome.classList.add('is-loading');

    try {
        const res = await fetch(CSV_URL);
        if (!res.ok) throw new Error('Koneksi ke spreadsheet gagal.');
        const text = await res.text();
        const rows = parseCSV(text);

        if (!rows.length) throw new Error('Data masih kosong di sheet ' + SHEET_NAME + '.');

        extractData(rows);

        isLoading = false;
        if (viewHome) viewHome.classList.remove('is-loading');

        history.replaceState({ view: 'home' }, '', location.pathname);
        showHome(false);

    } catch (err) {
        isLoading = false;
        if (viewHome) viewHome.classList.remove('is-loading');
        console.error(err);

        if (viewHome) viewHome.style.display = 'none';
        showError(err.message || 'Terjadi kesalahan.');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

init();