// Supabase + UI logic
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://qslfgjasizcayrrcqjdp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbGZnamFzaXpjYXlycmNxamRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTU5MjUsImV4cCI6MjA3MDE5MTkyNX0.u7bGrxlycZZi8jBPk1Y5qM79PvXfIAaJ5jmjvp6CjxY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toRegister = document.getElementById('to-register');
const toLogin = document.getElementById('to-login');
const authMsg = document.getElementById('auth-msg');
const regMsg = document.getElementById('reg-msg');

const dashboard = document.getElementById('dashboard');
const authSection = document.getElementById('auth-section');
const userEmail = document.getElementById('user-email');
const btnLogout = document.getElementById('btn-logout');

const fileInput = document.getElementById('file-input');
const btnUpload = document.getElementById('btn-upload');
const uploadMsg = document.getElementById('upload-msg');
const filesList = document.getElementById('files-list');

// toggle
toRegister.addEventListener('click', (e)=>{e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden');});
toLogin.addEventListener('click', (e)=>{e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden');});

// auth handlers
loginForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  authMsg.textContent = '';
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { authMsg.textContent = error.message; return; }
  initAfterAuth(data.session);
});

registerForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  regMsg.textContent = '';
  const email = document.getElementById('r-email').value;
  const password = document.getElementById('r-password').value;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) { regMsg.textContent = error.message; return; }
  regMsg.textContent = 'Berhasil daftar. Cek email (jika aktif) dan login.';
});

// check session on load
(async function(){
  const { data: { session } } = await supabase.auth.getSession();
  if (session) initAfterAuth(session);
})();

supabase.auth.onAuthStateChange((event, session) => {
  if (session) initAfterAuth(session);
});

// after login
function initAfterAuth(session){
  authSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  userEmail.textContent = session.user.email;
  fetchFiles();
}

// logout
btnLogout.addEventListener('click', async ()=>{
  await supabase.auth.signOut();
  authSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
});

// upload
btnUpload.addEventListener('click', async ()=>{
  uploadMsg.textContent = '';
  const file = fileInput.files[0];
  if (!file) { uploadMsg.textContent = 'Pilih file dulu.'; return; }
  const filename = `${Date.now()}_${file.name}`;
  try {
    const { data, error } = await supabase.storage.from('uploads').upload(filename, file);
    if (error) throw error;
    uploadMsg.textContent = 'Upload berhasil.';
    fetchFiles();
  } catch (err) {
    uploadMsg.textContent = 'Error: ' + (err.message || err);
  }
});

// list files
async function fetchFiles(){
  filesList.innerHTML = '<p class="muted">Memuat...</p>';
  try {
    const { data, error } = await supabase.storage.from('uploads').list('', { limit: 200 });
    if (error) throw error;
    if (!data || data.length===0) { filesList.innerHTML = '<p class="muted">Belum ada file.</p>'; return; }
    filesList.innerHTML = '';
    data.forEach(f=>{
      const div = document.createElement('div');
      div.className = 'file-item';
      const name = document.createElement('div');
      name.innerHTML = `<div class="font-medium">${f.name}</div><div class="muted">${f.created_at || ''}</div>`;
      const a = document.createElement('a');
      const publicUrl = supabase.storage.from('uploads').getPublicUrl(f.name).data.publicUrl;
      a.href = publicUrl;
      a.target = '_blank';
      a.textContent = 'Buka';
      div.appendChild(name);
      div.appendChild(a);
      filesList.appendChild(div);
    });
  } catch (err) {
    filesList.innerHTML = '<p class="muted">Gagal memuat file.</p>';
    console.error(err);
  }
}
