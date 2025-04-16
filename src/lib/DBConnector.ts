import { ParkingLot } from "./ParkingLot";
import { Vehicle } from "../models/Vehicle";
import dbConnect from "./db";
import ParkingLogModel from "../models/db/ParkingLogModel";
import ParkingStateModel from "../models/db/ParkingStateModel";
import { Level } from "../models/Level";
import { ParkingSpot } from "../models/ParkingSpot";

// Database connector using Mongoose
export class DBConnector {
  private static instance: DBConnector;
  
  private constructor() {
    // Initialize database connection
    this.initializeDB();
  }
  
  private async initializeDB() {
    try {
      await dbConnect();
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }
  
  public static getInstance(): DBConnector {
    if (!DBConnector.instance) {
      DBConnector.instance = new DBConnector();
    }
    return DBConnector.instance;
  }
  
  public async saveVehicleParked(vehicle: Vehicle, level?: number, spotIndex?: number): Promise<void> {
    try {
      await dbConnect();
      
      // Create a new parking log entry
      await ParkingLogModel.create({
        vehicleType: vehicle.getType(),
        licensePlate: vehicle.licensePlate,
        action: 'park',
        timestamp: new Date(),
        levelNumber: level || 0,
        spotNumber: spotIndex || 0
      });
      
      console.log(`Saved parking event for ${vehicle.getType()} ${vehicle.licensePlate}`);
    } catch (error) {
      console.error('Error saving parking event:', error);
    }
  }
  
  public async saveVehicleLeft(vehicle: Vehicle, level?: number, spotIndex?: number): Promise<void> {
    try {
      await dbConnect();
      
      // Create a leaving log entry
      await ParkingLogModel.create({
        vehicleType: vehicle.getType(),
        licensePlate: vehicle.licensePlate,
        action: 'leave',
        timestamp: new Date(),
        levelNumber: level || 0,
        spotNumber: spotIndex || 0
      });
      
      console.log(`Saved leaving event for ${vehicle.getType()} ${vehicle.licensePlate}`);
    } catch (error) {
      console.error('Error saving leaving event:', error);
    }
  }
  
  public async getParkingHistory(): Promise<any[]> {
    try {
      await dbConnect();
      // Get the most recent parking logs
      const logs = await ParkingLogModel.find()
        .sort({ timestamp: -1 })
        .limit(100);
      
      return logs;
    } catch (error) {
      console.error('Error getting parking history:', error);
      return [];
    }
  }
  
  public async saveParkingLotState(parkingLot: ParkingLot): Promise<void> {
    try {
      await dbConnect();
      
      const levels = parkingLot.getLevels();
      const occupiedSpots: any[] = [];
      
      let totalSpots = 0;
      let availableSpots = 0;
      
      // Gather data from all levels
      levels.forEach((level: Level, levelIndex: number) => {
        const spots = level.getSpots();
        
        spots.forEach((spot: ParkingSpot, spotIndex: number) => {
          totalSpots++;
          
          if (spot.isAvailable()) {
            availableSpots++;
          } else if (spot.vehicle) {
            // Add occupied spot data
            occupiedSpots.push({
              spotType: spot.spotType,
              spotIndex,
              levelIndex,
              vehicleType: spot.vehicle.getType(),
              licensePlate: spot.vehicle.licensePlate,
              timeParked: new Date()
            });
          }
        });
      });
      
      // Save the state to MongoDB
      await ParkingStateModel.create({
        timestamp: new Date(),
        occupiedSpots,
        totalSpots,
        availableSpots
      });
      
      console.log('Parking lot state saved to database');
    } catch (error) {
      console.error('Error saving parking lot state:', error);
    }
  }
}
