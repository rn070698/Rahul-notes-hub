/* ── Rahul Notes Hub – Shared JS (auto-detects API URL) ── */

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

/* ── Auth ── */
const Auth = {
  getToken : ()  => localStorage.getItem('rnh_token'),
  getUser  : ()  => { try{ return JSON.parse(localStorage.getItem('rnh_user')); }catch{ return null; } },
  setAuth  : (t,u) => { localStorage.setItem('rnh_token',t); localStorage.setItem('rnh_user',JSON.stringify(u)); },
  clear    : ()  => { localStorage.removeItem('rnh_token'); localStorage.removeItem('rnh_user'); },
  isAdmin  : ()  => Auth.getUser()?.role === 'admin',
  isLoggedIn:()  => !!Auth.getToken(),
};

/* ── Fetch Helper ── */
async function apiFetch(endpoint, options={}) {
  const token   = Auth.getToken();
  const isForm  = options.body instanceof FormData;
  const headers = { ...(token ? { Authorization:'Bearer '+token } : {}), ...(!isForm ? { 'Content-Type':'application/json' } : {}), ...(options.headers||{}) };
  const res = await fetch(API+endpoint, { ...options, headers, body: options.body && !isForm ? JSON.stringify(options.body) : options.body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ── Toast ── */
function toast(msg, type='info', dur=3500) {
  let box = document.getElementById('toast-container');
  if (!box) { box=document.createElement('div'); box.id='toast-container'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast '+type;
  el.innerHTML = `<span>${{success:'✅',error:'❌',info:'💡'}[type]||'💡'}</span><span>${msg}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.style.cssText='opacity:0;transform:translateY(10px);transition:all .3s'; setTimeout(()=>el.remove(),300); }, dur);
}

/* ── Nav ── */
function renderNav() {
  const user = Auth.getUser();
  document.body.insertAdjacentHTML('afterbegin', `<nav>
    <a href="/index.html" class="nav-logo">
      <div class="logo-icon">R</div>
      <div class="logo-text">Rahul Notes Hub <small>Civil Services</small></div>
    </a>
    <div class="nav-search">
      <svg class="search-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" id="navSearchInput" placeholder="Search notes…"/>
    </div>
    <div class="nav-links">
      <a href="/index.html" class="nav-link">Browse</a>
      <a href="/pages/free-notes.html" class="nav-link">Free Notes</a>
      ${user ? `
        <a href="/pages/my-library.html" class="nav-link">My Library</a>
        <div class="nav-user-menu" style="position:relative">
          <div class="nav-avatar" id="navAvatarBtn" style="cursor:pointer">${user.name[0].toUpperCase()}</div>
          <div class="nav-dropdown" id="navDropdown">
            <a href="/pages/profile.html">👤 Profile</a>
            <a href="/pages/my-library.html">📚 My Library</a>
            <a href="/pages/orders.html">📦 My Orders</a>
            ${Auth.isAdmin() ? '<hr><a href="/admin.html">⚙️ Admin Panel</a>' : ''}
            <hr><a href="#" id="logoutBtn">🚪 Logout</a>
          </div>
        </div>` :
      `<a href="/pages/login.html" class="nav-link">Login</a>
       <a href="/pages/register.html" class="nav-link nav-btn-primary">Sign Up</a>`}
    </div>
  </nav>`);

  document.getElementById('navSearchInput')?.addEventListener('keydown', e => {
    if (e.key==='Enter') location.href='/index.html?search='+encodeURIComponent(e.target.value);
  });
  document.getElementById('navAvatarBtn')?.addEventListener('click', () => document.getElementById('navDropdown')?.classList.toggle('open'));
  document.addEventListener('click', e => { if(!e.target.closest('.nav-user-menu')) document.getElementById('navDropdown')?.classList.remove('open'); });
  document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); Auth.clear(); location.href='/pages/login.html'; });
}

/* ── Footer ── */
function renderFooter() {
  document.body.insertAdjacentHTML('beforeend', `<footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-logo"><div class="logo-icon">R</div><span style="font-family:'Playfair Display',serif;font-size:17px;color:#fff;font-weight:700">Rahul Notes Hub</span></div>
          <p class="footer-about">Your one-stop destination for Civil Services notes. Trusted by 50,000+ aspirants.</p>
        </div>
        <div class="footer-col"><h4>Notes</h4><a href="/index.html?subject=polity">Polity</a><a href="/index.html?subject=history">History</a><a href="/index.html?subject=geography">Geography</a><a href="/index.html?subject=economics">Economics</a><a href="/pages/free-notes.html">Free Notes</a></div>
        <div class="footer-col"><h4>Resources</h4><a href="/index.html?subject=current-affairs">Current Affairs</a><a href="/index.html?subject=ethics">Ethics GS4</a><a href="/index.html?subject=essay">Essay Writing</a><a href="/index.html?subject=csat">CSAT Prep</a></div>
        <div class="footer-col"><h4>Company</h4><a href="#">About Rahul</a><a href="#">Contact Us</a><a href="#">Terms of Use</a><a href="#">Privacy Policy</a><a href="#">Refund Policy</a></div>
      </div>
      <div class="footer-bottom"><p>© 2025 Rahul Notes Hub. All rights reserved.</p><p>support@rahulnoteshub.in</p></div>
    </div>
  </footer>`);
}

/* ── Note Card ── */
const thumbBg = { polity:'linear-gradient(135deg,#E8F4FB,#C5DCF0)', history:'linear-gradient(135deg,#FDF3E3,#F0D99E)', geography:'linear-gradient(135deg,#E8F5ED,#B7DABC)', economics:'linear-gradient(135deg,#FBE8F0,#F0B7CF)', 'science-tech':'linear-gradient(135deg,#EBE8FB,#C8B7F0)', ethics:'linear-gradient(135deg,#FFF5E8,#F5D5A0)', 'current-affairs':'linear-gradient(135deg,#E8FBF8,#A0E8DF)', environment:'linear-gradient(135deg,#F2FBE8,#C0E890)', csat:'linear-gradient(135deg,#E8F0FB,#B7CAEC)', essay:'linear-gradient(135deg,#FBF0E8,#F0C8A0)' };

function noteCardHTML(n) {
  const bg = thumbBg[n.subject_slug] || 'linear-gradient(135deg,#F0EDE8,#E0DCD5)';
  return `<div class="note-card" onclick="location.href='/pages/note-detail.html?slug=${n.slug}'">
    <div class="note-thumb" style="background:${bg}">
      ${n.downloads>8000?'<span class="badge badge-popular" style="position:absolute;top:8px;left:8px">🔥 Popular</span>':''}
      <span class="badge ${n.is_free?'badge-free':'badge-paid'}" style="position:absolute;top:${n.downloads>8000?'36':'8'}px;right:8px">${n.is_free?'FREE':'₹'+n.price}</span>
      <span style="font-size:46px">${n.emoji||'📄'}</span>
      <span style="position:absolute;bottom:8px;left:8px;background:rgba(255,255,255,.85);padding:2px 8px;border-radius:20px;font-size:11px;color:var(--muted)">${n.pages} pages</span>
    </div>
    <div class="note-body">
      <div class="note-subject-tag">${n.subject_name||''}</div>
      <div class="note-title">${n.title}</div>
      <div class="note-desc">${(n.description||'').slice(0,80)}…</div>
      <div class="note-meta">
        <div class="note-rating">★ ${n.rating} <span style="color:var(--muted);font-weight:400">(${(n.downloads||0).toLocaleString()})</span></div>
        <div class="note-price ${n.is_free?'free':''}">${n.is_free?'FREE':'₹'+n.price}</div>
      </div>
      <div class="note-actions">
        <button class="btn btn-outline" onclick="event.stopPropagation();location.href='/pages/note-detail.html?slug=${n.slug}'">Preview</button>
        <button class="btn ${n.is_free?'btn-green':'btn-primary'}" onclick="event.stopPropagation();quickAction(${n.id},'${n.slug}',${n.is_free})">${n.is_free?'⬇ Download':'🛒 Buy'}</button>
      </div>
    </div>
  </div>`;
}

function quickAction(id, slug, isFree) {
  if (!Auth.isLoggedIn()) { sessionStorage.setItem('redirect_after_login', location.href); location.href='/pages/login.html'; return; }
  location.href = '/pages/note-detail.html?slug='+slug;
}

function requireLogin() {
  if (!Auth.isLoggedIn()) { sessionStorage.setItem('redirect_after_login', location.href); location.href='/pages/login.html'; return false; }
  return true;
}

function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'; }
