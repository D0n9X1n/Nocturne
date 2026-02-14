/**
 * Nocturne - News Module v3.2.0
 * 
 * Monitor breaking news and important headlines.
 * 
 * Part of Nocturne 24x7 Personal Assistant
 */

// =============================================================================
// Module Metadata
// =============================================================================
export const MODULE_INFO = {
  id: 'news',
  name: 'Breaking News',
  icon: '📰',
  description: 'Monitor breaking news and important headlines',
  version: '3.2.0'
};

// =============================================================================
// Configuration
// =============================================================================
const config = {
  categories: ['general', 'technology', 'business'],
  keywords: [],
  refreshInterval: 5 * 60 * 1000 // 5 minutes
};

// =============================================================================
// State
// =============================================================================
let newsData = null;
let breakingNews = [];
let refreshInterval = null;

// =============================================================================
// API Calls
// =============================================================================
async function fetchNews() {
  try {
    const response = await fetch('/api/news/headlines');
    return response.json();
  } catch (error) {
    console.error('[News] Fetch error:', error);
    return null;
  }
}

async function fetchBreaking() {
  try {
    const response = await fetch('/api/news/breaking');
    return response.json();
  } catch (error) {
    console.error('[News] Breaking news error:', error);
    return null;
  }
}

// =============================================================================
// Rendering
// =============================================================================
function renderNewsCard(article) {
  const timeAgo = getTimeAgo(new Date(article.publishedAt));
  const isBreaking = article.isBreaking;
  const encodedUrl = encodeURIComponent(article.url);
  
  return `
    <article class="news-card ${isBreaking ? 'breaking' : ''}" onclick="window.nocturneModules?.news?.openReader?.('${encodedUrl}', '${article.source || 'Unknown'}')">
      ${isBreaking ? '<span class="breaking-badge">🔴 BREAKING</span>' : ''}
      <div class="news-source">${article.source || 'Unknown'}</div>
      <h3 class="news-title">${article.title}</h3>
      <p class="news-description">${article.description || ''}</p>
      <div class="news-meta">
        <span class="news-time">${timeAgo}</span>
        ${article.category ? `<span class="news-category">${article.category}</span>` : ''}
      </div>
    </article>
  `;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function updateUI() {
  const container = document.getElementById('news-container');
  if (!container) return;
  
  if (!newsData || !newsData.articles || newsData.articles.length === 0) {
    container.innerHTML = `
      <div class="news-loading-state">
        <div class="news-loader">
          <span class="news-loader-dot"></span>
          <span class="news-loader-dot"></span>
          <span class="news-loader-dot"></span>
        </div>
        <p class="news-loading-text">Loading news from RSS feeds...</p>
        <p class="news-loading-hint">Fetching from BBC, NPR, TechCrunch, and more</p>
      </div>
    `;
    return;
  }
  
  // Breaking news banner
  const breakingHtml = breakingNews.length > 0 ? `
    <div class="breaking-banner">
      <span class="breaking-icon">🔴</span>
      <span class="breaking-label">BREAKING:</span>
      <div class="breaking-ticker">
        ${breakingNews.map(n => `<span class="ticker-item">${n.title}</span>`).join(' • ')}
      </div>
    </div>
  ` : '';
  
  // Group by category
  const byCategory = {};
  newsData.articles.forEach(article => {
    const cat = article.category || 'general';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(article);
  });
  
  // Render categories
  const categoriesHtml = Object.entries(byCategory).map(([category, articles]) => `
    <section class="news-section">
      <h3 class="section-title">${getCategoryIcon(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
      <div class="news-grid">
        ${articles.slice(0, 5).map(renderNewsCard).join('')}
      </div>
    </section>
  `).join('');
  
  container.innerHTML = `
    ${breakingHtml}
    ${categoriesHtml}
    <div class="news-footer">
      <span>Last updated: ${new Date().toLocaleTimeString()}</span>
      <button class="refresh-btn" onclick="window.nocturneModules?.news?.refresh?.()">↻ Refresh</button>
    </div>
  `;
}

function getCategoryIcon(category) {
  const icons = {
    general: '📰',
    technology: '💻',
    business: '💼',
    science: '🔬',
    health: '🏥',
    sports: '⚽',
    entertainment: '🎬'
  };
  return icons[category] || '📄';
}

// =============================================================================
// Main Loop
// =============================================================================
async function refresh() {
  try {
    const [news, breaking] = await Promise.all([
      fetchNews(),
      fetchBreaking()
    ]);
    
    newsData = news;
    breakingNews = breaking?.articles || [];
    
    updateUI();
  } catch (error) {
    console.error('[News] Refresh error:', error);
  }
}

// =============================================================================
// Article Reader
// =============================================================================
async function openReader(encodedUrl, source) {
  const articleUrl = decodeURIComponent(encodedUrl);

  // Create reader overlay if it doesn't exist
  let overlay = document.getElementById('news-reader-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'news-reader-overlay';
    overlay.className = 'reader-overlay';
    document.body.appendChild(overlay);
  }

  // Show loading state
  overlay.innerHTML = `
    <div class="reader-panel">
      <div class="reader-toolbar">
        <button class="reader-close" onclick="window.nocturneModules?.news?.closeReader?.()">✕</button>
        <span class="reader-source">${source}</span>
        <a class="reader-open-link" href="${articleUrl}" target="_blank" rel="noopener">Open original ↗</a>
      </div>
      <div class="reader-body">
        <div class="reader-loading">
          <div class="news-loader">
            <span class="news-loader-dot"></span>
            <span class="news-loader-dot"></span>
            <span class="news-loader-dot"></span>
          </div>
          <p>Extracting article...</p>
        </div>
      </div>
    </div>
  `;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Close on overlay background click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeReader();
  });

  // Close on Escape
  const escHandler = (e) => { if (e.key === 'Escape') closeReader(); };
  document.addEventListener('keydown', escHandler);
  overlay._escHandler = escHandler;

  try {
    const res = await fetch(`/api/news/read?url=${encodedUrl}`);
    const data = await res.json();

    const readerBody = overlay.querySelector('.reader-body');

    if (!data.paragraphs || data.paragraphs.length === 0) {
      readerBody.innerHTML = `
        <div class="reader-empty">
          <p>Could not extract article content.</p>
          <a href="${articleUrl}" target="_blank" rel="noopener" class="reader-fallback-link">Open original article ↗</a>
        </div>
      `;
      return;
    }

    const readTime = Math.max(1, Math.ceil(data.wordCount / 200));

    readerBody.innerHTML = `
      ${data.image ? `<div class="reader-hero"><img src="${data.image}" alt="" loading="lazy"></div>` : ''}
      <h1 class="reader-title">${data.title || 'Untitled'}</h1>
      <div class="reader-meta">
        ${data.author ? `<span class="reader-author">By ${data.author}</span>` : ''}
        ${data.publishedAt ? `<span class="reader-date">${new Date(data.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>` : ''}
        <span class="reader-read-time">${readTime} min read</span>
      </div>
      <div class="reader-content">
        ${data.paragraphs.map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class="reader-footer">
        <a href="${articleUrl}" target="_blank" rel="noopener">Read on ${source} ↗</a>
      </div>
    `;
  } catch (err) {
    const readerBody = overlay.querySelector('.reader-body');
    readerBody.innerHTML = `
      <div class="reader-empty">
        <p>Failed to load article.</p>
        <a href="${articleUrl}" target="_blank" rel="noopener" class="reader-fallback-link">Open original article ↗</a>
      </div>
    `;
  }
}

function closeReader() {
  const overlay = document.getElementById('news-reader-overlay');
  if (overlay) {
    if (overlay._escHandler) {
      document.removeEventListener('keydown', overlay._escHandler);
    }
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => overlay.remove(), 300);
  }
}

// =============================================================================
// Module Lifecycle
// =============================================================================
export function init(container) {
  console.log('[News] Initializing module...');
  
  // Create container structure
  container.innerHTML = `
    <div class="module-content news-module">
      <div class="module-header">
        <h2>📰 Breaking News Monitor</h2>
        <p class="module-subtitle">Stay informed with real-time headlines</p>
      </div>
      <div id="news-container" class="news-container">
        <div class="news-loading-state">
          <div class="news-loader">
            <span class="news-loader-dot"></span>
            <span class="news-loader-dot"></span>
            <span class="news-loader-dot"></span>
          </div>
          <p class="news-loading-text">Loading headlines...</p>
        </div>
      </div>
    </div>
  `;
  
  // Initial fetch
  refresh();
  
  // Set up auto-refresh
  refreshInterval = setInterval(refresh, config.refreshInterval);
  
  // Expose refresh function globally for UI button
  if (!window.nocturneModules) window.nocturneModules = {};
  window.nocturneModules.news = { refresh, openReader, closeReader };
}

export function destroy() {
  console.log('[News] Destroying module...');
  closeReader();
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  if (window.nocturneModules?.news) {
    delete window.nocturneModules.news;
  }
}

export function getStatus() {
  if (!newsData) {
    return { status: 'loading', summary: 'Loading news...' };
  }
  
  if (breakingNews.length > 0) {
    return {
      status: 'alert',
      summary: `${breakingNews.length} breaking news alert(s)`,
      data: { breaking: breakingNews }
    };
  }
  
  return {
    status: 'normal',
    summary: `${newsData.articles?.length || 0} headlines`,
    data: newsData
  };
}
