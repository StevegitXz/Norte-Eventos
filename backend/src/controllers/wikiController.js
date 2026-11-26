const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.resolve(__dirname, '../../../docs');
const MANIFEST_PATH = path.join(DOCS_DIR, 'manifest.json');

function stripMarkdownForSearch(markdown) {
  return String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveDocFileSafely(relativeFile) {
  const resolved = path.resolve(DOCS_DIR, relativeFile);
  if (!resolved.startsWith(DOCS_DIR + path.sep)) {
    throw new Error('INVALID_DOC_PATH');
  }
  return resolved;
}

function loadManifestData() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(raw);

  const flatPages = [];
  for (const cat of manifest.categories || []) {
    for (const page of cat.pages || []) {
      flatPages.push({
        slug: page.slug,
        title: page.title,
        summary: page.summary || '',
        file: page.file,
        audience: page.audience || cat.audience || 'todos',
        categoryId: cat.id,
        categoryLabel: cat.label
      });
    }
  }

  const pageMap = new Map();
  flatPages.forEach((p, idx) => {
    const prev = idx > 0 ? { slug: flatPages[idx - 1].slug, title: flatPages[idx - 1].title } : null;
    const next = idx < flatPages.length - 1 ? { slug: flatPages[idx + 1].slug, title: flatPages[idx + 1].title } : null;
    pageMap.set(p.slug, { ...p, prev, next });
  });

  return { manifest, flatPages, pageMap };
}

function obterIndice(req, res) {
  try {
    const { manifest, flatPages } = loadManifestData();

    const searchIndex = flatPages.map((p) => {
      let plainText = '';
      try {
        const filePath = resolveDocFileSafely(p.file);
        const content = fs.readFileSync(filePath, 'utf8');
        plainText = stripMarkdownForSearch(content).slice(0, 4000);
      } catch {
        plainText = p.summary;
      }

      return {
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        categoryId: p.categoryId,
        categoryLabel: p.categoryLabel,
        audience: p.audience,
        text: plainText
      };
    });

    const sanitizedCategories = (manifest.categories || []).map((cat) => ({
      id: cat.id,
      label: cat.label,
      audience: cat.audience || 'todos',
      pages: (cat.pages || []).map((p) => ({
        slug: p.slug,
        title: p.title,
        summary: p.summary || '',
        audience: p.audience || cat.audience || 'todos'
      }))
    }));

    return res.status(200).json({
      title: manifest.title || 'Wiki Norte Eventos',
      version: manifest.version || '1.0.0',
      defaultSlug: manifest.defaultSlug || 'visao-geral',
      categories: sanitizedCategories,
      searchIndex
    });
  } catch (error) {
    console.error('Erro ao carregar índice da Wiki:', error.message);
    return res.status(500).json({ erro: 'Não foi possível carregar o índice da documentação.' });
  }
}

function obterPagina(req, res) {
  try {
    const { manifest, pageMap } = loadManifestData();
    const rawSlug = typeof req.query.slug === 'string' ? req.query.slug : '';
    const normalizedSlug = rawSlug.trim().replace(/^\/+|\/+$/g, '') || manifest.defaultSlug || 'visao-geral';

    // Proteção estrita por whitelist contra Path Traversal
    if (!pageMap.has(normalizedSlug)) {
      return res.status(404).json({ erro: 'Página da documentação não encontrada.' });
    }

    const entry = pageMap.get(normalizedSlug);
    const filePath = resolveDocFileSafely(entry.file);
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);

    return res.status(200).json({
      slug: entry.slug,
      title: entry.title,
      summary: entry.summary,
      audience: entry.audience,
      category: {
        id: entry.categoryId,
        label: entry.categoryLabel
      },
      prev: entry.prev,
      next: entry.next,
      updatedAt: stats.mtime.toISOString(),
      content
    });
  } catch (error) {
    console.error('Erro ao carregar página da Wiki:', error.message);
    return res.status(500).json({ erro: 'Não foi possível carregar a página solicitada.' });
  }
}

module.exports = {
  obterIndice,
  obterPagina
};
