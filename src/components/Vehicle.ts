import type { ParkingSpotType } from "./ParkingSpotType"

export abstract class Vehicle {
  public parkingSpots: number[] = []
  constructor(public licensePlate: string) {}

  abstract canFitInSpot(spotType: ParkingSpotType): boolean
  abstract requiredSpots(): number
  abstract getType(): string
}
