async function renderIncidents() {
  try {
    const response = await window.auth.apiFetch('/incidents')
    const incidents = response.incidents || []

    const container = document.getElementById('incidentsContainer')
    if (!container) return

    if (!incidents.length) {
      container.innerHTML = '<p>No incidents found.</p>'
      return
    }

    container.innerHTML = incidents
      .map((incident) => {
        return `
        <div class="card" style="margin-bottom:10px;">
          <h3>${incident.title}</h3>
          <p>${incident.description}</p>
          <p>Status: ${incident.status}</p>
          <div style="display:flex; gap:6px;">
            <button class="status-update" data-id="${incident.id}" data-status="Investigating">Investigating</button>
            <button class="status-update" data-id="${incident.id}" data-status="Resolved">Resolved</button>
            <button class="delete-item" data-id="${incident.id}">Delete</button>
          </div>
        </div>`
      })
      .join('')

    container.querySelectorAll('.status-update').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id
        const status = button.dataset.status
        await updateIncident(id, { status })
      })
    })

    container.querySelectorAll('.delete-item').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id
        if (confirm('Delete this incident?')) {
          await deleteIncident(id)
        }
      })
    })
  } catch (err) {
    console.error(err)
    alert('Unable to fetch incidents: ' + err.message)
  }
}

async function updateIncident(id, data) {
  try {
    await window.auth.apiFetch(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    await renderIncidents()
  } catch (err) {
    alert(err.message)
  }
}

async function deleteIncident(id) {
  try {
    await window.auth.apiFetch(`/incidents/${id}`, { method: 'DELETE' })
    await renderIncidents()
  } catch (err) {
    alert(err.message)
  }
}

if (window.location.pathname.endsWith('report.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reportForm')
    const errorBox = document.getElementById('error')

    const clearStatus = () => {
      if (errorBox) {
        errorBox.classList.remove('visible')
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      clearStatus()

      const title = document.getElementById('title').value.trim()
      const description = document.getElementById('description').value.trim()

      if (!title || !description) {
        if (errorBox) {
          errorBox.textContent = 'Title and description are required.'
          errorBox.classList.add('visible')
        }
        return
      }

      try {
        await window.auth.apiFetch('/incidents', {
          method: 'POST',
          body: JSON.stringify({ title, description }),
        })
        window.location.href = '/pages/dashboard.html'
      } catch (err) {
        if (errorBox) {
          errorBox.textContent = err.message
          errorBox.classList.add('visible')
        }
      }
    })

    document.getElementById('backBtn').addEventListener('click', () => {
      window.location.href = '/pages/dashboard.html'
    })
  })
}

if (window.location.pathname.endsWith('incidents.html')) {
  document.addEventListener('DOMContentLoaded', async () => {
    await renderIncidents()

    document.getElementById('backBtn').addEventListener('click', () => {
      window.location.href = '/pages/dashboard.html'
    })

    document.getElementById('logoutBtn').addEventListener('click', () => {
      window.auth.logout()
    })
  })
}
