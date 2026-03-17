document.addEventListener('DOMContentLoaded', () => {

    // ===========================
    // Configuration
    // ===========================
    // Update this to your Render URL when deploying
    const BACKEND_URL = "http://127.0.0.1:5000";

    // ===========================
    // Authentication Flow
    // ===========================
    const loginGoogleBtn = document.getElementById('login-google');
    const authSection = document.getElementById('auth-section');
    const fetchControls = document.getElementById('fetch-controls');

    // Check if user is logged in
    async function checkAuth() {
        try {
            const res = await fetch(`${BACKEND_URL}/`, {
                 credentials: 'include' // Important for session cookies
            });
            const data = await res.json();
            if (data.auth) {
                authSection.innerHTML = `<div class="auth-badge connected">
                    <i class="fa-solid fa-circle-check"></i>
                    Connected as ${data.email}
                </div>`;
                fetchControls.classList.remove('hidden');
            }
        } catch (err) {
            console.log("Auth check failed (might not be logged in or server down)");
        }
    }

    loginGoogleBtn.addEventListener('click', () => {
        // Redirect to Backend Login which redirects to Google
        window.location.href = `${BACKEND_URL}/login`;
    });

    checkAuth();

    // ===========================
    // Spam/Content Classifier
    // ===========================
    const classifyForm = document.getElementById('classify-form');
    const emailText = document.getElementById('email-text');
    const resultBox = document.getElementById('classification-result');
    const classBadge = document.getElementById('class-badge');

    classifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = emailText.value.trim();
        if (!text) return;

        classBadge.className = 'badge';
        classBadge.textContent = '...';
        resultBox.classList.remove('hidden');

        try {
            const res = await fetch(`${BACKEND_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: text })
            });
            const data = await res.json();

            if (data.error) {
                classBadge.textContent = 'Error';
                classBadge.classList.add('spam');
                return;
            }

            const classe = data.classe.toLowerCase();
            classBadge.textContent = data.classe;
            classBadge.classList.add(classe);

        } catch (err) {
            classBadge.textContent = 'Network Error';
            classBadge.classList.add('spam');
        }
    });

    // ===========================
    // Email Fetcher
    // ===========================
    const fetchEmailsBtn = document.getElementById('fetch-emails-btn');
    const emailLimit = document.getElementById('email-limit');
    const fetchLoading = document.getElementById('fetch-loading');
    const fetchError = document.getElementById('fetch-error');
    const emailsContainer = document.getElementById('emails-container');
    const emailList = document.getElementById('email-list');

    fetchEmailsBtn.addEventListener('click', async () => {
        // Reset state
        fetchError.classList.add('hidden');
        emailsContainer.classList.add('hidden');
        fetchLoading.classList.remove('hidden');

        try {
            const res = await fetch(`${BACKEND_URL}/fetch_emails`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ limit: emailLimit.value })
            });
            const data = await res.json();

            fetchLoading.classList.add('hidden');

            if (data.error) {
                fetchError.textContent = data.error;
                fetchError.classList.remove('hidden');
                return;
            }

            // Render emails
            emailList.innerHTML = '';
            if (data.emails.length === 0) {
                emailList.innerHTML = '<li class="email-item" style="text-align:center">No emails found.</li>';
            } else {
                data.emails.forEach(em => {
                    const li = document.createElement('li');
                    li.className = 'email-item';
                    li.innerHTML = `
                        <div class="email-header">
                            <span class="email-subject">${escapeHtml(em.subject)}</span>
                        </div>
                        <div class="email-sender"><i class="fa-solid fa-user-circle"></i> ${escapeHtml(em.sender)}</div>
                        <div class="email-snippet">${escapeHtml(em.snippet)}</div>
                    `;
                    emailList.appendChild(li);
                });
            }

            emailsContainer.classList.remove('hidden');

        } catch (err) {
            fetchLoading.classList.add('hidden');
            fetchError.textContent = 'Could not fetch emails. Are you logged in?';
            fetchError.classList.remove('hidden');
        }
    });

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
});
