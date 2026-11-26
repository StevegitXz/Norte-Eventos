// Motor da Wiki Integrada — Norte Eventos
// Renderizador Markdown seguro (escape HTML antes do parsing), busca instantânea,
// navegação SPA em /wiki/*, sumário lateral (TOC), botão copiar e diagramas Mermaid.

const state = {
  index: null,
  currentSlug: null,
  audienceFilter: 'all',
  tocObserver: null
};

const AUDIENCE_LABELS = {
  todos: { label: 'Todos os Públicos', classes: 'bg-brand-green/10 dark:bg-brand-emerald/15 text-brand-green dark:text-brand-emerald' },
  usuario: { label: 'Guia do Usuário', classes: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' },
  organizador: { label: 'Organizador', classes: 'bg-brand-amber/15 text-amber-700 dark:text-amber-300' },
  dev: { label: 'Desenvolvedor', classes: 'bg-sky-500/12 text-sky-700 dark:text-sky-300' }
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugifyHeading(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'secao';
}

function sanitizeUrl(rawUrl) {
  const url = String(rawUrl || '').trim();
  if (/^(https?:\/\/|\/|#|mailto:)/i.test(url)) {
    return url;
  }
  return '#';
}

function formatInlineMarkdown(rawText) {
  let html = escapeHtml(rawText);

  // Código inline (`...`) protegido com placeholders para não sofrer formatação interna
  const codeSpans = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE${codeSpans.length}@@`;
    const methodMatch = /^(GET|POST|PUT|DELETE|PATCH)$/.exec(code.trim());
    if (methodMatch) {
      const colors = {
        GET: 'background:rgba(16,185,129,0.14);color:#047857;',
        POST: 'background:rgba(14,165,233,0.15);color:#0369a1;',
        PUT: 'background:rgba(217,119,6,0.15);color:#b45309;',
        DELETE: 'background:rgba(239,68,68,0.14);color:#b91c1c;',
        PATCH: 'background:rgba(139,92,246,0.14);color:#6d28d9;'
      };
      codeSpans.push(`<code style="${colors[methodMatch[1]]}font-weight:700;">${code}</code>`);
    } else {
      codeSpans.push(`<code>${code}</code>`);
    }
    return token;
  });

  // Links [texto](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const safeHref = sanitizeUrl(url);
    const isExternal = /^https?:\/\//i.test(safeHref);
    const wikiMatch = /^\/wiki\/(.+)$/.exec(safeHref);
    if (wikiMatch) {
      return `<a href="${safeHref}" data-wiki-slug="${escapeHtml(wikiMatch[1])}">${label}</a>`;
    }
    const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safeHref}"${attrs}>${label}</a>`;
  });

  // Negrito e itálico
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Restaura code spans
  codeSpans.forEach((snippet, i) => {
    html = html.replace(`@@CODE${i}@@`, snippet);
  });

  return html;
}

function renderMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const headings = [];
  const usedIds = new Map();

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Linha em branco
    if (!line.trim()) {
      i++;
      continue;
    }

    // Bloco de código cercado (```lang ... ```)
    const fenceMatch = /^```([a-zA-Z0-9_-]*)\s*$/.exec(line.trim());
    if (fenceMatch) {
      const lang = (fenceMatch[1] || 'texto').toLowerCase();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // fecha ```

      const rawCode = codeLines.join('\n');
      if (lang === 'mermaid') {
        out.push(`<div class="wiki-mermaid" data-mermaid="${encodeURIComponent(rawCode)}"><pre class="text-xs text-stone-500">${escapeHtml(rawCode)}</pre></div>`);
      } else {
        out.push(`
          <div class="wiki-code-block">
            <div class="wiki-code-header">
              <span>${escapeHtml(lang)}</span>
              <button type="button" class="btn-copy-code inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors cursor-pointer" data-copy="${encodeURIComponent(rawCode)}">
                Copiar
              </button>
            </div>
            <pre><code>${escapeHtml(rawCode)}</code></pre>
          </div>
        `);
      }
      continue;
    }

    // Divisor horizontal (---)
    if (/^---+\s*$/.test(line.trim())) {
      out.push('<hr />');
      i++;
      continue;
    }

    // Headings (#, ##, ###, ####)
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line.trim());
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      let id = slugifyHeading(text);
      const count = usedIds.get(id) || 0;
      usedIds.set(id, count + 1);
      if (count > 0) id = `${id}-${count + 1}`;

      if (level === 2 || level === 3) {
        headings.push({ level, id, text: text.replace(/[`*_]/g, '') });
      }
      out.push(`<h${level} id="${id}">${formatInlineMarkdown(text)}</h${level}>`);
      i++;
      continue;
    }

    // Callouts e Blockquotes (> [!TIP] ... ou > ...)
    if (line.trim().startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }

      const calloutMatch = /^\[!(NOTE|TIP|IMPORTANT|WARNING)\]\s*(.*)$/i.exec(quoteLines[0] || '');
      if (calloutMatch) {
        const type = calloutMatch[1].toUpperCase();
        const meta = {
          NOTE: { label: 'Nota', cls: '' },
          TIP: { label: 'Dica', cls: 'wiki-callout-tip' },
          IMPORTANT: { label: 'Importante', cls: 'wiki-callout-important' },
          WARNING: { label: 'Atenção', cls: 'wiki-callout-warning' }
        }[type] || { label: 'Nota', cls: '' };

        const bodyLines = [];
        if (calloutMatch[2]) bodyLines.push(calloutMatch[2]);
        for (let k = 1; k < quoteLines.length; k++) {
          if (quoteLines[k].trim()) bodyLines.push(quoteLines[k]);
        }

        out.push(`
          <div class="wiki-callout ${meta.cls}" role="note">
            <div class="wiki-callout-title">${meta.label}</div>
            ${bodyLines.map((b) => `<p>${formatInlineMarkdown(b)}</p>`).join('')}
          </div>
        `);
      } else {
        out.push(`
          <blockquote class="wiki-callout">
            ${quoteLines.filter((l) => l.trim()).map((b) => `<p>${formatInlineMarkdown(b)}</p>`).join('')}
          </blockquote>
        `);
      }
      continue;
    }

    // Tabelas Markdown (| col | col |)
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|?[\s:-]+\|/.test(lines[i + 1].trim())) {
      const parseRow = (rowStr) =>
        rowStr
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim());

      const headers = parseRow(line);
      i += 2; // pula header + separador
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i++;
      }

      out.push(`
        <div class="wiki-table-wrap">
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${formatInlineMarkdown(h)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows
                .map((r) => `<tr>${headers.map((_, idx) => `<td>${formatInlineMarkdown(r[idx] || '')}</td>`).join('')}</tr>`)
                .join('')}
            </tbody>
          </table>
        </div>
      `);
      continue;
    }

    // Listas não ordenadas (- ou *)
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, '').trim());
        i++;
      }
      out.push(`<ul>${items.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join('')}</ul>`);
      continue;
    }

    // Listas ordenadas (1. )
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim());
        i++;
      }
      out.push(`<ol>${items.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join('')}</ol>`);
      continue;
    }

    // Parágrafo padrão (agrupa linhas contíguas de texto)
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|```|>|---+|\s*[-*]\s+|\s*\d+\.\s+|\|)/.test(lines[i])
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      out.push(`<p>${formatInlineMarkdown(paraLines.join(' '))}</p>`);
    } else {
      i++;
    }
  }

  return { html: out.join('\n'), headings };
}

function getSlugFromPath() {
  const path = window.location.pathname.replace(/^\/wiki\/?/, '').replace(/\/+$/, '');
  return decodeURIComponent(path);
}

function renderSidebarTree() {
  const container = document.getElementById('wiki-nav-tree');
  if (!container || !state.index) return;

  const filter = state.audienceFilter;
  const html = state.index.categories
    .map((cat) => {
      const visiblePages = cat.pages.filter((p) => filter === 'all' || p.audience === filter || p.audience === 'todos');
      if (visiblePages.length === 0) return '';

      return `
        <div>
          <p class="px-2.5 mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-gray-500">
            ${escapeHtml(cat.label)}
          </p>
          <ul class="space-y-1">
            ${visiblePages
              .map((p) => {
                const isActive = p.slug === state.currentSlug;
                const activeCls = isActive
                  ? 'bg-brand-green/10 dark:bg-brand-emerald/15 text-brand-green dark:text-brand-emerald font-semibold border-brand-green/20 dark:border-brand-emerald/25'
                  : 'text-stone-600 dark:text-gray-300 hover:bg-stone-200/50 dark:hover:bg-white/5 hover:text-brand-dark dark:hover:text-white border-transparent';

                return `
                  <li>
                    <a
                      href="/wiki/${encodeURI(p.slug)}"
                      data-wiki-slug="${escapeHtml(p.slug)}"
                      aria-current="${isActive ? 'page' : 'false'}"
                      class="block px-3 py-2 rounded-xl text-sm border transition-colors ${activeCls}"
                    >
                      ${escapeHtml(p.title)}
                    </a>
                  </li>
                `;
              })
              .join('')}
          </ul>
        </div>
      `;
    })
    .join('');

  container.innerHTML = html || '<p class="text-xs text-stone-400 px-2">Nenhuma página para este filtro.</p>';
}

function renderToc(headings) {
  const tocEl = document.getElementById('wiki-toc');
  if (!tocEl) return;

  if (state.tocObserver) {
    state.tocObserver.disconnect();
    state.tocObserver = null;
  }

  if (!headings || headings.length === 0) {
    tocEl.innerHTML = '<li class="text-stone-400 dark:text-gray-500">Sem subseções</li>';
    return;
  }

  tocEl.innerHTML = headings
    .map((h) => {
      const indent = h.level === 3 ? 'pl-3 text-[11.5px]' : 'font-medium';
      return `
        <li>
          <a href="#${escapeHtml(h.id)}" data-toc-id="${escapeHtml(h.id)}" class="toc-link block py-0.5 hover:text-brand-green dark:hover:text-brand-emerald transition-colors ${indent}">
            ${escapeHtml(h.text)}
          </a>
        </li>
      `;
    })
    .join('');

  // Destaca item ativo no sumário conforme scroll
  const headingEls = headings
    .map((h) => document.getElementById(h.id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && headingEls.length > 0) {
    state.tocObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (!visible) return;
        const activeId = visible.target.id;
        tocEl.querySelectorAll('.toc-link').forEach((a) => {
          const match = a.dataset.tocId === activeId;
          a.classList.toggle('text-brand-green', match);
          a.classList.toggle('dark:text-brand-emerald', match);
          a.classList.toggle('font-bold', match);
        });
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0.1 }
    );
    headingEls.forEach((el) => state.tocObserver.observe(el));
  }
}

async function renderMermaidBlocks() {
  const blocks = document.querySelectorAll('.wiki-mermaid[data-mermaid]');
  if (blocks.length === 0) return;
  if (!window.mermaid) return;

  const isDark = document.documentElement.classList.contains('dark');
  window.mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: isDark ? 'dark' : 'neutral'
  });

  let idx = 0;
  for (const el of blocks) {
    const code = decodeURIComponent(el.dataset.mermaid || '');
    try {
      const { svg } = await window.mermaid.render(`wiki-diagram-${Date.now()}-${idx++}`, code);
      el.innerHTML = svg;
    } catch {
      // Mantém o fallback <pre> caso haja erro ou ambiente sem suporte
    }
  }
}

function wireArticleActions() {
  const article = document.getElementById('wiki-article');
  if (!article) return;

  // Botões de copiar código
  article.querySelectorAll('.btn-copy-code').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = decodeURIComponent(btn.dataset.copy || '');
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.classList.add('bg-emerald-500/30', 'text-emerald-200');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('bg-emerald-500/30', 'text-emerald-200');
        }, 1600);
      } catch {
        btn.textContent = 'Erro ao copiar';
      }
    });
  });
}

function renderPrevNext(prev, next) {
  const container = document.getElementById('wiki-prev-next');
  if (!container) return;

  const prevCard = prev
    ? `
      <a href="/wiki/${encodeURI(prev.slug)}" data-wiki-slug="${escapeHtml(prev.slug)}" class="group p-4 rounded-2xl bg-white dark:bg-[#111915] border border-stone-200/80 dark:border-white/10 hover:border-brand-green/50 dark:hover:border-brand-emerald/50 transition-all text-left">
        <span class="block text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-gray-500 mb-1">← Anterior</span>
        <span class="font-display font-bold text-sm text-brand-dark dark:text-white group-hover:text-brand-green dark:group-hover:text-brand-emerald transition-colors">${escapeHtml(prev.title)}</span>
      </a>
    `
    : '<div></div>';

  const nextCard = next
    ? `
      <a href="/wiki/${encodeURI(next.slug)}" data-wiki-slug="${escapeHtml(next.slug)}" class="group p-4 rounded-2xl bg-white dark:bg-[#111915] border border-stone-200/80 dark:border-white/10 hover:border-brand-green/50 dark:hover:border-brand-emerald/50 transition-all text-right">
        <span class="block text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-gray-500 mb-1">Próxima →</span>
        <span class="font-display font-bold text-sm text-brand-dark dark:text-white group-hover:text-brand-green dark:group-hover:text-brand-emerald transition-colors">${escapeHtml(next.title)}</span>
      </a>
    `
    : '<div></div>';

  container.innerHTML = prevCard + nextCard;
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('wiki-sidebar');
  const backdrop = document.getElementById('wiki-mobile-backdrop');
  const btn = document.getElementById('btn-mobile-menu');
  sidebar?.classList.add('-translate-x-full');
  backdrop?.classList.add('hidden');
  btn?.setAttribute('aria-expanded', 'false');
}

async function loadPage(slug, { pushHistory = true } = {}) {
  const targetSlug = slug || state.index?.defaultSlug || 'visao-geral';
  const articleEl = document.getElementById('wiki-article');
  const breadcrumbsEl = document.getElementById('wiki-breadcrumbs');
  const badgeEl = document.getElementById('wiki-audience-badge');
  const updatedEl = document.getElementById('wiki-updated-at');

  try {
    const res = await fetch(`/api/wiki/pagina?slug=${encodeURIComponent(targetSlug)}`);
    if (!res.ok) {
      throw new Error('NOT_FOUND');
    }

    const data = await res.json();
    state.currentSlug = data.slug;

    if (pushHistory) {
      const nextPath = `/wiki/${encodeURI(data.slug)}`;
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ slug: data.slug }, '', nextPath);
      }
    }

    document.title = `${data.title} — Wiki Norte Eventos`;

    if (breadcrumbsEl) {
      breadcrumbsEl.innerHTML = `
        <a href="/wiki" data-wiki-slug="${escapeHtml(state.index?.defaultSlug || 'visao-geral')}" class="hover:text-brand-green dark:hover:text-brand-emerald transition-colors">Wiki</a>
        <span aria-hidden="true">/</span>
        <span>${escapeHtml(data.category?.label || 'Documentação')}</span>
        <span aria-hidden="true">/</span>
        <span class="text-brand-dark dark:text-gray-200 font-semibold">${escapeHtml(data.title)}</span>
      `;
    }

    if (badgeEl) {
      const info = AUDIENCE_LABELS[data.audience] || AUDIENCE_LABELS.todos;
      badgeEl.className = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${info.classes}`;
      badgeEl.textContent = info.label;
    }

    const { html, headings } = renderMarkdown(data.content);
    if (articleEl) {
      articleEl.innerHTML = html;
      wireArticleActions();
    }

    renderToc(headings);
    renderPrevNext(data.prev, data.next);
    renderSidebarTree();

    if (updatedEl && data.updatedAt) {
      const formatted = new Date(data.updatedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      updatedEl.textContent = `Atualizado em ${formatted}`;
    }

    closeMobileSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    await renderMermaidBlocks();
  } catch {
    if (articleEl) {
      articleEl.innerHTML = `
        <h1>Página não encontrada</h1>
        <p>O artigo solicitado (<code>${escapeHtml(targetSlug)}</code>) não existe na documentação.</p>
        <p><a href="/wiki" data-wiki-slug="${escapeHtml(state.index?.defaultSlug || 'visao-geral')}">Voltar para a Visão Geral</a></p>
      `;
    }
    renderToc([]);
    renderPrevNext(null, null);
  }
}

function setupSearch() {
  const input = document.getElementById('wiki-search-input');
  const resultsEl = document.getElementById('wiki-search-results');
  if (!input || !resultsEl) return;

  const hideResults = () => resultsEl.classList.add('hidden');

  const runSearch = () => {
    const query = input.value.trim().toLowerCase();
    if (!query || !state.index?.searchIndex) {
      hideResults();
      return;
    }

    const matches = state.index.searchIndex
      .map((item) => {
        const titleHit = item.title.toLowerCase().includes(query);
        const summaryHit = item.summary.toLowerCase().includes(query);
        const textLower = item.text.toLowerCase();
        const textPos = textLower.indexOf(query);
        if (!titleHit && !summaryHit && textPos === -1) return null;

        let snippet = item.summary;
        if (textPos !== -1) {
          const start = Math.max(0, textPos - 55);
          const end = Math.min(item.text.length, textPos + query.length + 90);
          snippet = (start > 0 ? '...' : '') + item.text.slice(start, end) + (end < item.text.length ? '...' : '');
        }

        const score = (titleHit ? 3 : 0) + (summaryHit ? 2 : 0) + (textPos !== -1 ? 1 : 0);
        return { ...item, snippet, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (matches.length === 0) {
      resultsEl.innerHTML = `
        <div class="p-4 text-center text-sm text-stone-500 dark:text-gray-400">
          Nenhum resultado para "<strong>${escapeHtml(input.value)}</strong>".
        </div>
      `;
    } else {
      resultsEl.innerHTML = matches
        .map(
          (m) => `
          <a href="/wiki/${encodeURI(m.slug)}" data-wiki-slug="${escapeHtml(m.slug)}" class="block px-4 py-3 hover:bg-stone-100/80 dark:hover:bg-white/5 border-b border-stone-100 dark:border-white/5 last:border-b-0 transition-colors">
            <div class="flex items-center justify-between gap-2 mb-0.5">
              <span class="font-display font-bold text-sm text-brand-dark dark:text-white">${escapeHtml(m.title)}</span>
              <span class="text-[10px] font-bold uppercase tracking-wider text-brand-green dark:text-brand-emerald">${escapeHtml(m.categoryLabel)}</span>
            </div>
            <p class="text-xs text-stone-500 dark:text-gray-400 line-clamp-2">${escapeHtml(m.snippet)}</p>
          </a>
        `
        )
        .join('');
    }

    resultsEl.classList.remove('hidden');
  };

  input.addEventListener('input', runSearch);
  input.addEventListener('focus', runSearch);

  document.addEventListener('click', (e) => {
    if (!resultsEl.contains(e.target) && e.target !== input) {
      hideResults();
    }
  });

  // Atalho Ctrl+K ou Cmd+K para busca instantânea
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === 'Escape') {
      hideResults();
      closeMobileSidebar();
    }
  });
}

function setupGlobalEvents() {
  // Delegação de cliques em links internos da Wiki (SPA)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-wiki-slug]');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const slug = link.dataset.wikiSlug;
    document.getElementById('wiki-search-results')?.classList.add('hidden');
    loadPage(slug, { pushHistory: true });
  });

  // Logo Wiki volta à página inicial da Wiki sem recarregar
  document.getElementById('wiki-brand-link')?.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    loadPage(state.index?.defaultSlug || 'visao-geral', { pushHistory: true });
  });

  // Histórico do navegador (Voltar / Avançar)
  window.addEventListener('popstate', () => {
    const slug = getSlugFromPath();
    loadPage(slug || state.index?.defaultSlug || 'visao-geral', { pushHistory: false });
  });

  // Filtros por perfil na sidebar
  document.getElementById('wiki-audience-filters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.audience-pill');
    if (!btn) return;
    state.audienceFilter = btn.dataset.audience || 'all';
    document.querySelectorAll('.audience-pill').forEach((p) => {
      const active = p === btn;
      p.className = active
        ? 'audience-pill px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-green text-white transition-colors cursor-pointer'
        : 'audience-pill px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-200/70 dark:bg-white/10 text-stone-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-white/15 transition-colors cursor-pointer';
    });
    renderSidebarTree();
  });

  // Menu mobile
  const btnMenu = document.getElementById('btn-mobile-menu');
  const sidebar = document.getElementById('wiki-sidebar');
  const backdrop = document.getElementById('wiki-mobile-backdrop');

  btnMenu?.addEventListener('click', () => {
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    if (isOpen) {
      closeMobileSidebar();
    } else {
      sidebar.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
      btnMenu.setAttribute('aria-expanded', 'true');
    }
  });
  backdrop?.addEventListener('click', closeMobileSidebar);

  // Toggle de tema Claro / Escuro
  document.getElementById('btn-wiki-theme')?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {}
    // Re-renderiza página atual caso haja diagramas Mermaid para atualizar contraste
    if (state.currentSlug && document.querySelector('.wiki-mermaid')) {
      loadPage(state.currentSlug, { pushHistory: false });
    }
  });
}

async function initWiki() {
  setupGlobalEvents();
  setupSearch();

  try {
    const res = await fetch('/api/wiki/indice');
    if (!res.ok) throw new Error('Falha ao carregar índice');
    state.index = await res.json();

    const versionBadge = document.getElementById('wiki-version-badge');
    if (versionBadge && state.index.version) {
      versionBadge.textContent = `v${state.index.version}`;
    }

    const initialSlug = getSlugFromPath() || state.index.defaultSlug || 'visao-geral';
    await loadPage(initialSlug, { pushHistory: false });
  } catch (err) {
    console.error(err);
    const article = document.getElementById('wiki-article');
    if (article) {
      article.innerHTML = '<h1>Erro ao carregar documentação</h1><p>Não foi possível conectar ao servidor da Wiki. Verifique se o backend está em execução.</p>';
    }
  }
}

document.addEventListener('DOMContentLoaded', initWiki);
