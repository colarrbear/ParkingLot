// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { ParkingLot } from "../../lib/ParkingLot";
import { DBConnector } from "../../lib/DBConnector";
import { Car } from "../../models/Car";
import { Bus } from "../../models/Bus";
import { Motorcycle } from "../../models/Motorcycle";
import dbConnect from "../../lib/db";

type ParkingResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};

// Create a singleton parking lot instance
const parkingLot = new ParkingLot();
const dbConnector = DBConnector.getInstance();

// Helper function to serialize level data for API response
function serializeLevels(levels: any[]) {
  return levels.map((level) => {
    return {
      floor: level.floor,
      spots: level.getSpots().map((spot: any) => ({
        spotType: spot.spotType,
        row: spot.row,
        index: spot.index,
        vehicle: spot.vehicle 
          ? {
              licensePlate: spot.vehicle.licensePlate,
              type: spot.vehicle.getType()
            }
          : null
      }))
    };
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParkingResponse>
) {
  // Connect to MongoDB
  await dbConnect();
  
  if (req.method === 'GET') {
    try {
      // Get parking history from database
      const history = await dbConnector.getParkingHistory();
      
      // Serialize the levels for client consumption
      const serializedLevels = serializeLevels(parkingLot.getLevels());
      
      // Return the current state of the parking lot
      return res.status(200).json({
        success: true,
        message: "Parking lot data retrieved",
        data: {
          levels: serializedLevels,
          isFull: parkingLot.isParkingLotFull(),
          history
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve parking data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  } else if (req.method === 'POST') {
    // Handle parking a new vehicle
    try {
      const { vehicleType, licensePlate } = req.body;
      
      if (!vehicleType || !licensePlate) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          error: "Vehicle type and license plate are required"
        });
      }
      
      let vehicle;
      switch (vehicleType.toLowerCase()) {
        case 'car':
          vehicle = new Car(licensePlate);
          break;
        case 'bus':
          vehicle = new Bus(licensePlate);
          break;
        case 'motorcycle':
          vehicle = new Motorcycle(licensePlate);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid vehicle type",
            error: "Vehicle type must be car, bus, or motorcycle"
          });
      }
      
      const parked = await parkingLot.parkVehicle(vehicle);
      
      if (parked) {
        // Serialize the levels for client consumption
        const serializedLevels = serializeLevels(parkingLot.getLevels());
        
        return res.status(200).json({
          success: true,
          message: `${vehicleType} parked successfully`,
          data: { 
            vehicle,
            levels: serializedLevels,
            isFull: parkingLot.isParkingLotFull()
          }
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "Could not park vehicle",
          error: parkingLot.isParkingLotFull() ? "Parking lot is full" : "No suitable spots available"
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  } else if (req.method === 'DELETE') {
    // Handle removing a vehicle
    try {
      const { levelIndex, spotIndex } = req.body;
      
      if (levelIndex === undefined || spotIndex === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          error: "Level index and spot index are required"
        });
      }
      
      const vehicle = await parkingLot.removeVehicle(
        parseInt(levelIndex),
        parseInt(spotIndex)
      );
      
      if (vehicle) {
        // Serialize the levels for client consumption
        const serializedLevels = serializeLevels(parkingLot.getLevels());
        
        return res.status(200).json({
          success: true,
          message: `${vehicle.getType()} removed successfully`,
          data: { 
            vehicle,
            levels: serializedLevels,
            isFull: false // It cannot be full anymore since we just removed a vehicle
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Could not remove vehicle",
          error: "No vehicle found at the specified location"
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
      error: "Only GET, POST, and DELETE methods are allowed"
    });
  }
}
