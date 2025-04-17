import { Vehicle } from "./Vehicle"
import { ParkingSpotType } from "./ParkingSpotType"

export class Bus extends Vehicle {
  canFitInSpot(spotType: ParkingSpotType): boolean {
    return spotType === ParkingSpotType.Large
  }
  requiredSpots(): number {
    return 5 // 5 spots for a bus
  }
  getType(): string {
    return "bus"
  }
}
