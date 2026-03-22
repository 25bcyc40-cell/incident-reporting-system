async function loadDashboard() {
  try {
    const response = await window.auth.apiFetch('/incidents')
    const incidents = response.incidents || []

    const total = incidents.length
    const open = incidents.filter((i) => i.status === 'Open').length
    const investigating = incidents.filter((i) => i.status === 'Investigating').length
    const resolved = incidents.filter((i) => i.status === 'Resolved').length
    const critical = incidents.filter((i) => i.status.toLowerCase() === 'critical').length

    document.getElementById('userRole').textContent = `Total reports: ${total}`

    const stats = document.getElementById('stats')
    stats.innerHTML = `
      <div class="card">Open<br><strong>${open}</strong></div>
      <div class="card">Investigating<br><strong>${investigating}</strong></div>
      <div class="card">Resolved<br><strong>${resolved}</strong></div>
      <div class="card">Critical<br><strong>${critical}</strong></div>
    `

    const list = document.getElementById('incidentsList')
    if (!incidents.length) {
      list.innerHTML = '<p>No incidents yet.</p>'
    } else {
      list.innerHTML = incidents.slice(0, 5).map((incident) => `
        <div class="card" style="padding: 10px; margin-bottom: 10px;">
          <strong>${incident.title}</strong><br />
          ${incident.description.slice(0, 120)}<br />
          <small>Status: ${incident.status}</small>
        </div>
      `).join('')
    }

    document.getElementById('viewAllButton').addEventListener('click', () => {
      window.location.href = '/pages/incidents.html'
    })
  } catch (err) {
    console.error(err)
    alert('Unable to load dashboard: ' + err.message)
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const token = window.auth.getAuthToken()
  if (!token) {
    window.location.href = '/pages/index.html'
    return
  }

  loadDashboard()

  document.getElementById('logoutBtn').addEventListener('click', () => {
    window.auth.logout()
  })
})
