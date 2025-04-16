import type { Vehicle } from "./Vehicle"
import type { ParkingSpotType } from "./ParkingSpotType"

export class ParkingSpot {
  public vehicle: Vehicle | null = null

  constructor(
    public spotType: ParkingSpotType,
    public row: number,
    public index: number
  ) {}

  isAvailable(): boolean {
    return this.vehicle === null
  }

  canFitVehicle(vehicle: Vehicle): boolean {
    return this.isAvailable() && vehicle.canFitInSpot(this.spotType)
  }

  park(vehicle: Vehicle): boolean {
    if (!this.canFitVehicle(vehicle)) return false
    this.vehicle = vehicle
    return true
  }

  removeVehicle(): void {
    this.vehicle = null
  }
}
