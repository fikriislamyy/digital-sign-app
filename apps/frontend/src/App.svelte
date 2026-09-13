<script lang="ts">
  import { onMount } from 'svelte';

  interface HealthResponse {
    status: string;
    service: string;
    timestamp: string;
  }

  interface DocumentItem {
    id: string;
    title: string;
    status: 'draft' | 'pending' | 'signed' | 'rejected';
    createdAt: string;
  }

  let backendStatus = $state<'checking' | 'connected' | 'disconnected'>('checking');
  let latency = $state<number | null>(null);
  let documents = $state<DocumentItem[]>([]);
  let isSubmitting = $state(false);
  let newDocTitle = $state('');
  let activeTab = $state<'documents' | 'signature-pad' | 'architecture'>('documents');

  // Interactive signature canvas state
  let canvas = $state<HTMLCanvasElement>();
  let isDrawing = false;
  let hasSignature = $state(false);

  async function checkBackendHealth() {
    backendStatus = 'checking';
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        backendStatus = 'connected';
        latency = Math.round(performance.now() - start);
      } else {
        backendStatus = 'disconnected';
      }
    } catch {
      backendStatus = 'disconnected';
      latency = null;
    }
  }

  async function fetchDocuments() {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          documents = json.data;
        }
      }
    } catch (e) {
      console.error('Failed to load documents', e);
    }
  }

  async function handleCreateDocument(e: SubmitEvent) {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    isSubmitting = true;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newDocTitle.trim() }),
      });
      if (res.ok) {
        newDocTitle = '';
        await fetchDocuments();
      }
    } finally {
      isSubmitting = false;
    }
  }

  function startDrawing(e: MouseEvent) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e: MouseEvent) {
    if (!isDrawing || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    hasSignature = true;
  }

  function stopDrawing() {
    isDrawing = false;
  }

  function clearSignature() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
  }

  onMount(() => {
    checkBackendHealth();
    fetchDocuments();
    const interval = setInterval(checkBackendHealth, 10000);
    return () => clearInterval(interval);
  });
</script>

<div class="layout">
  <!-- Top Navigation -->
  <header class="navbar">
    <div class="brand">
      <div class="logo-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.707 2.293a1 1 0 0 0-1.414 0l-1.8 1.8 3.207 3.207 1.8-1.8a1 1 0 0 0 0-1.414l-1.793-1.793ZM17.086 5.5 4.5 18.086V21.5h3.414L20.5 8.914 17.086 5.5ZM3 22h18v2H3v-2Z"/>
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-title">SignCraft</span>
        <span class="brand-badge">Fullstack</span>
      </div>
    </div>

    <!-- Health Status Pill -->
    <div class="status-indicator" class:connected={backendStatus === 'connected'} class:disconnected={backendStatus === 'disconnected'}>
      <span class="status-dot"></span>
      <span class="status-label">
        {#if backendStatus === 'connected'}
          Elysia BE Active {latency !== null ? `(${latency}ms)` : ''}
        {:else if backendStatus === 'checking'}
          Connecting to API...
        {:else}
          BE Offline (Run bun run dev)
        {/if}
      </span>
      <button class="refresh-btn" onclick={checkBackendHealth} title="Refresh backend status">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
      </button>
    </div>
  </header>

  <!-- Main Container -->
  <main class="content">
    <!-- Hero Banner -->
    <section class="hero-card">
      <div class="hero-badge">Next-Gen Digital Signatures</div>
      <h1 class="hero-title">High-Assurance Digital Signature Platform</h1>
      <p class="hero-subtitle">
        Engineered with <span class="highlight">Bun</span>, <span class="highlight">ElysiaJS</span>, <span class="highlight">Svelte 5</span>, and <span class="highlight">Drizzle ORM + PostgreSQL</span> for extreme speed and transactional integrity.
      </p>

      <div class="stack-tags">
        <div class="tag"><span class="tag-bullet bun"></span> Bun Runtime</div>
        <div class="tag"><span class="tag-bullet elysia"></span> ElysiaJS (BE)</div>
        <div class="tag"><span class="tag-bullet svelte"></span> Svelte 5 (FE)</div>
        <div class="tag"><span class="tag-bullet drizzle"></span> Drizzle ORM</div>
        <div class="tag"><span class="tag-bullet postgres"></span> PostgreSQL</div>
      </div>
    </section>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button class="tab-btn" class:active={activeTab === 'documents'} onclick={() => activeTab = 'documents'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Documents & Workflows
      </button>
      <button class="tab-btn" class:active={activeTab === 'signature-pad'} onclick={() => activeTab = 'signature-pad'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
        Interactive Signature Pad
      </button>
      <button class="tab-btn" class:active={activeTab === 'architecture'} onclick={() => activeTab = 'architecture'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
        Stack Architecture
      </button>
    </div>

    <!-- Tab 1: Documents -->
    {#if activeTab === 'documents'}
      <div class="tab-pane">
        <div class="card-grid">
          <!-- Document Creation Form -->
          <div class="glass-card">
            <h2 class="card-title">Create Signature Workflow</h2>
            <p class="card-desc">Prepare a new contract or form for cryptographic signing.</p>
            
            <form onsubmit={handleCreateDocument} class="form-container">
              <div class="input-group">
                <label for="doc-title">Document Title</label>
                <input
                  id="doc-title"
                  type="text"
                  placeholder="e.g. Mutual Confidentiality Agreement"
                  bind:value={newDocTitle}
                  required
                />
              </div>

              <button type="submit" class="primary-btn" disabled={isSubmitting}>
                {#if isSubmitting}
                  Creating Document...
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Generate Document Draft
                {/if}
              </button>
            </form>
          </div>

          <!-- Document List View -->
          <div class="glass-card">
            <div class="card-header-row">
              <h2 class="card-title">Recent Documents</h2>
              <button class="text-btn" onclick={fetchDocuments}>Refresh</button>
            </div>

            <div class="doc-list">
              {#if documents.length === 0}
                <div class="empty-state">No documents found. Create one to begin.</div>
              {:else}
                {#each documents as doc}
                  <div class="doc-item">
                    <div class="doc-info">
                      <span class="doc-name">{doc.title}</span>
                      <span class="doc-id">ID: {doc.id}</span>
                    </div>
                    <div class="doc-badge" class:signed={doc.status === 'signed'} class:pending={doc.status === 'pending'} class:draft={doc.status === 'draft'}>
                      {doc.status.toUpperCase()}
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Tab 2: Interactive Signature Pad -->
    {#if activeTab === 'signature-pad'}
      <div class="tab-pane">
        <div class="glass-card canvas-card">
          <h2 class="card-title">Digital Signature Pad</h2>
          <p class="card-desc">Sign below with your mouse or stylus to capture vector signature coordinates.</p>

          <div class="canvas-wrapper">
            <canvas
              bind:this={canvas}
              width="640"
              height="240"
              onmousedown={startDrawing}
              onmousemove={draw}
              onmouseup={stopDrawing}
              onmouseleave={stopDrawing}
            ></canvas>
          </div>

          <div class="canvas-actions">
            <button class="secondary-btn" onclick={clearSignature}>Clear Canvas</button>
            <button class="primary-btn" disabled={!hasSignature} onclick={() => alert('Signature captured successfully! Ready for cryptographic hashing.')}>
              Adopt & Sign Document
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Tab 3: Stack Architecture -->
    {#if activeTab === 'architecture'}
      <div class="tab-pane">
        <div class="arch-grid">
          <div class="glass-card">
            <div class="arch-number">01</div>
            <h3 class="arch-title">Bun Runtime</h3>
            <p class="arch-text">All-in-one JavaScript toolkit serving as fast package manager, test runner, and native execution environment.</p>
          </div>
          <div class="glass-card">
            <div class="arch-number">02</div>
            <h3 class="arch-title">ElysiaJS Backend</h3>
            <p class="arch-text">Type-safe, hyper-performant web framework running directly on Bun with automatic OpenAPI/Swagger documentation.</p>
          </div>
          <div class="glass-card">
            <div class="arch-number">03</div>
            <h3 class="arch-title">Svelte 5 Frontend</h3>
            <p class="arch-text">Next-gen reactivity powered by Runes, providing seamless DOM updates and lightweight interactive UI.</p>
          </div>
          <div class="glass-card">
            <div class="arch-number">04</div>
            <h3 class="arch-title">Drizzle ORM & Postgres</h3>
            <p class="arch-text">Serverless-ready SQL toolkit with full type-safety, automatic migration generation, and ACID-compliant transaction safety.</p>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 2.5rem;
    background: rgba(9, 13, 22, 0.75);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-glass);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
  }

  .brand-title {
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #ffffff 40%, #a5b4fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .brand-badge {
    margin-left: 0.5rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #a5b4fc;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 1rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-full);
    font-size: 0.825rem;
    font-weight: 500;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent-amber);
    box-shadow: 0 0 8px var(--accent-amber);
  }

  .status-indicator.connected .status-dot {
    background: var(--accent-emerald);
    box-shadow: 0 0 10px var(--accent-emerald);
  }

  .status-indicator.disconnected .status-dot {
    background: var(--accent-rose);
    box-shadow: 0 0 10px var(--accent-rose);
  }

  .refresh-btn {
    background: transparent;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    padding: 2px;
  }

  .refresh-btn:hover {
    color: var(--text-primary);
  }

  .content {
    max-width: 1140px;
    margin: 0 auto;
    width: 100%;
    padding: 2.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .hero-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.75));
    border: 1px solid var(--border-glass-accent);
    border-radius: var(--radius-lg);
    padding: 2.75rem 2.5rem;
    box-shadow: var(--shadow-subtle), var(--shadow-glow);
    position: relative;
    overflow: hidden;
  }

  .hero-card::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-badge {
    display: inline-block;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #a5b4fc;
    margin-bottom: 0.85rem;
  }

  .hero-title {
    font-size: 2.5rem;
    line-height: 1.15;
    margin-bottom: 1rem;
    background: linear-gradient(180deg, #ffffff 60%, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-subtitle {
    font-size: 1.1rem;
    color: var(--text-secondary);
    max-width: 680px;
    margin-bottom: 1.75rem;
  }

  .highlight {
    color: #c7d2fe;
    font-weight: 600;
  }

  .stack-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .tag {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.825rem;
    padding: 0.35rem 0.85rem;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-glass);
    color: var(--text-secondary);
  }

  .tag-bullet {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .tag-bullet.bun { background: #fbf0df; }
  .tag-bullet.elysia { background: #ff5e7e; }
  .tag-bullet.svelte { background: #ff3e00; }
  .tag-bullet.drizzle { background: #c5f958; }
  .tag-bullet.postgres { background: #336791; }

  .tabs {
    display: flex;
    gap: 0.75rem;
    border-bottom: 1px solid var(--border-glass);
    padding-bottom: 0.75rem;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.95rem;
    font-weight: 600;
    padding: 0.6rem 1.25rem;
    border-radius: var(--radius-md);
  }

  .tab-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.03);
  }

  .tab-btn.active {
    color: white;
    background: rgba(99, 102, 241, 0.18);
    border: 1px solid var(--border-glass-accent);
  }

  .card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    .card-grid {
      grid-template-columns: 1fr;
    }
  }

  .glass-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-lg);
    padding: 2rem;
    backdrop-filter: blur(12px);
    transition: transform 0.2s, border-color 0.2s;
  }

  .glass-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }

  .card-title {
    font-size: 1.25rem;
    margin-bottom: 0.35rem;
  }

  .card-desc {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
  }

  .card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .form-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-group label {
    font-size: 0.825rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .input-group input {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-sm);
    padding: 0.75rem 1rem;
    color: var(--text-primary);
    font-size: 0.925rem;
    transition: border-color 0.2s;
  }

  .input-group input:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
  }

  .primary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: var(--accent-primary);
    color: white;
    font-weight: 600;
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-sm);
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  }

  .primary-btn:hover:not(:disabled) {
    background: var(--accent-primary-hover);
    transform: translateY(-1px);
  }

  .primary-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .secondary-btn {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
    font-weight: 600;
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-sm);
  }

  .secondary-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--text-primary);
  }

  .text-btn {
    background: transparent;
    color: var(--accent-primary);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .text-btn:hover {
    text-decoration: underline;
  }

  .doc-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .doc-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-sm);
  }

  .doc-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .doc-name {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .doc-id {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-family: monospace;
  }

  .doc-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: var(--radius-full);
  }

  .doc-badge.signed {
    background: rgba(16, 185, 129, 0.15);
    color: var(--accent-emerald);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .doc-badge.pending {
    background: rgba(245, 158, 11, 0.15);
    color: var(--accent-amber);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .doc-badge.draft {
    background: rgba(148, 163, 184, 0.15);
    color: var(--text-secondary);
    border: 1px solid var(--border-glass);
  }

  .empty-state {
    color: var(--text-muted);
    font-size: 0.875rem;
    padding: 1.5rem 0;
    text-align: center;
  }

  /* Signature Pad */
  .canvas-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .canvas-wrapper {
    background: #0d1322;
    border: 2px dashed rgba(99, 102, 241, 0.35);
    border-radius: var(--radius-md);
    margin: 1rem 0 1.5rem 0;
    cursor: crosshair;
    overflow: hidden;
  }

  .canvas-actions {
    display: flex;
    gap: 1rem;
  }

  /* Architecture Grid */
  .arch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.25rem;
  }

  .arch-number {
    font-size: 1.75rem;
    font-weight: 800;
    color: rgba(99, 102, 241, 0.4);
    margin-bottom: 0.5rem;
    font-family: var(--font-heading);
  }

  .arch-title {
    font-size: 1.15rem;
    margin-bottom: 0.5rem;
  }

  .arch-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
</style>
