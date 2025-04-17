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
  index: number;
  row: number;
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
  const [removingVehicle, setRemovingVehicle] = useState(false)
  const [parkingData, setParkingData] = useState<ParkingLotData | null>(null)
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)

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
    setMessage(null);
    
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
      } else {
        setMessage({
          text: `${vehicle.type} parked successfully!`,
          type: 'success'
        });
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

  const handleRemoveVehicle = async (levelIndex: number, spotIndex: number) => {
    setRemovingVehicle(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/parking', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          levelIndex,
          spotIndex
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Check the vehicle type to show appropriate message
        const vehicleType = data.data?.vehicle?.type || 'vehicle';
        setMessage({
          text: `${vehicleType} removed successfully!`,
          type: 'success'
        });
        await loadParkingData();
      } else {
        setMessage({
          text: data.error || 'Failed to remove vehicle',
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Error removing vehicle:", error);
      setMessage({
        text: 'An error occurred while removing the vehicle',
        type: 'error'
      });
    } finally {
      setRemovingVehicle(false);
    }
  };

  // Helper to identify multi-spot vehicles and if a spot is the "main" spot
  const isMultiSpotVehicle = (spot: ParkingSpot): boolean => {
    if (!spot.vehicle) return false;
    const vehicleType = spot.vehicle.type || spot.vehicle.getType?.();
    return vehicleType === 'bus'; // Buses take 5 spots
  };

  // Find if this is the first spot of a multi-spot vehicle
  const isFirstSpotOfVehicle = (spots: ParkingSpot[], index: number): boolean => {
    if (index === 0) return true;
    const currentVehicle = spots[index].vehicle;
    return currentVehicle !== spots[index - 1].vehicle;
  };

  // Calculate how many consecutive spots this vehicle occupies
  const getConsecutiveSpots = (spots: ParkingSpot[], startIndex: number): number => {
    if (!spots[startIndex].vehicle) return 1;
    
    const vehicle = spots[startIndex].vehicle;
    let count = 0;
    
    for (let i = startIndex; i < spots.length; i++) {
      if (spots[i].vehicle === vehicle) {
        count++;
      } else {
        break;
      }
    }
    
    return count;
  };

  // Render a single row of spots with appropriate visualization
  const renderSpots = (level: Level, spots: ParkingSpot[]) => {
    return (
      <div className="grid grid-cols-10 gap-1 mt-2">
        {spots.map((spot, index) => {
          // Determine if this is a multi-spot vehicle and if it's the first spot
          const isMultiSpot = isMultiSpotVehicle(spot);
          const isFirstSpot = spot.vehicle && isFirstSpotOfVehicle(spots, index);
          const consecutiveSpots = isFirstSpot ? getConsecutiveSpots(spots, index) : 0;
          
          // Skip rendering spots that are part of a multi-spot vehicle but not the first spot
          if (spot.vehicle && isMultiSpot && !isFirstSpot) {
            return null;
          }
          
          // Get vehicle type for display
          const vehicleType = spot.vehicle ? 
            (spot.vehicle.type || spot.vehicle.getType?.()) : null;
          
          return (
            <div 
              key={index} 
              className={`
                flex items-center justify-center 
                ${spot.vehicle ? 'bg-blue-200' : 'bg-gray-200'}
                ${spot.spotType === 'large' ? 'border-2 border-green-500' : ''}
                ${spot.spotType === 'compact' ? 'border-2 border-blue-500' : ''}
                ${spot.spotType === 'motorcycle' ? 'border-2 border-yellow-500' : ''}
                rounded p-1 relative
                ${isMultiSpot && isFirstSpot ? `col-span-${Math.min(consecutiveSpots, 5)}` : ''}
                h-12
              `}
              style={{
                width: isMultiSpot && isFirstSpot ? 'auto' : '3rem'
              }}
            >
              {spot.vehicle ? (
                <>
                  <span className={`font-bold ${isMultiSpot ? 'text-lg' : 'text-sm'}`}>
                    {vehicleType === 'bus' ? 'BUS' : 
                     vehicleType === 'car' ? 'C' : 
                     vehicleType === 'motorcycle' ? 'M' : '?'}
                  </span>
                  <button
                    disabled={removingVehicle}
                    onClick={() => handleRemoveVehicle(level.floor, spot.index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 
                              flex items-center justify-center text-xs hover:bg-red-600"
                    title={`Remove ${vehicleType}`}
                  >
                    ×
                  </button>
                </>
              ) : (
                <span className="text-xs">{spot.spotType.charAt(0)}</span>
              )}
            </div>
          );
        }).filter(Boolean)}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Parking Lot</h1>
      
      {message && (
        <div className={`p-2 rounded mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}
      
      <button 
        onClick={handlePark} 
        disabled={loading || removingVehicle}
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
      
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Current Parking Status:</h2>
        <div className="mt-2 mb-4 grid grid-cols-3 gap-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 border-2 border-green-500 mr-2"></div>
            <span className="text-sm">Large Spot</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 border-2 border-blue-500 mr-2"></div>
            <span className="text-sm">Compact Spot</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 border-2 border-yellow-500 mr-2"></div>
            <span className="text-sm">Motorcycle Spot</span>
          </div>
        </div>
        {parkingData?.levels.map((level, i) => (
          <div key={i} className="mb-6 border p-3 rounded">
            <div className="font-bold text-lg">Level {level.floor}</div>
            {level.spots && renderSpots(level, level.spots)}
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
