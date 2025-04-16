import { Vehicle } from "./Vehicle"
import { ParkingSpotType } from "./ParkingSpotType"

export class Motorcycle extends Vehicle {
  canFitInSpot(spotType: ParkingSpotType): boolean {
    return true
  }
  requiredSpots(): number {
    return 1
  }
  getType(): string {
    return "motorcycle"
  }
}
