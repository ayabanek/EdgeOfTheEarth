const PARTNERS = [
    { id: 'kensler', name: 'Dr. Amy Kensler', role: 'Professor' },
    { id: 'ellsworth', name: 'Roald Ellsworth', role: 'Explorer' },
    { id: 'fredericks', name: 'James "Cookie" Fredericks', role: 'Cook' },
    { id: 'takada', name: 'Hiroko Takada', role: 'Mechanic' },
    { id: 'claypool', name: 'Avery Claypool', role: 'Guide' },
    { id: 'sinha', name: 'Dr. Mala Sinha', role: 'Doctor' },
    { id: 'ashevak', name: 'Eliyah Ashevak', role: 'Dog Handler' },
    { id: 'dyer', name: 'William Dyer', role: 'Professor' },
    { id: 'danforth', name: 'Danforth', role: 'Student' }
];

const DEFAULT_STATE = {
    notes: "",
    chaosBag: { frost: 0 },
    partners: PARTNERS.map(p => ({ ...p, status: 'alive' })), // alive, dead, missing
    investigators: [] // { name, xp, physical, mental, status }
};

let state = JSON.parse(localStorage.getItem('eote_campaign_log')) || DEFAULT_STATE;

// Elements
const logDrawer = document.getElementById('campaign-log');
const toggleBtn = document.getElementById('toggle-log');
const notesArea = document.getElementById('campaign-notes');
const partnerList = document.getElementById('partner-list');
const chaosList = document.getElementById('chaos-bag-tracker');

// Init
function init() {
    // Restore notes
    notesArea.value = state.notes || "";

    // Render Partners
    renderPartners();

    // Render Chaos Bag (Frost only for now as per guide focus)
    renderChaosBag();

    // Event Listeners
    toggleBtn.addEventListener('click', () => {
        logDrawer.classList.toggle('hidden');
    });

    document.getElementById('close-log').addEventListener('click', () => {
        logDrawer.classList.add('hidden');
    });

    notesArea.addEventListener('input', (e) => {
        state.notes = e.target.value;
        save();
    });
}

function save() {
    localStorage.setItem('eote_campaign_log', JSON.stringify(state));
}

function renderPartners() {
    partnerList.innerHTML = '';
    state.partners.forEach(p => {
        const div = document.createElement('div');
        div.className = 'partner-item';
        div.innerHTML = `
            <div>
                <strong>${p.name}</strong> <small>(${p.role})</small>
            </div>
            <select onchange="updatePartner('${p.id}', this.value)" style="background:#222; color:#fff; border:1px solid #444;">
                <option value="alive" ${p.status === 'alive' ? 'selected' : ''}>Alive</option>
                <option value="dead" ${p.status === 'dead' ? 'selected' : ''}>Dead</option>
                <option value="insane" ${p.status === 'insane' ? 'selected' : ''}>Insane/Lost</option>
            </select>
        `;
        partnerList.appendChild(div);
    });
}

window.updatePartner = function (id, status) {
    const p = state.partners.find(x => x.id === id);
    if (p) {
        p.status = status;
        save();
    }
};

function renderChaosBag() {
    const frostCount = state.chaosBag.frost || 0;
    document.getElementById('count-frost').innerText = frostCount;
}

window.updateToken = function (type, delta) {
    if (!state.chaosBag[type]) state.chaosBag[type] = 0;
    state.chaosBag[type] += delta;
    if (state.chaosBag[type] < 0) state.chaosBag[type] = 0;
    save();
    renderChaosBag();
};

document.getElementById('reset-campaign').addEventListener('click', () => {
    if (confirm('キャンペーンログをリセットしますか？')) {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        save();
        init();
    }
});

// Run
init();
