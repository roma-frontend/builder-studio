import type { BuilderNode } from './types';

// Pure, immutable operations on a BuilderNode[] tree (a page's blocks).

export function updateProps(nodes: BuilderNode[], id: string, patch: Record<string, string>): BuilderNode[] {
  return nodes.map((n) => {
    if (n.id === id) return { ...n, props: { ...n.props, ...patch } };
    if (n.children) return { ...n, children: updateProps(n.children, id, patch) };
    return n;
  });
}

export function removeNode(nodes: BuilderNode[], id: string): BuilderNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, id) } : n));
}

export function insertChild(nodes: BuilderNode[], parentId: string, child: BuilderNode): BuilderNode[] {
  return nodes.map((n) => {
    if (n.id === parentId) return { ...n, children: [...(n.children ?? []), child] };
    if (n.children) return { ...n, children: insertChild(n.children, parentId, child) };
    return n;
  });
}

// Moves a node up/down among its siblings, wherever it lives in the tree.
export function moveNode(nodes: BuilderNode[], id: string, dir: -1 | 1): BuilderNode[] {
  const idx = nodes.findIndex((n) => n.id === id);
  if (idx !== -1) {
    const j = idx + dir;
    if (j < 0 || j >= nodes.length) return nodes;
    const next = [...nodes];
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  }
  return nodes.map((n) => (n.children ? { ...n, children: moveNode(n.children, id, dir) } : n));
}

export function findNode(nodes: BuilderNode[], id: string): BuilderNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}
