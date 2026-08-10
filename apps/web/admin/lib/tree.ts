export type TreeNode<T extends { id: string }> = T & {
  children?: TreeNode<T>[];
};

export type FlatTreeRow<T extends { id: string }> = T & {
  __depth: number;
  __hasChildren: boolean;
  __childCount: number;
};

export function flattenVisible<T extends { id: string }>(
  nodes: TreeNode<T>[],
  expanded: Set<string>,
  depth = 0
): FlatTreeRow<T>[] {
  const out: FlatTreeRow<T>[] = [];
  for (const node of nodes) {
    const children = node.children || [];
    out.push({
      ...(node as T),
      __depth: depth,
      __hasChildren: children.length > 0,
      __childCount: children.length,
    });
    if (children.length > 0 && expanded.has(node.id)) {
      out.push(...flattenVisible(children, expanded, depth + 1));
    }
  }
  return out;
}

export function filterTree<T extends { id: string; title?: string | null; slug?: string | null }>(
  nodes: TreeNode<T>[],
  query: string
): TreeNode<T>[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const walk = (list: TreeNode<T>[]): TreeNode<T>[] => {
    const result: TreeNode<T>[] = [];
    for (const node of list) {
      const selfMatch =
        String(node.title || "")
          .toLowerCase()
          .includes(q) ||
        String(node.slug || "")
          .toLowerCase()
          .includes(q);
      const filteredChildren = walk(node.children || []);
      if (selfMatch || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: selfMatch ? node.children || [] : filteredChildren,
        });
      }
    }
    return result;
  };

  return walk(nodes);
}

export function collectDescendantIds<T extends { id: string }>(node: TreeNode<T>): string[] {
  const ids: string[] = [];
  for (const child of node.children || []) {
    ids.push(child.id, ...collectDescendantIds(child));
  }
  return ids;
}

export function findInTree<T extends { id: string }>(
  nodes: TreeNode<T>[],
  id: string
): TreeNode<T> | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findInTree(node.children || [], id);
    if (found) return found;
  }
  return null;
}

export function indexTreeById<T extends { id: string }>(
  nodes: TreeNode<T>[]
): Map<string, TreeNode<T>> {
  const map = new Map<string, TreeNode<T>>();
  const walk = (list: TreeNode<T>[]) => {
    for (const node of list) {
      map.set(node.id, node);
      walk(node.children || []);
    }
  };
  walk(nodes);
  return map;
}

export function collectExpandIdsForFilter<T extends { id: string }>(
  nodes: TreeNode<T>[],
  query: string
): Set<string> {
  const q = query.trim().toLowerCase();
  const expanded = new Set<string>();
  if (!q) return expanded;

  const walk = (list: TreeNode<T>[], ancestors: string[]): boolean => {
    let any = false;
    for (const node of list) {
      const selfMatch =
        String((node as { title?: string }).title || "")
          .toLowerCase()
          .includes(q) ||
        String((node as { slug?: string }).slug || "")
          .toLowerCase()
          .includes(q);
      const childMatch = walk(node.children || [], [...ancestors, node.id]);
      if (selfMatch || childMatch) {
        for (const id of ancestors) expanded.add(id);
        if ((node.children || []).length > 0) expanded.add(node.id);
        any = true;
      }
    }
    return any;
  };

  walk(nodes, []);
  return expanded;
}

export function countTreeNodes<T extends { id: string }>(nodes: TreeNode<T>[]): number {
  let n = 0;
  const walk = (list: TreeNode<T>[]) => {
    for (const node of list) {
      n += 1;
      walk(node.children || []);
    }
  };
  walk(nodes);
  return n;
}
