const username = 'rushork';
const state = { repos: [], languages: new Set() };
const statusEl = document.getElementById('status');
const grid = document.getElementById('grid');
const filterInput = document.getElementById('filterInput');
const langFilter = document.getElementById('langFilter');

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function buildCards(repos) {
  grid.innerHTML = '';
  if (!repos.length) {
    statusEl.textContent = 'No projects match your filters.';
    return;
  }
  statusEl.textContent = `${repos.length} repository(ies) displayed`;

  for (const repo of repos) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h2><a target="_blank" rel="noopener" class="title" href="${repo.html_url}">${repo.name}</a></h2>
      <p class="desc">${repo.description || 'No description provided.'}</p>
      <div class="meta">
        <span>⭐ ${repo.stargazers_count || 0}</span>
        <span>🍴 ${repo.forks_count || 0}</span>
        <span>🕒 Updated ${formatDate(repo.updated_at)}</span>
        ${repo.language ? `<span>🧩 ${repo.language}</span>` : ''}
      </div>
      <div class="topics">${(repo.topics || []).map(t => `<span class="topic">${t}</span>`).join('')}</div>
      <div class="links">
        <a target="_blank" rel="noopener" href="${repo.html_url}">Repo code</a>
        ${repo.has_pages ? `<a target="_blank" rel="noopener" href="https://${username}.github.io/${repo.name}/">Pages site</a>` : ''}
        ${repo.homepage ? `<a target="_blank" rel="noopener" href="${repo.homepage}">Homepage</a>` : ''}
      </div>
    `;
    grid.appendChild(card);
  }
}

function updateFilters() {
  const term = filterInput.value.trim().toLowerCase();
  const requestedLang = langFilter.value;
  let filtered = state.repos;

  if (term) {
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(term) || (r.description || '').toLowerCase().includes(term)
    );
  }
  if (requestedLang) {
    filtered = filtered.filter(r => r.language === requestedLang);
  }

  buildCards(filtered);
}

async function fetchRepos() {
  try {
    const headers = {
      Accept: 'application/vnd.github+json, application/vnd.github.mercy-preview+json'
    };

    const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=200&sort=updated`, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API failure: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json();
    state.repos = repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    state.repos.forEach(r => {
      if (r.language) state.languages.add(r.language);
    });

    const ordered = Array.from(state.languages).sort((a,b) => a.localeCompare(b));
    ordered.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = lang;
      langFilter.appendChild(opt);
    });

    updateFilters();
  } catch (err) {
    statusEl.innerHTML = `⚠️ ${err.message}. Check API limits and try again.`;
  }
}

filterInput.addEventListener('input', updateFilters);
langFilter.addEventListener('change', updateFilters);

fetchRepos();
