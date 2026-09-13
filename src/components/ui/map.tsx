'use client';

// ==============================================
// SaveByte — MapCN Interactive Map Components
// ==============================================
//
// MapCN-compatible MapLibre GL UI primitives for:
// - Route Visualization
// - Vehicle Tracking (simulated GPS progression)
// - Pickup & Destination Waypoints
// - Interactive Popups & Overlays
//

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type MapLibreInstance = maplibregl.Map;

interface MapContextValue {
  map: MapLibreInstance | null;
  isLoaded: boolean;
}

const MapContext = createContext<MapContextValue>({ map: null, isLoaded: false });

export function useMap() {
  return useContext(MapContext);
}

// Default accessible zero-cost open map style (Carto Positron vector/raster tiles)
const DEFAULT_MAP_STYLE = {
  version: 8 as const,
  sources: {
    'osm-tiles': {
      type: 'raster' as const,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster' as const,
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export interface MapProps {
  initialCenter?: [number, number]; // [longitude, latitude]
  initialZoom?: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

export function Map({
  initialCenter = [77.5946, 12.9716], // Bengaluru center default
  initialZoom = 13,
  style,
  className,
  children,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreInstance | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || map) return;

    try {
      const mapInstance = new maplibregl.Map({
        container: containerRef.current,
        style: DEFAULT_MAP_STYLE,
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      });

      mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      mapInstance.on('load', () => {
        setIsLoaded(true);
        mapInstance.resize();
      });

      setMap(mapInstance);

      return () => {
        mapInstance.remove();
      };
    } catch (err) {
      console.warn('[MapCN] Failed to initialize WebGL map:', err);
    }
  }, [initialCenter, initialZoom, map]);

  return (
    <MapContext.Provider value={{ map, isLoaded }}>
      <div
        ref={containerRef}
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '380px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '2px solid #1B4332',
          background: '#F3F4F6',
          ...style,
        }}
      >
        {isLoaded && children}
      </div>
    </MapContext.Provider>
  );
}

export function MapControls({ position = 'top-right' }: { position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    const nav = new maplibregl.NavigationControl({ showCompass: true, showZoom: true });
    map.addControl(nav, position);
    return () => {
      map.removeControl(nav);
    };
  }, [map, position]);

  return null;
}

export interface MapMarkerProps {
  coordinates: [number, number]; // [longitude, latitude]
  children?: React.ReactNode;
  popup?: React.ReactNode;
}

export function MapMarker({ coordinates, children }: MapMarkerProps) {
  const { map, isLoaded } = useMap();
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!map || !isLoaded || !elementRef.current) return;

    const marker = new maplibregl.Marker({
      element: elementRef.current,
      anchor: 'center',
    })
      .setLngLat(coordinates)
      .addTo(map);

    markerRef.current = marker;

    return () => {
      marker.remove();
    };
  }, [map, isLoaded, coordinates]);

  // Update position if coordinates change (e.g. simulated vehicle movement)
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat(coordinates);
    }
  }, [coordinates]);

  return (
    <div style={{ display: 'none' }}>
      <div ref={elementRef} style={{ cursor: 'pointer' }}>
        {children}
      </div>
    </div>
  );
}

export function MarkerContent({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.4rem',
        borderRadius: '50%',
        boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface MapRouteProps {
  id?: string;
  coordinates: [number, number][]; // Array of [lng, lat]
  color?: string;
  width?: number;
  dashed?: boolean;
}

export function MapRoute({
  id = 'delivery-route-line',
  coordinates,
  color = '#1B4332',
  width = 5,
  dashed = false,
}: MapRouteProps) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || coordinates.length < 2) return;

    const sourceId = `source-${id}`;
    const layerId = `layer-${id}`;

    const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData,
      });

      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': width,
          ...(dashed ? { 'line-dasharray': [2, 2] } : {}),
        },
      });
    }

    // Fit bounds smoothly to encompass entire route
    const bounds = coordinates.reduce(
      (b, coord) => b.extend(coord),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[1])
    );
    map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isLoaded, coordinates, color, width, dashed, id]);

  return null;
}

export function RouteProgress({
  progressPercent,
  status,
  etaMinutes,
}: {
  progressPercent: number;
  status: string;
  etaMinutes: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: status === 'DELIVERED' ? '#10B981' : '#F59E0B',
              boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.2)',
            }}
          />
          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#111827' }}>
            {status.replace(/_/g, ' ')}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1B4332' }}>
          ETA: ~{etaMinutes} mins
        </div>
      </div>

      {/* Progress track */}
      <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(100, Math.max(0, progressPercent))}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #2D6A4F 0%, #52B788 100%)',
            borderRadius: '9999px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}
