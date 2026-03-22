async function loadAdminPage() {
  try {
    const users = await window.auth.apiFetch('/admin/users')
    const list = document.getElementById('userList')
    list.innerHTML = users.users
      .map((u) => `<div class="card">${u.email} (${u.role})</div>`)
      .join('')

    const incidents = await window.auth.apiFetch('/incidents')
    const incidentList = document.getElementById('incidentList')
    incidentList.innerHTML = incidents.incidents
      .map((i) => `
      <div class="card" style="margin-bottom:10px;">
        <h4>${i.title}</h4>
        <p>${i.description}</p>
        <small>Status: ${i.status}</small>
      </div>
    `)
      .join('')
  } catch (err) {
    console.error(err)
    alert('Admin page access failed: ' + err.message)
    window.location.href = '/pages/index.html'
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    window.auth.logout()
  })
  loadAdminPage()
})
