import { ParkingSpot } from "./ParkingSpot"
import { ParkingSpotType } from "./ParkingSpotType"
import type { Vehicle } from "./Vehicle"

export class Level {
  private spots: ParkingSpot[]
  private availableSpots: number
  private static SPOTS_PER_ROW = 10

  constructor(
    public floor: number,
    numberSpots: number
  ) {
    this.spots = []
    const largeSpots = Math.floor(numberSpots / 4)
    const bikeSpots = Math.floor(numberSpots / 4)
    const compactSpots = numberSpots - largeSpots - bikeSpots

    for (let i = 0; i < numberSpots; i++) {
      let spotType = ParkingSpotType.Motorcycle
      if (i < largeSpots) {
        spotType = ParkingSpotType.Large
      } else if (i < largeSpots + compactSpots) {
        spotType = ParkingSpotType.Compact
      }
      const row = Math.floor(i / Level.SPOTS_PER_ROW)
      this.spots.push(new ParkingSpot(spotType, row, i))
    }
    this.availableSpots = numberSpots
  }

  getAvailableSpots(): number {
    return this.availableSpots
  }

  parkVehicle(vehicle: Vehicle): boolean {
    if (this.getAvailableSpots() < vehicle.requiredSpots()) return false
    const spotNumber = this.findAvailableSpots(vehicle)
    if (spotNumber < 0) return false
    return this.parkStartingAtSpot(spotNumber, vehicle)
  }

  private parkStartingAtSpot(spotNumber: number, vehicle: Vehicle): boolean {
    let success = true
    for (
      let i = spotNumber;
      i < spotNumber + vehicle.requiredSpots();
      i++
    ) {
      success = this.spots[i].park(vehicle) && success
    }
    if (success) {
      this.availableSpots -= vehicle.requiredSpots()
    }
    return success
  }

  private findAvailableSpots(vehicle: Vehicle): number {
    const spotsNeeded = vehicle.requiredSpots()
    let lastRow = -1
    let spotsFound = 0
    for (let i = 0; i < this.spots.length; i++) {
      const spot = this.spots[i]
      if (lastRow !== spot.row) {
        spotsFound = 0
        lastRow = spot.row
      }
      if (spot.canFitVehicle(vehicle)) {
        spotsFound++
      } else {
        spotsFound = 0
      }
      if (spotsFound === spotsNeeded) {
        return i - (spotsNeeded - 1)
      }
    }
    return -1
  }

  spotFreed(): void {
    this.availableSpots++
  }

  getSpots(): ParkingSpot[] {
    return this.spots
  }
}
