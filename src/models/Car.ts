import { Vehicle } from "./Vehicle"
import { ParkingSpotType } from "./ParkingSpotType"

export class Car extends Vehicle {
  canFitInSpot(spotType: ParkingSpotType): boolean {
    return (
      spotType === ParkingSpotType.Compact ||
      spotType === ParkingSpotType.Large
    )
  }
  requiredSpots(): number {
    return 1
  }
  getType(): string {
    return "car"
  }
}
