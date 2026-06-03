"use client";

import React, { memo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { DSEIData } from "@/lib/api";

const geoUrl = "/brazil-states.json";

// Approximate coordinates for the 7 DSEIs
const dseiCoordinates: Record<string, [number, number]> = {
  "ALAGOAS E SERGIPE": [-37.04, -10.05],
  "ALTAMIRA": [-52.93, -3.97],
  "ALTO RIO JURUÁ": [-70.35, -9.02],
  "ALTO RIO NEGRO": [-64.67, -4.13],
  "ALTO RIO PURUS": [-65.96, -8.03],
  "ALTO RIO SOLIMÕES": [-64.67, -4.13],
  "AMAPÁ E NORTE DO PARÁ": [-52.44, -1.28],
  "ARAGUAIA": [-51.35, -12.91],
  "BAHIA": [-41.71, -12.50],
  "CEARÁ": [-39.38, -5.20],
  "CUIABÁ": [-55.91, -12.64],
  "GUAMÁ-TOCANTINS": [-49.10, -4.51],
  "INTERIOR SUL": [-51.90, -28.48],
  "KAIAPÓ DO MATO GROSSO": [-54.42, -8.30],
  "KAIAPÓ DO PARÁ": [-52.93, -3.97],
  "LESTE DE RORAIMA": [-61.22, 2.08],
  "LITORAL SUL": [-47.72, -23.05],
  "MANAUS": [-64.67, -4.13],
  "MARANHÃO": [-45.27, -5.04],
  "MATO GROSSO DO SUL": [-54.65, -20.33],
  "MINAS GERAIS E ESPÍRITO SANTO": [-42.30, -18.65],
  "MÉDIO RIO PURUS": [-64.67, -4.13],
  "MÉDIO RIO SOLIMÕES E AFLUENTES": [-64.67, -4.13],
  "PARINTINS": [-58.80, -4.05],
  "PERNAMBUCO": [-37.80, -8.34],
  "PORTO VELHO": [-61.15, -9.24],
  "POTIGUARA": [-36.72, -6.47],
  "RIO TAPAJÓS": [-52.93, -3.97],
  "TOCANTINS": [-50.63, -7.06],
  "VALE DO JAVARI": [-64.67, -4.13],
  "VILHENA": [-59.39, -11.79],
  "XAVANTE": [-55.91, -12.64],
  "XINGU": [-55.91, -12.64],
  "YANOMAMI": [-62.95, -1.03]
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
