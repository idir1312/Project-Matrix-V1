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
export default function Map({ className }: { className?: string }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { activeDomain, selectedYear } = useStore() as { activeDomain: string; selectedYear: number };

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
        map.current!.on('mouseenter', 'regions-layer', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });
        map.current!.on('mouseleave', 'regions-layer', () => {
          map.current!.getCanvas().style.cursor = '';
        });
        map.current!.on('click', 'regions-layer', async (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const { id, code, name } = feature.properties as { id: number; code: string; name: string };
          const year = useStore.getState().selectedYear;
          const gdpRes = await fetch(`/api/economy/gdp?year=${year}`);
          if (!gdpRes.ok) return;
          const gdpData = await gdpRes.json();
          const gdp = gdpData.find((d: any) => d.code === code)?.value || 0;
          const projRes = await fetch('/api/infrastructure/projects');
          if (!projRes.ok) return;
          const projData = await projRes.json();
          const projectCount = projData.features.filter((f: any) => f.properties.region_code === code).length;
          useStore.getState().setSelectedRegion({ id, code, name, gdp, projectCount });
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
        // Build a match expression that assigns a colour to each region based on GDP value.
        const expression: any[] = ['match', ['get', 'code']];
        gdp.forEach((d: any) => {
          const color = d.value > 1e9 ? '#800026' : '#FFEDA0';
          expression.push(d.code, color);
        });
        expression.push('#888888');
        if (map.current.getLayer('regions-layer')) {
          // @ts-ignore
          map.current.setPaintProperty('regions-layer', 'fill-color', expression);
        }
      } else if (activeDomain === 'infrastructure') {
        const projects = await fetch('/api/infrastructure/projects').then((res) => res.json());
        // Convert projects into GeoJSON FeatureCollection
        const geojson = {
          type: 'FeatureCollection' as const,
          features: projects.map((p: any) => ({
            type: 'Feature' as const,
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
          // @ts-ignore
          (map.current.getSource('projects') as mapboxgl.GeoJSONSource).setData(geojson);
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

  return <div ref={mapContainer} className={className} style={{ height: '100%', width: '100%' }} />;
}