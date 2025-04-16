import { Level } from "./Level"
import type { Vehicle } from "./Vehicle"

export class ParkingLot {
  private levels: Level[]
  private readonly NUM_LEVELS = 5

  constructor() {
    this.levels = []
    for (let i = 0; i < this.NUM_LEVELS; i++) {
      this.levels.push(new Level(i, 30))
    }
  }

  parkVehicle(vehicle: Vehicle): boolean {
    for (const level of this.levels) {
      if (level.parkVehicle(vehicle)) {
        return true
      }
    }
    return false
  }

  getLevels(): Level[] {
    return this.levels
  }

  isParkingLotFull(): boolean {
    return this.levels.every(level => level.getAvailableSpots() === 0)
  }
}
