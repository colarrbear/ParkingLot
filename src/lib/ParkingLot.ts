import { Level } from "../models/Level"
import type { Vehicle } from "../models/Vehicle"
import { DBConnector } from "./DBConnector"

export class ParkingLot {
  private levels: Level[]
  private readonly NUM_LEVELS = 5
  private dbConnector: DBConnector

  constructor() {
    this.levels = []
    for (let i = 0; i < this.NUM_LEVELS; i++) {
      this.levels.push(new Level(i, 30))
    }
  // Initialize levels...
    this.dbConnector = DBConnector.getInstance()
  }

  async parkVehicle(vehicle: Vehicle): Promise<boolean> {
    for (let i = 0; i < this.levels.length; i++) {
      const level = this.levels[i];
      const spotNumber = level.findAvailableSpotsForVehicle(vehicle);
      
      if (spotNumber >= 0) {
        if (level.parkVehicle(vehicle)) {
          // try to park in each level..., if successful, log to database
          // Log the parking event to the database with level and spot info
          await this.dbConnector.saveVehicleParked(vehicle, i, spotNumber);
          await this.dbConnector.saveParkingLotState(this);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Remove a vehicle from the parking lot
   * @param levelIndex The level where the vehicle is parked
   * @param spotIndex The spot where the vehicle is parked
   * @returns The removed vehicle or null if the spot was empty or invalid
   */
  async removeVehicle(levelIndex: number, spotIndex: number): Promise<Vehicle | null> {
    // Check if indices are valid
    if (levelIndex < 0 || levelIndex >= this.levels.length) {
      return null;
    }
    
    const level = this.levels[levelIndex];
    const spots = level.getSpots();
    
    if (spotIndex < 0 || spotIndex >= spots.length) {
      return null;
    }
    
    const spot = spots[spotIndex];
    const vehicle = spot.vehicle;
    
    if (!vehicle) {
      return null; // No vehicle in this spot
    }
    // Find vehicle
    
    // Get the number of spots this vehicle occupies
    const requiredSpots = vehicle.requiredSpots();
    
    // For multi-spot vehicles like buses, we need to find the first spot
    // where the vehicle is parked, as spots are allocated contiguously
    let firstSpotIndex = spotIndex;
    
    // Look backwards to find the first spot of the vehicle
    while (firstSpotIndex > 0 && 
           spots[firstSpotIndex - 1].vehicle === vehicle) {
      firstSpotIndex--;
    }
    
    // Now clear all spots occupied by this vehicle
    for (let i = 0; i < requiredSpots; i++) {
      const currentSpotIndex = firstSpotIndex + i;
      
      // Make sure we don't go out of bounds
      if (currentSpotIndex < spots.length) {
        const currentSpot = spots[currentSpotIndex];
        
        // Only clear if this spot has the same vehicle
        if (currentSpot.vehicle === vehicle) {
          currentSpot.removeVehicle();
          level.spotFreed();
        }
      }
    }
    
    // Log the vehicle removal to the database
    await this.dbConnector.saveVehicleLeft(vehicle, levelIndex, firstSpotIndex);
    await this.dbConnector.saveParkingLotState(this);
    
    return vehicle;
  }

  getLevels(): Level[] {
    return this.levels
  }

  isParkingLotFull(): boolean {
    return this.levels.every(level => level.getAvailableSpots() === 0)
  }

  async getParkingHistory(): Promise<any[]> {
    return await this.dbConnector.getParkingHistory();
  }
}
