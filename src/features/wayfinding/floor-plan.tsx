'use client';

import { type KioskSite, type Locale, pick, type RoomCategory } from '@taksu/content';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type Point, pointAlong, roomLabel, routePoints } from './route';

const categoryFill: Record<RoomCategory, string> = {
  service: 'var(--primary)',
  office: 'var(--subak)',
  facility: 'var(--accent)',
  dining: 'var(--level-sd)',
  wellness: 'var(--level-sma)',
  leisure: 'var(--level-smp)',
};

/** Escort animation: moves the robot marker along the route once per `runId`. */
function useEscort(points: readonly Point[], runId: number, onDone: () => void): Point | null {
  const [position, setPosition] = useState<Point | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (runId === 0 || points.length < 2) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduceMotion ? 0 : 1200 + points.length * 700;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      setPosition(pointAlong(points, progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else onDoneRef.current();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [points, runId]);

  return runId === 0 ? null : position;
}

export function FloorPlan({
  site,
  locale,
  route,
  destinationRoomId,
  escortRun,
  onEscortDone,
  label,
}: {
  site: KioskSite;
  locale: Locale;
  route: readonly string[] | null;
  destinationRoomId: string | null;
  escortRun: number;
  onEscortDone: () => void;
  label: string;
}) {
  const { map } = site;
  const nodes = useMemo(() => new Map(map.nodes.map((node) => [node.id, node])), [map.nodes]);
  const points = useMemo(() => (route ? routePoints(map, route) : []), [map, route]);
  const escort = useEscort(points, escortRun, onEscortDone);
  const start = nodes.get(map.startNodeId);
  const marker = escort ?? start;

  return (
    <svg
      viewBox={`0 0 ${map.width} ${map.height}`}
      role="img"
      aria-label={label}
      className="h-auto w-full"
    >
      <rect width={map.width} height={map.height} rx="18" fill="var(--surface)" />
      <g stroke="var(--surface-muted)" strokeWidth="34" strokeLinecap="round">
        {map.edges.map(([from, to]) => {
          const a = nodes.get(from);
          const b = nodes.get(to);
          return a && b ? <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} /> : null;
        })}
      </g>
      {map.rooms.map((room) => {
        const name = pick(room.name, locale);
        const active = room.id === destinationRoomId;
        const label = roomLabel(name, room.width);
        const cx = room.x + room.width / 2;
        return (
          <g key={room.id}>
            <rect
              x={room.x}
              y={room.y}
              width={room.width}
              height={room.height}
              rx="10"
              fill={categoryFill[room.category]}
              fillOpacity={active ? 0.45 : 0.16}
              stroke={active ? 'var(--primary)' : 'var(--border)'}
              strokeWidth={active ? 5 : 2}
            />
            <text
              x={cx}
              y={room.y + room.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={label.size}
              fontWeight={active ? 700 : 600}
              fill="var(--foreground)"
            >
              {label.lines.length === 1
                ? label.lines[0]
                : label.lines.map((line, index) => (
                    <tspan key={line} x={cx} dy={index === 0 ? '-0.6em' : '1.2em'}>
                      {line}
                    </tspan>
                  ))}
            </text>
          </g>
        );
      })}
      {points.length > 1 ? (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polyline
            points={points.map((point) => `${point.x},${point.y}`).join(' ')}
            stroke="var(--primary)"
            strokeOpacity="0.25"
            strokeWidth="16"
          />
          <polyline
            points={points.map((point) => `${point.x},${point.y}`).join(' ')}
            stroke="var(--primary)"
            strokeWidth="7"
            strokeDasharray="14 10"
            className="animate-route"
          />
        </g>
      ) : null}
      {start ? (
        <text
          x={start.x + 24}
          y={start.y + 6}
          fontSize="18"
          fontWeight="700"
          fill="var(--foreground)"
        >
          {pick(map.startLabel, locale)}
        </text>
      ) : null}
      {marker ? (
        <g transform={`translate(${marker.x} ${marker.y})`}>
          <circle r="20" fill="var(--primary)" fillOpacity="0.2" />
          <circle r="12" fill="var(--primary)" stroke="var(--surface)" strokeWidth="4" />
        </g>
      ) : null}
    </svg>
  );
}
