export function catId(cat) {
  return cat?._id || cat?.id || cat?.slug || "";
}

function normalizeNode(node) {
  return {
    ...node,
    _id: node.id || node._id,
    parent_id: node.parentId ?? node.parent_id ?? null,
    children: Array.isArray(node.children)
      ? node.children.map(normalizeNode)
      : [],
  };
}

export function nestCategories(list = []) {
  if (!Array.isArray(list) || !list.length) return [];

  const alreadyNested = list.some(
    (item) => Array.isArray(item?.children) && item.children.length
  );
  if (alreadyNested) return list.map(normalizeNode);

  const items = list.map((n) => ({
    ...n,
    _id: n.id || n._id,
    parent_id: n.parentId ?? n.parent_id ?? null,
    children: [],
  }));

  const map = new Map();
  items.forEach((item) => {
    const id = String(item._id || item.id || "");
    if (id) map.set(id, item);
  });

  const roots = [];
  for (const item of items) {
    const pid = item.parent_id || item.parentId;
    if (pid && map.has(String(pid))) {
      map.get(String(pid)).children.push(item);
    } else {
      roots.push(item);
    }
  }
  return roots;
}

export function findCategoryBySlug(nodes = [], slug) {
  if (!slug) return null;
  for (const node of nodes || []) {
    if (node?.slug === slug) return node;
    const found = findCategoryBySlug(node?.children || [], slug);
    if (found) return found;
  }
  return null;
}

export function collectCategorySlugs(node) {
  if (!node) return [];
  const slugs = node.slug ? [node.slug] : [];
  for (const child of node.children || []) {
    slugs.push(...collectCategorySlugs(child));
  }
  return slugs;
}

export function collectCategoryIds(node) {
  if (!node) return [];
  const id = node._id || node.id;
  const ids = id ? [id] : [];
  for (const child of node.children || []) {
    ids.push(...collectCategoryIds(child));
  }
  return ids;
}

export function ancestorIdsForSlug(nodes = [], slug, acc = []) {
  if (!slug) return null;
  for (const node of nodes || []) {
    const id = catId(node);
    if (node?.slug === slug) return [...acc, id].filter(Boolean);
    const found = ancestorIdsForSlug(node?.children || [], slug, [
      ...acc,
      id,
    ]);
    if (found) return found;
  }
  return null;
}

export function parseFilterSlugs(value) {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  if (raw.includes(",")) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [raw];
}

export function serializeFilterSlugs(slugs = []) {
  return [...new Set((slugs || []).filter(Boolean))];
}

export function selectedFilterSlugs(queryValue, currentSlug) {
  const fromQuery = parseFilterSlugs(queryValue);
  if (fromQuery.length) return fromQuery;
  return currentSlug ? [currentSlug] : [];
}

export function toggleFilterSlug(selected = [], slug) {
  if (!slug) return selected;
  if (selected.includes(slug)) return selected.filter((item) => item !== slug);
  return [...selected, slug];
}

export function findParentCategory(nodes = [], slug, parent = null) {
  if (!slug) return undefined;
  for (const node of nodes || []) {
    if (node?.slug === slug) return parent;
    const found = findParentCategory(node?.children || [], slug, node);
    if (found !== undefined) return found;
  }
  return undefined;
}

export function normalizeCategorySelection(tree, slugs = []) {
  const set = new Set((slugs || []).filter(Boolean));

  const expandSelectedParents = (nodes) => {
    for (const node of nodes || []) {
      if (node?.slug && set.has(node.slug)) {
        for (const childSlug of collectCategorySlugs(node)) set.add(childSlug);
      }
      expandSelectedParents(node?.children || []);
    }
  };
  expandSelectedParents(tree);

  const bubbleParents = (nodes) => {
    for (const node of nodes || []) {
      bubbleParents(node?.children || []);
      const childSlugs = (node?.children || [])
        .map((child) => child.slug)
        .filter(Boolean);
      if (childSlugs.length && childSlugs.every((childSlug) => set.has(childSlug))) {
        if (node.slug) set.add(node.slug);
      }
    }
  };
  bubbleParents(tree);

  return [...set];
}

export function compactCategorySelection(tree, slugs = []) {
  const set = new Set((slugs || []).filter(Boolean));

  const compact = (nodes) => {
    for (const node of nodes || []) {
      compact(node?.children || []);
      if (node?.slug && set.has(node.slug)) {
        for (const child of node.children || []) {
          for (const childSlug of collectCategorySlugs(child)) {
            set.delete(childSlug);
          }
        }
      }
    }
  };
  compact(tree);

  return [...set];
}

export function toggleCategoryFilter(tree, selected = [], slug) {
  if (!slug) return selected;
  const node = findCategoryBySlug(tree, slug);
  const normalized = new Set(normalizeCategorySelection(tree, selected));

  if (!node) {
    if (normalized.has(slug)) normalized.delete(slug);
    else normalized.add(slug);
    return [...normalized];
  }

  if (normalized.has(node.slug)) {
    for (const childSlug of collectCategorySlugs(node)) normalized.delete(childSlug);
    let parent = findParentCategory(tree, node.slug);
    while (parent) {
      if (parent.slug) normalized.delete(parent.slug);
      parent = findParentCategory(tree, parent.slug);
    }
  } else {
    for (const childSlug of collectCategorySlugs(node)) normalized.add(childSlug);
    let parent = findParentCategory(tree, node.slug);
    while (parent) {
      const childSlugs = (parent.children || [])
        .map((child) => child.slug)
        .filter(Boolean);
      if (!childSlugs.every((childSlug) => normalized.has(childSlug))) break;
      if (parent.slug) normalized.add(parent.slug);
      parent = findParentCategory(tree, parent.slug);
    }
  }

  return [...normalized];
}

export function expandSelectedSlugs(tree, slugs = []) {
  const out = [];
  for (const slug of slugs) {
    const node = findCategoryBySlug(tree, slug);
    out.push(...(node ? collectCategorySlugs(node) : [slug]));
  }
  return [...new Set(out.filter(Boolean))];
}

export function expandSelectedIds(tree, slugs = []) {
  const out = [];
  for (const slug of slugs) {
    const node = findCategoryBySlug(tree, slug);
    if (node) out.push(...collectCategoryIds(node));
  }
  return [...new Set(out.filter(Boolean))];
}
