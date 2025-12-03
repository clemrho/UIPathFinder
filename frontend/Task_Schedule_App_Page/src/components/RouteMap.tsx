import React, { useState } from 'react';

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface RouteMapProps {
  locations: Location[];
  pathId: number;
}

// 将经纬度转换为像素坐标（Web Mercator投影）
function latLngToPixel(lat: number, lng: number, zoom: number, centerLat: number, centerLng: number, width: number, height: number) {
  const scale = 256 * Math.pow(2, zoom);
  
  const worldX = (lng + 180) / 360 * scale;
  const worldY = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale;
  
  const centerWorldX = (centerLng + 180) / 360 * scale;
  const centerWorldY = (1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * scale;
  
  return {
    x: width / 2 + (worldX - centerWorldX),
    y: height / 2 + (worldY - centerWorldY)
  };
}

// 计算瓦片坐标
function getTileCoords(lat: number, lng: number, zoom: number) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y };
}

// 计算边界框
function getBounds(locations: Location[]) {
  const lats = locations.map(l => l.lat);
  const lngs = locations.map(l => l.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

export function RouteMap({ locations, pathId }: RouteMapProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [trafficData] = useState(() => {
    // 为每个路段生成随机交通状态
    const trafficLevels = ['light', 'moderate', 'heavy'];
    return locations.slice(0, -1).map(() => ({
      status: trafficLevels[Math.floor(Math.random() * trafficLevels.length)],
      duration: Math.floor(Math.random() * 10 + 5)
    }));
  });

  const zoom = 14;
  const width = 800;
  const height = 400;

  // 计算中心点
  const bounds = getBounds(locations);
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;

  // 计算需要显示的瓦片
  const centerTile = getTileCoords(centerLat, centerLng, zoom);
  const tiles = [];
  for (let x = centerTile.x - 2; x <= centerTile.x + 2; x++) {
    for (let y = centerTile.y - 2; y <= centerTile.y + 2; y++) {
      tiles.push({ x, y });
    }
  }

  // 将所有位置转换为像素坐标
  const pixelLocations = locations.map(loc => ({
    ...loc,
    ...latLngToPixel(loc.lat, loc.lng, zoom, centerLat, centerLng, width, height)
  }));

  // 根据图片更新配色方案
  const trafficColors = {
    light: '#10b981',    // 绿色 - 畅通
    moderate: '#fbbf24', // 橙黄色 - 缓行
    heavy: '#ef4444'     // 红色 - 拥堵
  };

  const trafficLabels = {
    light: 'Smooth',
    moderate: 'Slow',
    heavy: 'Congested'
  };

  // 为路线段创建渐变色
  const getRouteGradient = (status: string) => {
    if (status === 'light') return ['#10b981', '#22c55e'];
    if (status === 'moderate') return ['#fbbf24', '#f59e0b'];
    return ['#ef4444', '#dc2626'];
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
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

      <div className="relative flex-1 border-t border-gray-200 bg-gray-50 overflow-hidden">
        {/* OpenStreetMap 瓦片层 - 真实地图 */}
        <div className="absolute inset-0">
          {tiles.map(tile => {
            const tilePixelX = (tile.x - centerTile.x) * 256 + width / 2 - 128;
            const tilePixelY = (tile.y - centerTile.y) * 256 + height / 2 - 128;
            
            return (
              <img
                key={`${tile.x}-${tile.y}`}
                src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
                alt=""
                className="absolute w-64 h-64"
                style={{
                  left: `${tilePixelX}px`,
                  top: `${tilePixelY}px`,
                  opacity: 0.9
                }}
                crossOrigin="anonymous"
              />
            );
          })}
        </div>

        {/* 地图标注 */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs border border-gray-200">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-gray-700">UIUC Campus</span>
          </div>
        </div>

        {/* SVG 叠加层用于绘制路线和标记 */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* 为每个路段定义渐变 */}
            {pixelLocations.slice(0, -1).map((loc, index) => {
              const traffic = trafficData[index];
              const [color1, color2] = getRouteGradient(traffic.status);
              return (
                <linearGradient key={`gradient-${index}`} id={`route-gradient-${pathId}-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={color1} />
                  <stop offset="100%" stopColor={color2} />
                </linearGradient>
              );
            })}
          </defs>

          {/* 绘制路线段 */}
          {pixelLocations.slice(0, -1).map((loc, index) => {
            const nextLoc = pixelLocations[index + 1];
            const isHovered = hoveredSegment === index;

            return (
              <g key={`route-${index}`}>
                {/* 路线背景（白色描边） */}
                <line
                  x1={loc.x}
                  y1={loc.y}
                  x2={nextLoc.x}
                  y2={nextLoc.y}
                  stroke="white"
                  strokeWidth={isHovered ? 14 : 12}
                  strokeLinecap="round"
                  className="transition-all pointer-events-auto cursor-pointer"
                  onMouseEnter={() => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
                {/* 路线主体 - 使用渐变 */}
                <line
                  x1={loc.x}
                  y1={loc.y}
                  x2={nextLoc.x}
                  y2={nextLoc.y}
                  stroke={`url(#route-gradient-${pathId}-${index})`}
                  strokeWidth={isHovered ? 10 : 8}
                  strokeLinecap="round"
                  className="transition-all pointer-events-auto cursor-pointer"
                  onMouseEnter={() => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              </g>
            );
          })}

          {/* 绘制位置标记 - 紫色圆形样式 */}
          {pixelLocations.map((loc, index) => {
            return (
              <g key={`marker-${index}`}>
                {/* 标记阴影 */}
                <circle
                  cx={loc.x + 2}
                  cy={loc.y + 2}
                  r="22"
                  fill="rgba(0,0,0,0.15)"
                />
                {/* 标记外圈 - 白色 */}
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r="22"
                  fill="white"
                />
                {/* 标记内圈 - 紫色 */}
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r="18"
                  fill="#8b5cf6"
                />
                {/* 标记编号 - 白色 */}
                <text
                  x={loc.x}
                  y={loc.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="16"
                  fontWeight="700"
                >
                  {index + 1}
                </text>
              </g>
            );
          })}
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

        {/* Hovered segment info */}
        {hoveredSegment !== null && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200">
            <div className="text-sm">
              <div className="text-gray-800 mb-1.5">
                {locations[hoveredSegment].name} → {locations[hoveredSegment + 1].name}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: trafficColors[trafficData[hoveredSegment].status as keyof typeof trafficColors] }}
                />
                <span className="text-sm text-gray-700">
                  {trafficLabels[trafficData[hoveredSegment].status as keyof typeof trafficLabels]}
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