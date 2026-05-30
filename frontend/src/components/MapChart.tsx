"use client";

import React, { memo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { DSEIData } from "@/lib/api";

const geoUrl = "/brazil-states.json";

// Approximate coordinates for the 7 DSEIs
const dseiCoordinates: Record<string, [number, number]> = {
  "ALTO RIO NEGRO": [-67.0, 0.0],
  "KAIAPÓ DO MATO GROSSO": [-53.0, -10.0],
  "KAIAPÓ DO PARÁ": [-51.0, -7.0],
  "VALE DO JAVARI": [-71.0, -5.0],
  "XAVANTE": [-52.0, -14.0],
  "XINGU": [-53.0, -12.0],
  "YANOMAMI": [-63.0, 3.0]
};

interface MapChartProps {
  data: DSEIData[];
  selectedDsei: string;
  onSelectDsei: (dsei: string) => void;
}

const MapChart = ({ data, selectedDsei, onSelectDsei }: MapChartProps) => {
  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{
        scale: 650,
        center: [-55, -15]
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="#e2e8f0"
              stroke="#cbd5e1"
              strokeWidth={0.5}
              style={{
                default: { outline: "none" },
                hover: { fill: "#cbd5e1", outline: "none" },
                pressed: { outline: "none" },
              }}
            />
          ))
        }
      </Geographies>

      {data.map((dsei) => {
        const coordinates = dseiCoordinates[dsei.dsei];
        if (!coordinates) return null;

        const isSelected = selectedDsei === dsei.dsei;
        // Bubble size calculation based on cases
        const radius = Math.max(4, Math.min(20, dsei.dengue_cases * 1.5));
        
        // Color based on cases
        let fillColor = "#3b82f6"; // blue
        if (dsei.dengue_cases > 15) fillColor = "#ef4444"; // red
        else if (dsei.dengue_cases > 5) fillColor = "#f59e0b"; // orange

        return (
          <Marker key={dsei.dsei} coordinates={coordinates}>
            <circle
              r={radius}
              fill={fillColor}
              fillOpacity={0.7}
              stroke={isSelected ? "#0f172a" : "#fff"}
              strokeWidth={isSelected ? 2 : 1}
              onClick={() => onSelectDsei(dsei.dsei)}
              style={{ cursor: "pointer", transition: "all 0.3s" }}
            />
            {isSelected && (
              <text
                textAnchor="middle"
                y={-(radius + 5)}
                style={{ fontFamily: "system-ui", fontSize: "10px", fill: "#334155", fontWeight: "bold" }}
              >
                {dsei.dsei} ({dsei.dengue_cases})
              </text>
            )}
          </Marker>
        );
      })}
    </ComposableMap>
  );
};

export default memo(MapChart);
