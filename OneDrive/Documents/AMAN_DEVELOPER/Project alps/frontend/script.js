// ─────────────────────────────────────────────────────────────────────────────
//  GateHub — Frontend Script v3
// ─────────────────────────────────────────────────────────────────────────────

// const API_BASE = 'http://localhost:5000/api';
const API_BASE = 'https://gatehub-backend.onrender.com/api';

let state = {
    user:             JSON.parse(localStorage.getItem('user'))  || null,
    token:            localStorage.getItem('token')             || null,
    vault:            JSON.parse(localStorage.getItem('vault')) || [],
    currentView:      'home',
    currentBranch:    'All',
    authMode:         'student',
    isLogin:          true,
    selectedFile:     null,
    currentSubjectId: null,
    assetCountCache:  {},
    subjects:         [],
};

const authHeader = () => ({ 'Authorization': `Bearer ${state.token}` });

async function apiRequest(path, options = {}) {
    const res  = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

async function apiRegister(name, email, password) {
    return apiRequest('/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
    });
}

async function apiLogin(email, password) {
    return apiRequest('/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
    });
}

async function apiFetchSubjects(branch) {
    const query = branch && branch !== 'All' ? `?branch=${encodeURIComponent(branch)}` : '';
    const data  = await apiRequest(`/subjects${query}`);
    return data.subjects;
}

async function apiCreateSubject(subjectData) {
    return apiRequest('/subjects', {
        method:  'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body:    JSON.stringify(subjectData),
    });
}

async function apiDeleteSubject(id) {
    return apiRequest(`/subjects/${id}`, {
        method:  'DELETE',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
    });
}

async function apiFetchFiles(subjectId) {
    const data = await apiRequest(`/files/${subjectId}`);
    return data.files;
}

async function apiUploadFile(subjectId, displayName, fileObj) {
    const form = new FormData();
    form.append('file',      fileObj);
    form.append('subjectId', subjectId);
    if (displayName) form.append('name', displayName);
    return apiRequest('/files/upload', {
        method:  'POST',
        headers: authHeader(),
        body:    form,
    });
}

async function apiDeleteFile(fileId) {
    return apiRequest(`/files/${fileId}`, {
        method:  'DELETE',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  APP
// ─────────────────────────────────────────────────────────────────────────────
const app = {
    getAllSubjects: () => state.subjects,

    setBranch: (branch) => {
        state.currentBranch = branch;
        document.querySelectorAll('.branch-chip').forEach(btn => {
            const isAll      = branch === 'All' && btn.textContent.trim() === 'All Streams';
            const isSpecific = btn.textContent.includes(branch) && branch !== 'All';
            btn.classList.toggle('active', isAll || isSpecific);
        });
        app.fetchSubjects();
    },

    setAuthMode: (mode) => {
        state.authMode = mode;
        state.isLogin  = true;
        document.getElementById('tab-student').classList.toggle('active', mode === 'student');
        document.getElementById('tab-admin').classList.toggle('active',   mode === 'admin');
        const title     = document.getElementById('auth-title');
        const subtitle  = document.getElementById('auth-subtitle');
        const toggleBtn = document.getElementById('auth-toggle');
        const icon      = document.getElementById('auth-main-icon');
        document.getElementById('name-field').classList.add('hidden');
        if (mode === 'admin') {
            title.textContent    = 'Admin Gateway';
            subtitle.textContent = 'Management verification';
            toggleBtn.classList.add('hidden');
            icon.setAttribute('data-lucide', 'shield-check');
        } else {
            title.textContent    = 'Welcome Student';
            subtitle.textContent = 'Access your repository';
            toggleBtn.classList.remove('hidden');
            toggleBtn.textContent = 'Need an account? Sign up';
            icon.setAttribute('data-lucide', 'user');
        }
        lucide.createIcons();
    },

    searchSubjects: (query) => {
        if (state.currentView !== 'home') router.navigate('home');
        const q        = query.toLowerCase();
        const filtered = state.subjects.filter(s => {
            const matchesName   = s.name.toLowerCase().includes(q);
            const matchesBranch = state.currentBranch === 'All'
                ? (s.isMain || matchesName)
                : s.branch === state.currentBranch;
            return matchesName && matchesBranch;
        });
        app.renderSubjects(filtered);
    },

    renderSubjects: (data) => {
        const grid = document.getElementById('subjects-grid');
        if (data.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-20 text-center font-black text-slate-300 uppercase tracking-widest text-xs">No hubs found.</div>`;
            return;
        }
        grid.innerHTML = data.map(subj => {
            const assetCount = state.assetCountCache[subj._id] ?? '…';
            return `
            <div class="subject-card ${subj.theme} bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer group"
                 onclick="router.navigate('files', {id: '${subj._id}'})">
                <div class="flex justify-between items-start mb-6 md:mb-8">
                    <div class="w-12 h-12 md:w-14 md:h-14 bg-[var(--b-bg)] rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="${subj.icon || 'book'}" style="color: var(--b-clr)" class="w-6 h-6 md:w-7 md:h-7"></i>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[7px] md:text-[8px] uppercase tracking-[0.2em] font-black px-3 py-1.5 rounded-full bg-[var(--b-bg)]" style="color: var(--b-clr)">${subj.branch}</span>
                        ${state.user?.role === 'admin' ? `
                        <button onclick="event.stopPropagation(); app.deleteSubject('${subj._id}')"
                                class="w-6 h-6 rounded-full bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                            <i data-lucide="x" class="w-3 h-3"></i>
                        </button>` : ''}
                    </div>
                </div>
                <h3 class="text-lg md:text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight tracking-tight">
                    ${subj.name}
                </h3>
                <p class="text-slate-400 text-xs md:text-sm mt-3 md:mt-4 font-medium line-clamp-2 leading-relaxed">${subj.description}</p>
                <div class="mt-8 md:mt-10 pt-5 md:pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div class="flex items-center text-slate-900 font-black text-[9px] md:text-[10px] uppercase tracking-widest">
                        <i data-lucide="files" class="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 text-slate-200"></i>
                        <span id="asset-count-${subj._id}">${assetCount} Assets</span>
                    </div>
                    <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <i data-lucide="arrow-right" class="w-3.5 h-3.5 md:w-4 md:h-4"></i>
                    </div>
                </div>
            </div>`;
        }).join('');
        lucide.createIcons();
        data.forEach(subj => {
            if (state.assetCountCache[subj._id] !== undefined) return;
            apiFetchFiles(subj._id).then(files => {
                state.assetCountCache[subj._id] = files.length;
                const el = document.getElementById(`asset-count-${subj._id}`);
                if (el) el.textContent = `${files.length} Assets`;
            }).catch(() => {});
        });
    },

    fetchSubjects: async () => {
        ui.setLoading(true);
        try {
            const all = await apiFetchSubjects(state.currentBranch);
            state.subjects = all;
            const data = state.currentBranch === 'All' ? all.filter(s => s.isMain) : all;
            app.renderSubjects(data);
        } catch (err) {
            document.getElementById('subjects-grid').innerHTML =
                `<div class="col-span-full py-10 text-center text-rose-400 font-bold text-sm">Failed to load subjects. Is the backend running?</div>`;
        }
        ui.setLoading(false);
    },

    fetchFiles: async (subjId) => {
        ui.setLoading(true);
        state.currentSubjectId = subjId;
        const subject = state.subjects.find(s => s._id === subjId);
        document.getElementById('current-subject-title').textContent = subject?.name || 'Hub Details';
        document.getElementById('current-subject-desc').textContent  = subject?.description || '';
        document.getElementById('file-branch-tag').textContent       = subject?.branch || 'General';
        const list = document.getElementById('files-list');
        try {
            const files = await apiFetchFiles(subjId);
            state.assetCountCache[subjId] = files.length;
            if (files.length === 0) {
                list.innerHTML = `
                    <div class="bg-white/50 border-2 border-dashed border-slate-200 p-10 rounded-[2rem] text-center">
                        <i data-lucide="folder-open" class="w-10 h-10 text-slate-300 mx-auto mb-4"></i>
                        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No resources available yet</p>
                    </div>`;
            } else {
                list.innerHTML = files.map(file => `
                    <div class="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between hover:border-indigo-200 transition-all group gap-4">
                        <div class="flex items-center w-full">
                            <div class="bg-slate-50 p-4 md:p-5 rounded-xl md:rounded-2xl mr-4 md:mr-6 group-hover:bg-indigo-600 transition-colors">
                                <i data-lucide="file-text" class="text-slate-300 w-6 h-6 md:w-7 md:h-7 group-hover:text-white transition-colors"></i>
                            </div>
                            <div class="truncate">
                                <h4 class="font-black text-slate-900 text-base md:text-lg tracking-tight truncate">${file.name}</h4>
                                <div class="flex items-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 md:mt-2">
                                    <span class="mr-3 md:mr-4 text-indigo-500">${file.type}</span>
                                    <span>${file.size}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                            <button onclick='app.downloadToVault("${subjId}", ${JSON.stringify(file).replace(/'/g, "&#39;")})'
                                    class="px-5 py-3 bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center">
                                <i data-lucide="download" class="w-4 h-4 mr-2"></i> Download
                            </button>
                            <a href="${file.url}" target="_blank"
                               class="px-6 py-3 brand-gradient text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg text-center flex items-center justify-center">
                                <i data-lucide="eye" class="w-4 h-4 mr-2"></i> View
                            </a>
                            ${state.user?.role === 'admin' ? `
                            <button onclick="app.deleteFile('${file._id}', '${subjId}')"
                                    class="px-4 py-3 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>` : ''}
                        </div>
                    </div>`).join('');
            }
        } catch (err) {
            list.innerHTML = `
                <div class="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] text-center">
                    <p class="text-rose-400 font-bold text-sm">Failed to load resources.</p>
                    <p class="text-rose-300 text-xs mt-2">${err.message}</p>
                </div>`;
        }
        lucide.createIcons();
        ui.setLoading(false);
    },

    downloadToVault: async (subjId, fileObj) => {
        const subject = state.subjects.find(s => s._id === subjId);
        const exists  = state.vault.find(v => v.url === fileObj.url);
        if (!exists) {
            state.vault.unshift({
                subjId,
                subjName:  subject?.name || subjId,
                branch:    subject?.branch || 'General',
                fileName:  fileObj.name,
                url:       fileObj.url,
                timestamp: Date.now(),
            });
            localStorage.setItem('vault', JSON.stringify(state.vault));
        }
        try {
            ui.setLoading(true);
            const response = await fetch(fileObj.url);
            const blob     = await response.blob();
            const blobUrl  = URL.createObjectURL(blob);
            const link     = document.createElement('a');
            link.href      = blobUrl;
            link.download  = fileObj.name || 'document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            ui.setLoading(false);
        } catch (err) {
            ui.setLoading(false);
            const link  = document.createElement('a');
            link.href   = fileObj.url;
            link.target = '_blank';
            link.click();
        }
    },

    deleteFile: async (fileId, subjId) => {
        if (!confirm('Remove this resource from the hub?')) return;
        try {
            await apiDeleteFile(fileId);
            delete state.assetCountCache[subjId];
            app.fetchFiles(subjId);
        } catch (err) { alert(`Delete failed: ${err.message}`); }
    },

    createSubject: async () => {
        const name   = document.getElementById('new-subj-name').value.trim();
        const branch = document.getElementById('new-subj-branch').value;
        const desc   = document.getElementById('new-subj-desc')?.value.trim() || '';
        if (!name) return alert('Please enter a subject name.');
        if (!state.token) return alert('Please log in as admin first.');
        const _id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '').slice(0, 20) + '_' + Date.now().toString().slice(-4);
        ui.setLoading(true);
        try {
            await apiCreateSubject({ _id, name, branch, description: desc });
            state.assetCountCache = {};
            ui.hideModal(); ui.setLoading(false); app.fetchSubjects();
        } catch (err) { ui.setLoading(false); alert(`Failed: ${err.message}`); }
    },

    deleteSubject: async (id) => {
        if (!confirm('Remove this subject hub?')) return;
        try {
            await apiDeleteSubject(id);
            state.assetCountCache = {};
            app.fetchSubjects();
        } catch (err) { alert(`Delete failed: ${err.message}`); }
    },

    handleFileSelection: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const sizeMB = file.size / 1024 / 1024;
        const info   = document.getElementById('file-info');
        if (sizeMB > 50) {
            info.innerHTML = `⚠️ File is <b>${sizeMB.toFixed(1)} MB</b> — too large (max 50 MB).<br>
                <span class="text-amber-600">Upload to Google Drive and use <b>Add Link</b> tab instead.</span>`;
            info.classList.remove('hidden');
            state.selectedFile = null;
        } else {
            state.selectedFile = file;
            info.textContent = `✅ Selected: ${file.name} (${sizeMB.toFixed(2)} MB)`;
            info.classList.remove('hidden');
        }
    },

    uploadFile: async () => {
        if (!state.selectedFile)     return alert('Please select a file first (max 50 MB).');
        if (!state.currentSubjectId) return alert('No subject selected.');
        if (!state.token)            return alert('Please log in as admin first.');
        ui.setLoading(true);
        try {
            const result = await apiUploadFile(
                state.currentSubjectId,
                state.selectedFile.name,
                state.selectedFile
            );
            delete state.assetCountCache[state.currentSubjectId];
            state.selectedFile = null;
            document.getElementById('file-info').classList.add('hidden');
            ui.hideModal();
            ui.setLoading(false);
            app.fetchFiles(state.currentSubjectId);
            if (result.warning) {
                setTimeout(() => alert(`${result.warning}\n\nGo to supabase.com and create a new project when ready.`), 500);
            }
        } catch (err) {
            ui.setLoading(false);
            alert(`Upload failed: ${err.message}`);
        }
    },

    switchUploadTab: (tab) => {
        const uploadPanel = document.getElementById('panel-upload');
        const linkPanel   = document.getElementById('panel-link');
        const uploadTab   = document.getElementById('tab-upload');
        const linkTab     = document.getElementById('tab-link');
        if (tab === 'upload') {
            uploadPanel.classList.remove('hidden'); linkPanel.classList.add('hidden');
            uploadTab.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
            uploadTab.classList.remove('text-slate-400');
            linkTab.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
            linkTab.classList.add('text-slate-400');
        } else {
            linkPanel.classList.remove('hidden'); uploadPanel.classList.add('hidden');
            linkTab.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
            linkTab.classList.remove('text-slate-400');
            uploadTab.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
            uploadTab.classList.add('text-slate-400');
        }
    },

    saveLink: async () => {
        const name = document.getElementById('link-name').value.trim();
        const url  = document.getElementById('link-url').value.trim();
        const size = document.getElementById('link-size').value.trim();
        if (!name) return alert('Please enter a file name.');
        if (!url)  return alert('Please paste a URL.');
        if (!state.currentSubjectId) return alert('No subject selected.');
        if (!state.token) return alert('Please log in as admin first.');
        ui.setLoading(true);
        try {
            await apiRequest('/files/link', {
                method:  'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjectId: state.currentSubjectId,
                    name, url,
                    type: url.includes('drive.google.com') ? 'Google Drive' : 'External',
                    size: size || 'Cloud Access',
                }),
            });
            document.getElementById('link-name').value = '';
            document.getElementById('link-url').value  = '';
            document.getElementById('link-size').value = '';
            delete state.assetCountCache[state.currentSubjectId];
            ui.hideModal(); ui.setLoading(false);
            app.fetchFiles(state.currentSubjectId);
        } catch (err) {
            ui.setLoading(false);
            alert(`Failed to save link: ${err.message}`);
        }
    },

    checkStorageBanner: async () => {
        if (state.user?.role !== 'admin') return;
        try {
            const data = await apiRequest('/files/storage-status', { headers: authHeader() });
            document.getElementById('storage-banner')?.remove();
            if (data.warning) {
                const banner = document.createElement('div');
                banner.id    = 'storage-banner';
                const bgColor     = data.critical ? '#FEE2E2' : '#FEF3C7';
                const textColor   = data.critical ? '#991B1B' : '#92400E';
                const borderColor = data.critical ? '#FCA5A5' : '#FCD34D';
                const emoji       = data.critical ? '🚨' : '⚠️';
                const msg         = data.critical
                    ? `Storage Critical: ${data.usedMB} MB / 1000 MB used. Create new Supabase account NOW.`
                    : `Storage Warning: ${data.usedMB} MB / 1000 MB used. Create new Supabase account soon.`;
                banner.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:9999;background:${bgColor};border-bottom:2px solid ${borderColor};padding:10px 20px;display:flex;align-items:center;justify-content:space-between;font-family:inherit;`;
                banner.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:18px;">${emoji}</span>
                        <span style="font-size:13px;font-weight:700;color:${textColor};">${msg}</span>
                    </div>
                    <button onclick="document.getElementById('storage-banner').remove()"
                            style="background:none;border:none;cursor:pointer;font-size:18px;color:${textColor};padding:0;">×</button>`;
                document.body.prepend(banner);
            }
        } catch (err) {}
    },

    renderOfflineFiles: () => {
        const list = document.getElementById('offline-files-list');
        if (state.vault.length === 0) {
            list.innerHTML = `
                <div class="col-span-full py-20 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
                    <i data-lucide="package-open" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                    <h3 class="text-xl font-black text-slate-900 mb-2">Your Vault is Empty</h3>
                    <p class="text-slate-400 font-medium max-w-xs mx-auto text-sm">Download materials to sync them here.</p>
                    <button onclick="router.navigate('home')" class="mt-8 px-8 py-3 brand-gradient text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Explore Library</button>
                </div>`;
            lucide.createIcons(); return;
        }
        list.innerHTML = state.vault.map((v, idx) => `
            <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                <div class="flex items-start justify-between mb-6">
                    <div class="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <i data-lucide="file-text" class="w-6 h-6"></i>
                    </div>
                    <button onclick="app.removeFromVault(${idx})" class="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="mb-6">
                    <span class="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1 block">${v.branch} Hub</span>
                    <h4 class="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-1">${v.fileName}</h4>
                    <p class="text-xs text-slate-400 font-medium mt-1">${v.subjName}</p>
                </div>
                <a href="${v.url}" target="_blank"
                   class="w-full py-3.5 bg-slate-50 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all">
                    Open from Vault
                </a>
            </div>`).join('');
        lucide.createIcons();
    },

    removeFromVault: (idx) => {
        state.vault.splice(idx, 1);
        localStorage.setItem('vault', JSON.stringify(state.vault));
        app.renderOfflineFiles();
    },

    clearVault: () => {
        state.vault = []; localStorage.removeItem('vault'); app.renderOfflineFiles();
    },

    logout: () => {
        localStorage.clear();
        state.user = null; state.token = null; state.vault = [];
        router.navigate('home');
    },
};

// ─────────────────────────────────────────────────────────────────────────────
//  UI
// ─────────────────────────────────────────────────────────────────────────────
const ui = {
    toggleMobileSearch: (show) => {
        const overlay = document.getElementById('mobile-search-overlay');
        const logo    = document.getElementById('nav-logo');
        const actions = document.getElementById('nav-actions');
        if (show) {
            overlay.classList.remove('hidden'); overlay.classList.add('active');
            logo.classList.add('invisible');    actions.classList.add('invisible');
            document.getElementById('mobile-search-input').focus();
        } else {
            overlay.classList.add('hidden');    overlay.classList.remove('active');
            logo.classList.remove('invisible'); actions.classList.remove('invisible');
            app.searchSubjects('');
            document.getElementById('mobile-search-input').value = '';
        }
    },

    updateAuthUI: () => {
        const authNav = document.getElementById('auth-nav');
        if (state.user) {
            authNav.innerHTML = `
                <div class="flex items-center">
                    <div class="text-right mr-3 md:mr-5 hidden md:block">
                        <div class="text-[10px] md:text-xs font-black text-slate-900 leading-none mb-1 uppercase tracking-tight">${state.user.name}</div>
                        <div class="text-[7px] md:text-[8px] font-bold text-indigo-500 uppercase tracking-widest">${state.user.role === 'admin' ? 'Admin Gateway' : 'Portal Access'}</div>
                    </div>
                    <button onclick="app.logout()" class="w-10 h-10 md:w-11 md:h-11 bg-rose-50 text-rose-500 rounded-xl md:rounded-2xl flex items-center justify-center transition-all hover:bg-rose-600 hover:text-white border border-rose-100">
                        <i data-lucide="power" class="w-4 h-4 md:w-5 md:h-5"></i>
                    </button>
                </div>`;
            document.getElementById('admin-actions')?.classList.toggle('hidden', state.user.role !== 'admin');
            document.getElementById('admin-file-actions')?.classList.toggle('hidden', state.user.role !== 'admin');
        } else {
            authNav.innerHTML = `
                <button onclick="router.navigate('auth')" class="brand-gradient text-white p-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center min-w-[40px] md:min-w-0">
                    <span class="hidden md:inline">Access</span>
                    <i data-lucide="log-in" class="md:hidden w-5 h-5"></i>
                </button>`;
        }
        lucide.createIcons();
    },

    setLoading: (isLoading) => {
        if (isLoading) {
            const l = document.createElement('div');
            l.id = 'loader';
            l.className = 'fixed inset-0 z-[100] bg-white/70 backdrop-blur-md flex items-center justify-center';
            l.innerHTML = `<div class="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>`;
            document.body.appendChild(l);
        } else { document.getElementById('loader')?.remove(); }
    },

    showModal: (id) => {
        document.getElementById('modal-container').classList.remove('hidden');
        document.getElementById(id).classList.remove('hidden');
    },

    hideModal: () => {
        document.getElementById('modal-container').classList.add('hidden');
        document.querySelectorAll('#modal-container > div').forEach(d => d.classList.add('hidden'));
    },

    showError: (msg) => {
        const el = document.getElementById('auth-error');
        if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    },

    hideError: () => {
        const el = document.getElementById('auth-error');
        if (el) el.classList.add('hidden');
    },
};

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTER
// ─────────────────────────────────────────────────────────────────────────────
const router = {
    navigate: (view, params = {}) => {
        state.currentView = view;
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`view-${view}`);
        setTimeout(() => target.classList.add('active'), 50);
        if (view === 'home') { app.fetchSubjects(); app.checkStorageBanner(); }
        if (view === 'files') { state.currentSubjectId = params.id; app.fetchFiles(params.id); }
        if (view === 'offline') app.renderOfflineFiles();
        ui.updateAuthUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
};

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH FORM
// ─────────────────────────────────────────────────────────────────────────────
document.getElementById('auth-toggle').onclick = () => {
    state.isLogin = !state.isLogin;
    ui.hideError();
    const title     = document.getElementById('auth-title');
    const toggleBtn = document.getElementById('auth-toggle');
    const nameField = document.getElementById('name-field');
    if (state.isLogin) {
        title.textContent     = 'Welcome Student';
        toggleBtn.textContent = 'Need an account? Sign up';
        nameField.classList.add('hidden');
    } else {
        title.textContent     = 'Join GateHub';
        toggleBtn.textContent = 'Already have an account? Login';
        nameField.classList.remove('hidden');
    }
};

document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    ui.hideError();
    ui.setLoading(true);
    const name     = document.getElementById('auth-name').value.trim();
    const email    = e.target.querySelector('input[type="email"]').value.trim();
    const password = e.target.querySelector('input[type="password"]').value;
    try {
        let result;
        if (state.authMode === 'admin') {
            result = await apiLogin(email, password);
            if (result.user.role !== 'admin') throw new Error('This account does not have admin access.');
        } else if (state.isLogin) {
            result = await apiLogin(email, password);
        } else {
            if (!name) throw new Error('Please enter your name.');
            result = await apiRegister(name, email, password);
        }
        state.user  = result.user;
        state.token = result.token;
        localStorage.setItem('user',  JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        ui.setLoading(false);
        router.navigate('home');
    } catch (err) {
        ui.setLoading(false);
        ui.showError(err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────────────────────────
window.onload = () => {
    lucide.createIcons();
    ui.updateAuthUI();
    app.fetchSubjects();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js');
    }
};