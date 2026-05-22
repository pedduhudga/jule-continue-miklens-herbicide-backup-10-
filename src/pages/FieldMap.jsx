import React, { useEffect, useRef } from 'react';
import { useAppState } from '../hooks/useAppState.jsx';
import TopBar from '../components/TopBar.jsx';
import L from 'leaflet';

export default function FieldMap({ onMenuClick }) {
  const { state } = useAppState();
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || typeof L === 'undefined') return;

    // Filter trials with valid GPS
    const geoTrials = (state.trials || []).filter(t => {
        const lat = parseFloat(t.Lat);
        const lon = parseFloat(t.Lon);
        return isFinite(lat) && isFinite(lon) && lat !== 0 && lon !== 0;
    });

    if (geoTrials.length === 0) return;

    // Calculate center from all geo trials
    const avgLat = geoTrials.reduce((s, t) => s + parseFloat(t.Lat), 0) / geoTrials.length;
    const avgLon = geoTrials.reduce((s, t) => s + parseFloat(t.Lon), 0) / geoTrials.length;

    // Initialize Map
    if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current).setView([avgLat, avgLon], 12);

        const googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '&copy; Google Maps'
        });

        googleHybrid.addTo(mapRef.current);
    }

    // Add markers
    const markers = [];
    geoTrials.forEach(trial => {
        const marker = L.marker([trial.Lat, trial.Lon])
            .bindPopup(`<b>${trial.FormulationName}</b><br>Location: ${trial.Location}`)
            .addTo(mapRef.current);
        markers.push(marker);
    });

    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, [state.trials]);

  const geoTrialsCount = (state.trials || []).filter(t => {
      const lat = parseFloat(t.Lat);
      const lon = parseFloat(t.Lon);
      return isFinite(lat) && isFinite(lon) && lat !== 0 && lon !== 0;
  }).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Field Map" onMenuClick={onMenuClick} />

      <div className="flex-1 overflow-hidden p-6 flex flex-col">
        <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div>
                <h3 className="font-bold text-slate-800">Geospatial Distribution</h3>
                <p className="text-sm text-slate-500">{geoTrialsCount} trials have GPS data.</p>
            </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden relative" style={{ minHeight: '400px' }}>
            {geoTrialsCount > 0 ? (
                <div ref={containerRef} className="w-full h-full" style={{ zIndex: 10 }}></div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                    <p className="font-semibold text-lg">No GPS-tagged trials found.</p>
                    <p className="text-sm">Add GPS coordinates when creating trials to see them on the map.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
