"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { atlasStore } from "@/lib/db/store";
import { GpsDevice, Vehicle } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Compass,
  Car,
  BatteryCharging,
  Gauge,
  Navigation,
  Play,
  RefreshCw,
  MapPin,
  ShieldCheck,
  Radio,
  Wifi,
  AlertTriangle,
} from "lucide-react";

export default function GpsTrackingPage() {
  const [gpsDevices, setGpsDevices] = useState<GpsDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<GpsDevice | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const refreshData = () => {
    const devices = atlasStore.getGpsDevices();
    setGpsDevices(devices);
    if (!selectedDevice && devices.length > 0) {
      setSelectedDevice(devices[0]);
    } else if (selectedDevice) {
      const updated = devices.find((d) => d.id === selectedDevice.id);
      if (updated) setSelectedDevice(updated);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSimulateStep = () => {
    const updated = atlasStore.simulateGpsStep();
    setGpsDevices(updated);
    if (selectedDevice) {
      const u = updated.find((d) => d.id === selectedDevice.id);
      if (u) setSelectedDevice(u);
    }
  };

  // Auto-pulse simulation when playing
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        handleSimulateStep();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, selectedDevice]);

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              GPS Vehicle Telemetry & Fleet Tracking
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300">
              SIMULATED TELEMETRY DEMO MODE
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Wialon & Traccar API abstraction with live coordinates, heading angle, speed, and geofencing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 ${
              isSimulating
                ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            <Radio className="w-4 h-4" />
            {isSimulating ? "Stop Live Simulation" : "Start Live Movement"}
          </button>
          <button
            onClick={handleSimulateStep}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
            title="Step simulation by 1 telemetry packet"
          >
            <RefreshCw className="w-4 h-4" />
            Step Telemetry
          </button>
        </div>
      </div>

      {/* Main GPS Tracking Layout: Vehicle List + Live Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicles Telemetry Sidebar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Tracked Fleet Vehicles ({gpsDevices.length})
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
              <Wifi className="w-3.5 h-3.5" /> Wialon Protocol
            </span>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto">
            {gpsDevices.map((d) => {
              const isSelected = selectedDevice?.id === d.id;

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDevice(d)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-brand-50/80 dark:bg-brand-950/40 border-brand-500 shadow-sm"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {d.vehicle?.year} {d.vehicle?.make} {d.vehicle?.model}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Reg: <strong className="text-slate-700 dark:text-slate-300">{d.vehicle?.registration_number}</strong>
                      </p>
                    </div>
                    <Badge status={d.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-brand-600" />
                      <strong>{d.last_speed} mph</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                      <strong>{d.battery_level}%</strong>
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-400 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                    {d.last_address}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Interactive Map Preview (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Simulated Map Canvas */}
          <div className="relative h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#E2E8F0] dark:bg-[#1E293B] shadow-premium flex flex-col justify-between p-4">
            {/* Map Vector Grid Visual */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Top Map HUD Controls */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-sm">
                <Navigation className="w-3.5 h-3.5 text-brand-600" />
                Active Map Region: Miami Metro & Coastal Highways
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm">
                Provider: <strong className="text-brand-600 font-mono">HST-WIALON-AJAX</strong>
              </div>
            </div>

            {/* Interactive Vehicle Marker Elements */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
              {gpsDevices.map((d) => {
                const isSelected = selectedDevice?.id === d.id;
                // Relative coordinate projection offsets
                const xOffset = ((d.last_longitude + 80.25) * 500) % 280;
                const yOffset = ((d.last_latitude - 25.7) * 500) % 180;

                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDevice(d)}
                    style={{ transform: `translate(${xOffset}px, ${yOffset}px)` }}
                    className={`absolute cursor-pointer transition-all duration-1000 p-2 rounded-2xl flex items-center gap-2 shadow-lg ${
                      isSelected
                        ? "bg-brand-600 text-white ring-4 ring-brand-500/30 scale-110 z-20"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:scale-105 z-10"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isSelected ? "bg-white/20" : "bg-brand-50 dark:bg-slate-800 text-brand-600"}`}>
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-extrabold text-[11px] block leading-tight">
                        {d.vehicle?.make} {d.vehicle?.model}
                      </span>
                      <span className="text-[10px] opacity-80">
                        {d.last_speed > 0 ? `${d.last_speed} mph` : "Stationary"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom HUD Telemetry Status */}
            {selectedDevice && (
              <div className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-premium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {selectedDevice.vehicle?.year} {selectedDevice.vehicle?.make} {selectedDevice.vehicle?.model}
                    </span>
                    <Badge status={selectedDevice.status} />
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    Coordinates: <strong className="font-mono">{selectedDevice.last_latitude.toFixed(6)}, {selectedDevice.last_longitude.toFixed(6)}</strong> · Heading: {selectedDevice.last_heading}°
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">Telemetry Timestamp</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatDate(selectedDevice.last_telemetry_at, "HH:mm:ss")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
