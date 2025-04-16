"use client"
import React, { useState, useEffect } from "react"
import { Bus } from "../models/Bus"
import { Car } from "../models/Car"
import { Motorcycle } from "../models/Motorcycle"
import { Vehicle } from "../models/Vehicle"

// Define types for API responses
interface ParkingLog {
  vehicleType: string;
  licensePlate: string;
  action: 'park' | 'leave';
  timestamp: string;
  levelNumber: number;
  spotNumber: number;
}

interface ParkingSpot {
  spotType: string;
  vehicle: {
    licensePlate: string;
    type?: string;
    getType?: () => string;
  } | null;
}

interface Level {
  floor: number;
  spots: ParkingSpot[];
}

interface ParkingLotData {
  levels: Level[];
  isFull: boolean;
  history: ParkingLog[];
}

function randomVehicle(): { type: string, license: string } {
  const r = Math.random()
  const license = Math.random().toString(36).substring(2, 8)
  
  if (r < 0.2) return { type: 'bus', license }
  if (r < 0.4) return { type: 'motorcycle', license }
  return { type: 'car', license }
}

export default function ParkingLotView() {
  const [lastVehicle, setLastVehicle] = useState<{ type: string, license: string } | null>(null)
  const [failed, setFailed] = useState(false)
  const [lotFull, setLotFull] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parkingData, setParkingData] = useState<ParkingLotData | null>(null)

  // Load parking data on component mount
  useEffect(() => {
    loadParkingData();
  }, []);

  const loadParkingData = async () => {
    try {
      const response = await fetch('/api/parking');
      if (!response.ok) {
        throw new Error('Failed to fetch parking data');
      }
      
      const responseData = await response.json();
      if (responseData.success) {
        setParkingData(responseData.data);
      } else {
        console.error('API error:', responseData.error);
      }
    } catch (error) {
      console.error("Failed to load parking data:", error);
    }
  };

  const handlePark = async () => {
    setLoading(true);
    setFailed(false);
    setLotFull(false);
    
    // Check if lot is full based on latest data
    if (parkingData?.isFull) {
      setLotFull(true);
      setLoading(false);
      return;
    }
    
    const vehicle = randomVehicle();
    setLastVehicle(vehicle);
    
    try {
      // Use API to park the vehicle
      const response = await fetch('/api/parking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicleType: vehicle.type,
          licensePlate: vehicle.license
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setFailed(true);
        if (data.error === 'Parking lot is full') {
          setLotFull(true);
        }
      }
      
      // Reload parking data 
      await loadParkingData();
    } catch (error) {
      console.error("Error parking vehicle:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  // Render a single row of spots with appropriate visualization
  const renderSpots = (spots: ParkingSpot[]) => {
    // Create spaces for every 10 spots
    const spaces = spots.map((_, j) => (j % 10 === 0) ? "\n  " : "").join("");
    
    // Create visualization for each spot
    const spotChars = spots.map(spot => {
      if (spot.vehicle) {
        const vehicleType = spot.vehicle.getType ? spot.vehicle.getType() : spot.vehicle.type;
        if (vehicleType === "bus") return "B";
        if (vehicleType === "car") return "C";
        if (vehicleType === "motorcycle") return "M";
      }
      if (spot.spotType === "compact") return "c";
      if (spot.spotType === "large") return "l";
      if (spot.spotType === "motorcycle") return "m";
      return "?";
    }).join("");
    
    return spaces + spotChars;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Parking Lot</h1>
      <button 
        onClick={handlePark} 
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Parking...' : 'Park Random Vehicle'}
      </button>
      
      {lastVehicle && (
        <div className="mt-4">
          <strong>Last tried to park:</strong> {lastVehicle.type} (
          {lastVehicle.license})
        </div>
      )}
      
      {lotFull && <div className="mt-2 text-red-600 font-bold">Cannot park any more vehicles - Parking Lot is full!</div>}
      {failed && !lotFull && <div className="mt-2 text-red-600 font-bold">Parking Failed!</div>}
      
      <div className="mt-6 font-mono whitespace-pre bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Current Parking Status:</h2>
        {parkingData?.levels.map((level, i) => (
          <div key={i} className="mb-4">
            <div className="font-bold">Level {i}:</div>
            <div>
              {level.spots && renderSpots(level.spots)}
            </div>
          </div>
        ))}
      </div>
      
      {parkingData?.history && parkingData.history.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Recent Parking Activity:</h2>
          <div className="bg-white shadow overflow-hidden rounded-md">
            <ul className="divide-y divide-gray-200">
              {parkingData.history.slice(0, 5).map((entry, index) => (
                <li key={index} className="px-4 py-2">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {entry.vehicleType} ({entry.licensePlate})
                    </span>
                    <span className="text-gray-600">
                      {new Date(entry.timestamp).toLocaleString()} - {entry.action}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
