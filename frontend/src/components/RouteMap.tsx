import React, { useState, useRef, useEffect } from 'react';

interface Location {
  name: string;
  lat: number;
  lng: number;
}

// 路线点和 segments 类型（新加）
interface SegmentPoint {
  lat: number;
  lng: number;
}

interface Segment {
  fromIndex: number;
  toIndex: number;
  route: SegmentPoint[];
}

interface RouteMapProps {
  locations: Location[];
  pathId: number;
  segments?: Segment[]; // ★ 新加：后端返回的路线
}

// 将经纬度转换为像素坐标（Web Mercator 投影）
function latLngToPixel(
  lat: number,
  lng: number,
  zoom: number,
  centerLat: number,
  centerLng: number,
  width: number,
  height: number
) {
  const scale = 256 * Math.pow(2, zoom);

  const worldX = ((lng + 180) / 360) * scale;
  const worldY =
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) +
          1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
    scale;

  const centerWorldX = ((centerLng + 180) / 360) * scale;
  const centerWorldY =
    ((1 -
      Math.log(
        Math.tan((centerLat * Math.PI) / 180) +
          1 / Math.cos((centerLat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
    scale;

  return {
    x: width / 2 + (worldX - centerWorldX),
    y: height / 2 + (worldY - centerWorldY)
  };
}

// 计算瓦片坐标
function getTileCoords(lat: number, lng: number, zoom: number) {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) +
          1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
  return { x, y };
}

// 计算边界框
function getBounds(locations: Location[]) {
  const lats = locations.map((l) => l.lat);
  const lngs = locations.map((l) => l.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs)
  };
}

// 限制数值在区间内
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function RouteMap({ locations, pathId, segments }: RouteMapProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  // 缩放级别（滚轮控制）
  const [zoom, setZoom] = useState(14);

  // 容器尺寸
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // 平移偏移量（像素）
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0
  });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: rect.height || 400
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 鼠标滚轮缩放
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => {
        const delta = e.deltaY > 0 ? -1 : 1; // 向上滚放大，向下滚缩小
        const next = z + delta;
        return Math.max(3, Math.min(18, next));
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // 全局 mouseup：无论在哪松手，都结束拖动（兜底）
  useEffect(() => {
    const onMouseUp = () => {
      dragState.current.dragging = false;
    };
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseleave', onMouseUp);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseleave', onMouseUp);
    };
  }, []);

  // 鼠标按下开始拖动（只响应左键）
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: panOffset.x,
      startOffsetY: panOffset.y
    };
  };

  // 鼠标移动 → 如果正在拖动，就更新偏移量
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // 只有左键按着时才允许拖动；否则立即停止
    if (!dragState.current.dragging || (e.buttons & 1) !== 1) {
      dragState.current.dragging = false;
      return;
    }

    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;

    const width = dimensions.width;
    const height = dimensions.height;

    // 限制最大拖动范围，避免地图被拖出框外
    const maxPanX = width * 0.4;
    const maxPanY = height * 0.4;

    const nextX = clamp(
      dragState.current.startOffsetX + dx,
      -maxPanX,
      maxPanX
    );
    const nextY = clamp(
      dragState.current.startOffsetY + dy,
      -maxPanY,
      maxPanY
    );

    setPanOffset({ x: nextX, y: nextY });
  };

  // stops 太少时不画图
  if (!locations || locations.length < 2) {
    return (
      <div className="mt-4">
        <div className="w-full h-[200px] rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 text-sm text-gray-500">
          Not enough stops to draw a route.
        </div>
      </div>
    );
  }

  // 生成每段的交通状态
  const trafficLevels = ['light', 'moderate', 'heavy'] as const;
  const trafficData = locations.slice(0, -1).map((_, index) => ({
    status: trafficLevels[index % trafficLevels.length],
    duration: Math.floor(Math.random() * 10 + 5)
  }));

  const width = dimensions.width;
  const height = dimensions.height;

  // 中心点
  const bounds = getBounds(locations);
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;

  // === tiles：根据容器大小动态生成，保证填满 + 留出拖动空间 ===
  const centerTile = getTileCoords(centerLat, centerLng, zoom);
  const tiles: { x: number; y: number }[] = [];

  const tileSize = 256;
  const tilesX = Math.ceil(width / tileSize) + 4;
  const tilesY = Math.ceil(height / tileSize) + 4;
  const radiusX = Math.ceil(tilesX / 2);
  const radiusY = Math.ceil(tilesY / 2);

  for (let x = centerTile.x - radiusX; x <= centerTile.x + radiusX; x++) {
    for (let y = centerTile.y - radiusY; y <= centerTile.y + radiusY; y++) {
      tiles.push({ x, y });
    }
  }

  // 像素坐标 + 拖动偏移
  const basePixelLocations = locations.map((loc) =>
    latLngToPixel(
      loc.lat,
      loc.lng,
      zoom,
      centerLat,
      centerLng,
      width,
      height
    )
  );
  const pixelLocations = locations.map((loc, index) => ({
    ...loc,
    x: basePixelLocations[index].x + panOffset.x,
    y: basePixelLocations[index].y + panOffset.y
  }));

  // segments 映射表："fromIndex-toIndex" -> segment
  const segmentMap = new Map<string, Segment>();
  (segments || []).forEach((seg) => {
    if (Array.isArray(seg.route) && seg.route.length > 1) {
      segmentMap.set(`${seg.fromIndex}-${seg.toIndex}`, seg);
    }
  });

  const trafficColors = {
    light: '#10b981',
    moderate: '#fbbf24',
    heavy: '#ef4444'
  };

  const trafficLabels = {
    light: 'Smooth',
    moderate: 'Slow',
    heavy: 'Congested'
  };

  const getRouteGradient = (status: string) => {
    if (status === 'light') return ['#10b981', '#22c55e'];
    if (status === 'moderate') return ['#fbbf24', '#f59e0b'];
    return ['#ef4444', '#dc2626'];
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm text-gray-700">Route Map (Real-time Traffic)</h4>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Smooth</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-gray-600">Slow</span>
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[400px] rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-gray-50 cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* OSM 瓦片层 */}
        <div className="absolute inset-0">
          {tiles.map((tile) => {
            const tilePixelX =
              (tile.x - centerTile.x) * tileSize +
              width / 2 -
              tileSize / 2 +
              panOffset.x;
            const tilePixelY =
              (tile.y - centerTile.y) * tileSize +
              height / 2 -
              tileSize / 2 +
              panOffset.y;

            return (
              <img
                key={`${tile.x}-${tile.y}`}
                src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
                alt=""
                className="absolute"
                style={{
                  width: tileSize,
                  height: tileSize,
                  left: `${tilePixelX}px`,
                  top: `${tilePixelY}px`,
                  opacity: 0.9
                }}
                crossOrigin="anonymous"
              />
            );
          })}
        </div>

        {/* UIUC 标记 */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs border border-gray-200 pointer-events-auto">
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-gray-700">UIUC Campus</span>
          </div>
        </div>

        {/* SVG 叠加层 */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {pixelLocations.slice(0, -1).map((loc, index) => {
              const traffic = trafficData[index];
              const [color1, color2] = getRouteGradient(traffic.status);
              return (
                <linearGradient
                  key={`gradient-${index}`}
                  id={`route-gradient-${pathId}-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={color1} />
                  <stop offset="100%" stopColor={color2} />
                </linearGradient>
              );
            })}
          </defs>

          {/* 路线：有 segments 就画 polyline，没有就用直线 */}
          {pixelLocations.slice(0, -1).map((loc, index) => {
            const nextLoc = pixelLocations[index + 1];
            const isHovered = hoveredSegment === index;
            const gradientId = `route-gradient-${pathId}-${index}`;

            const segKey = `${index}-${index + 1}`;
            const seg = segmentMap.get(segKey);

            if (seg && seg.route && seg.route.length > 1) {
              // 把真实路线点转换成像素坐标 + pan 偏移
              const polyPoints = seg.route
                .map((pt) => {
                  const p = latLngToPixel(
                    pt.lat,
                    pt.lng,
                    zoom,
                    centerLat,
                    centerLng,
                    width,
                    height
                  );
                  const x = p.x + panOffset.x;
                  const y = p.y + panOffset.y;
                  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
                  return `${x},${y}`;
                })
                .filter(Boolean)
                .join(' ');

              // 极端情况下 route 都无效，退回直线
              if (!polyPoints) {
                return (
                  <g key={`route-${index}`}>
                    <line
                      x1={loc.x}
                      y1={loc.y}
                      x2={nextLoc.x}
                      y2={nextLoc.y}
                      stroke="white"
                      strokeWidth={isHovered ? 14 : 12}
                      strokeLinecap="round"
                      className="transition-all"
                      onMouseEnter={() => setHoveredSegment(index)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                    <line
                      x1={loc.x}
                      y1={loc.y}
                      x2={nextLoc.x}
                      y2={nextLoc.y}
                      stroke={`url(#${gradientId})`}
                      strokeWidth={isHovered ? 10 : 8}
                      strokeLinecap="round"
                      className="transition-all"
                    />
                  </g>
                );
              }

              return (
                <g key={`route-${index}`}>
                  {/* 背景白边 */}
                  <polyline
                    points={polyPoints}
                    fill="none"
                    stroke="white"
                    strokeWidth={isHovered ? 14 : 12}
                    strokeLinecap="round"
                    className="transition-all pointer-events-auto cursor-pointer"
                    onMouseEnter={() => setHoveredSegment(index)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                  {/* 渐变主线 */}
                  <polyline
                    points={polyPoints}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={isHovered ? 10 : 8}
                    strokeLinecap="round"
                    className="transition-all pointer-events-auto cursor-pointer"
                    onMouseEnter={() => setHoveredSegment(index)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                </g>
              );
            }

            // 没有 segments：保持原来的直线效果
            return (
              <g key={`route-${index}`}>
                <line
                  x1={loc.x}
                  y1={loc.y}
                  x2={nextLoc.x}
                  y2={nextLoc.y}
                  stroke="white"
                  strokeWidth={isHovered ? 14 : 12}
                  strokeLinecap="round"
                  className="transition-all"
                  onMouseEnter={() => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
                <line
                  x1={loc.x}
                  y1={loc.y}
                  x2={nextLoc.x}
                  y2={nextLoc.y}
                  stroke={`url(#${gradientId})`}
                  strokeWidth={isHovered ? 10 : 8}
                  strokeLinecap="round"
                  className="transition-all"
                />
              </g>
            );
          })}

          {/* 位置标记 */}
          {pixelLocations.map((loc, index) => (
            <g key={`marker-${index}`}>
              <circle
                cx={loc.x + 2}
                cy={loc.y + 2}
                r="16"
                fill="rgba(0,0,0,0.15)"
              />
              <circle cx={loc.x} cy={loc.y} r="16" fill="white" />
              <circle cx={loc.x} cy={loc.y} r="12" fill="#8b5cf6" />
              <text
                x={loc.x}
                y={loc.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="14"
                fontWeight="700"
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>

        {/* 位置标签 */}
        {pixelLocations.map((loc, index) => (
  <div
    key={`label-${index}`}
    className="absolute bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-md text-xs pointer-events-none border border-gray-100"
    style={{
      left: `${(loc.x / width) * 100}%`,
      top: `${(loc.y / height) * 100}%`,
      transform: 'translate(-50%, -140%)',
      maxWidth: '140px'
    }}
  >
    <div className="truncate text-gray-800">{loc.name}</div>
  </div>
))}

        {/* Hover 信息 */}
        {hoveredSegment !== null && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200 pointer-events-auto">
            <div className="text-sm">
              <div className="text-gray-800 mb-1.5">
                {locations[hoveredSegment].name} →{' '}
                {locations[hoveredSegment + 1].name}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      trafficColors[
                        trafficData[hoveredSegment].status as keyof typeof trafficColors
                      ]
                  }}
                />
                <span className="text-sm text-gray-700">
                  {
                    trafficLabels[
                      trafficData[hoveredSegment].status as keyof typeof trafficLabels
                    ]
                  }
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Est: {trafficData[hoveredSegment].duration} min
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
