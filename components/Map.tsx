'use client';

import React, { useRef, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import useStore from '@/lib/store';

/*
 * The interactive map component. It initializes a Mapbox GL map and adds
 * region polygons and domain‑specific layers when loaded. Changes to the
 * active domain or selected year trigger layer updates. See the API routes
 * in app/api for the server queries.
 */
export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { activeDomain, selectedYear } = useStore();

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: process.env.NEXT_PUBLIC_MAP_STYLE || 'mapbox://styles/mapbox/streets-v12',
        center: [2.5, 28.0],
        zoom: 4,
      });

      map.current.on('load', () => {
        // Add administrative regions as a fill layer. The GeoJSON comes from the
        // API and includes MultiPolygon geometries for each region.
        fetch('/api/regions/geojson')
          .then((res) => res.json())
          .then((data) => {
            if (!map.current) return;
            if (map.current.getSource('regions')) return;
            map.current.addSource('regions', { type: 'geojson', data });
            map.current.addLayer({
              id: 'regions-layer',
              type: 'fill',
              source: 'regions',
              paint: {
                'fill-color': '#888',
                'fill-opacity': 0.4,
              },
            });
          });
      });
    }

    // Update layers whenever the active domain or selected year change. The
    // function fetches data from the appropriate API route and creates a
    // style expression for Mapbox to colour the regions or plots points.
    const updateLayers = async () => {
      if (!map.current) return;
      if (activeDomain === 'economy') {
        const gdp = await fetch(`/api/economy/gdp?year=${selectedYear}`).then((res) => res.json());
        // Build a match expression that assigns a colour to each region based on the GDP value.
        const expression: any[] = ['match', ['get', 'code']];
        gdp.data.forEach((d: any) => {
          // Simple two‑tone scale: dark red for values above 1e9 and light yellow otherwise.
          const color = d.value > 1e9 ? '#800026' : '#FFEDA0';
          expression.push(d.code, color);
        });
        expression.push('#888888');
        if (map.current.getLayer('regions-layer')) {
          map.current.setPaintProperty('regions-layer', 'fill-color', expression);
        }
      } else if (activeDomain === 'infrastructure') {
        const projects = await fetch('/api/infrastructure/projects').then((res) => res.json());
        // Convert projects into GeoJSON FeatureCollection
        const geojson = {
          type: 'FeatureCollection',
          features: projects.map((p: any) => ({
            type: 'Feature',
            geometry: p.location,
            properties: p,
          })),
        };
        if (!map.current.getSource('projects')) {
          map.current.addSource('projects', { type: 'geojson', data: geojson });
          map.current.addLayer({
            id: 'projects-layer',
            type: 'circle',
            source: 'projects',
            paint: {
              'circle-color': '#4264fb',
              'circle-radius': 6,
            },
          });
        } else {
          (map.current.getSource('projects') as any).setData(geojson);
        }
      }
    };
    if (map.current?.loaded()) updateLayers();
    else map.current?.on('load', updateLayers);

    // Cleanup the map instance on unmount
    return () => {
      map.current?.remove();
    };
  }, [activeDomain, selectedYear]);

  return <div ref={mapContainer} style={{ height: '100vh', width: '100%' }} />;
}