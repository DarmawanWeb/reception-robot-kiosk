import type { MapNode, SiteMap } from '@taksu/content';

export type RouteStep =
  | { kind: 'start'; meters: number }
  | { kind: 'turn'; direction: 'left' | 'right'; meters: number }
  | { kind: 'arrive' };

export interface Point {
  x: number;
  y: number;
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Shortest walkable path between two nodes (Dijkstra; venue graphs are small). */
export function findRoute(map: SiteMap, from: string, to: string): string[] | null {
  const nodes = new Map(map.nodes.map((node) => [node.id, node]));
  if (!nodes.has(from) || !nodes.has(to)) return null;

  const adjacency = new Map<string, { id: string; cost: number }[]>();
  for (const [a, b] of map.edges) {
    const nodeA = nodes.get(a);
    const nodeB = nodes.get(b);
    if (!nodeA || !nodeB) continue;
    const cost = distance(nodeA, nodeB);
    adjacency.set(a, [...(adjacency.get(a) ?? []), { id: b, cost }]);
    adjacency.set(b, [...(adjacency.get(b) ?? []), { id: a, cost }]);
  }

  const best = new Map<string, number>([[from, 0]]);
  const previous = new Map<string, string>();
  const settled = new Set<string>();

  for (;;) {
    let current: string | undefined;
    let currentCost = Infinity;
    for (const [id, cost] of best) {
      if (!settled.has(id) && cost < currentCost) {
        current = id;
        currentCost = cost;
      }
    }
    if (current === undefined) return null;
    if (current === to) break;
    settled.add(current);
    for (const { id, cost } of adjacency.get(current) ?? []) {
      const candidate = currentCost + cost;
      if (candidate < (best.get(id) ?? Infinity)) {
        best.set(id, candidate);
        previous.set(id, current);
      }
    }
  }

  const path = [to];
  while (path[0] !== from) {
    const before = previous.get(path[0] as string);
    if (!before) return null;
    path.unshift(before);
  }
  return path;
}

export function routePoints(map: SiteMap, path: readonly string[]): MapNode[] {
  const nodes = new Map(map.nodes.map((node) => [node.id, node]));
  return path.flatMap((id) => {
    const node = nodes.get(id);
    return node ? [node] : [];
  });
}

/**
 * Turn-by-turn steps for a path. In map coordinates y grows downward, so a positive
 * cross product between consecutive segments means a clockwise (right) turn.
 */
export function describeRoute(
  map: SiteMap,
  path: readonly string[],
  straightToleranceDeg = 25,
): { steps: RouteStep[]; meters: number } {
  const points = routePoints(map, path);
  if (points.length < 2) return { steps: [{ kind: 'arrive' }], meters: 0 };

  const toMeters = (units: number) => Math.max(1, Math.round(units * map.metersPerUnit));
  const legs: { direction: 'start' | 'left' | 'right'; units: number }[] = [
    { direction: 'start', units: distance(points[0] as Point, points[1] as Point) },
  ];

  for (let index = 1; index < points.length - 1; index += 1) {
    const before = points[index - 1] as Point;
    const at = points[index] as Point;
    const after = points[index + 1] as Point;
    const incoming = { x: at.x - before.x, y: at.y - before.y };
    const outgoing = { x: after.x - at.x, y: after.y - at.y };
    const cross = incoming.x * outgoing.y - incoming.y * outgoing.x;
    const dot = incoming.x * outgoing.x + incoming.y * outgoing.y;
    const angle = (Math.atan2(cross, dot) * 180) / Math.PI;
    const length = distance(at, after);
    const current = legs.at(-1);

    if (Math.abs(angle) < straightToleranceDeg && current) {
      current.units += length;
    } else {
      legs.push({ direction: angle > 0 ? 'right' : 'left', units: length });
    }
  }

  const steps: RouteStep[] = legs.map((leg) =>
    leg.direction === 'start'
      ? { kind: 'start', meters: toMeters(leg.units) }
      : { kind: 'turn', direction: leg.direction, meters: toMeters(leg.units) },
  );
  steps.push({ kind: 'arrive' });
  const meters = steps.reduce((sum, step) => sum + (step.kind === 'arrive' ? 0 : step.meters), 0);
  return { steps, meters };
}

/** Position at fraction `t` (0..1) along a polyline, for the escort animation. */
export function pointAlong(points: readonly Point[], t: number): Point | null {
  if (points.length === 0) return null;
  if (points.length === 1 || t <= 0) return points[0] ?? null;
  const lengths = points.slice(1).map((point, index) => distance(points[index] as Point, point));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = Math.min(1, t) * total;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index] as number;
    const start = points[index] as Point;
    const end = points[index + 1] as Point;
    if (remaining <= length || index === lengths.length - 1) {
      const ratio = length === 0 ? 1 : Math.min(1, remaining / length);
      return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
    }
    remaining -= length;
  }
  return points.at(-1) ?? null;
}
