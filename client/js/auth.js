const apiBase = window.location.origin + '/api'

function getAuthToken() {
  return localStorage.getItem('incident_token')
}

function setAuthToken(token) {
  localStorage.setItem('incident_token', token)
}

function removeAuthToken() {
  localStorage.removeItem('incident_token')
}

async function apiFetch(path, options = {}) {
  const token = getAuthToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${apiBase}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) {
    const message = data?.error || 'Request failed'
    throw new Error(message)
  }
  return data
}

function showError(message) {
  const errorBox = document.getElementById('error')
  if (!errorBox) return
  errorBox.textContent = message
  errorBox.classList.add('visible')
}

function clearError() {
  const errorBox = document.getElementById('error')
  if (!errorBox) return
  errorBox.classList.remove('visible')
  errorBox.textContent = ''
}

function redirectDashboard() {
  window.location.href = '/pages/dashboard.html'
}

if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('login.html')) {
  // login page
  document.addEventListener('DOMContentLoaded', () => {
    const token = getAuthToken()
    if (token) redirectDashboard()

    const loginForm = document.getElementById('loginForm')
    if (!loginForm) return

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      clearError()

      const email = document.getElementById('email').value.trim()
      const password = document.getElementById('password').value

      try {
        const response = await apiFetch('/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })

        setAuthToken(response.token)
        redirectDashboard()
      } catch (err) {
        showError(err.message)
      }
    })
  })
} else if (window.location.pathname.endsWith('signup.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm')
    if (!signupForm) return

    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      clearError()

      const email = document.getElementById('email').value.trim()
      const password = document.getElementById('password').value

      try {
        const response = await apiFetch('/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })

        setAuthToken(response.token)
        redirectDashboard()
      } catch (err) {
        showError(err.message)
      }
    })
  })
}

if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('signup.html')) {
  // protect other app pages
  const publicPaths = ['/pages/login', '/pages/index', '/pages/signup', '/index.html', '/signup.html']
  if (!getAuthToken()) {
    window.location.href = '/pages/index.html'
  }
}

function logout() {
  removeAuthToken()
  window.location.href = '/pages/index.html'
}

window.auth = { apiFetch, logout, getAuthToken }
