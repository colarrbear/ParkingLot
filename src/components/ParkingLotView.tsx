"use client"
import React, { useState } from "react"
import { ParkingLot } from "./ParkingLot"
import { Bus } from "./Bus"
import { Car } from "./Car"
import { Motorcycle } from "./Motorcycle"
import { Vehicle } from "./Vehicle"

const lot = new ParkingLot()

function randomVehicle(): Vehicle {
  const r = Math.random()
  const license = Math.random().toString(36).substring(2, 8)
  if (r < 0.2) return new Bus(license)
  if (r < 0.4) return new Motorcycle(license)
  return new Car(license)
}

export default function ParkingLotView() {
  const [_, setRerender] = useState(0)
  const [lastVehicle, setLastVehicle] = useState<Vehicle | null>(null)
  const [failed, setFailed] = useState(false)
  const [lotFull, setLotFull] = useState(false)

  const handlePark = () => {
    setFailed(false)
    setLotFull(false)
    
    // Check if lot is full first
    if (lot.isParkingLotFull()) {
      setLotFull(true)
      return;
    }
    
    const v = randomVehicle()
    setLastVehicle(v)
    if (!lot.parkVehicle(v)) {
      setFailed(true)
    }
    setRerender((x) => x + 1)
  }

  return (
    <div>
      <h1>Parking Lot</h1>
      <button onClick={handlePark}>
        Park Random Vehicle
      </button>
      {lastVehicle && (
        <div>
          <strong>Last tried to park:</strong> {lastVehicle.getType()} (
          {lastVehicle.licensePlate})
        </div>
      )}
      {lotFull && <div style={{ color: "red" }}>Cannot park any more vehicles - Parking Lot is full!</div>}
      {failed && !lotFull && <div style={{ color: "red" }}>Parking Failed!</div>}
      <div style={{ fontFamily: "monospace", whiteSpace: "pre" }}>
        {lot.getLevels().map((level, i) => (
          <div key={i}>
            Level {i}:
            <br />
            {level.getSpots().map((spot, j) => {
              if (j % 10 === 0) return "\n  "
              return ""
            })}
            {level.getSpots().map((spot, j) => {
              if (spot.vehicle) {
                if (spot.vehicle.getType() === "bus") return "B"
                if (spot.vehicle.getType() === "car") return "C"
                if (spot.vehicle.getType() === "motorcycle") return "M"
              }
              if (spot.spotType === "compact") return "c"
              if (spot.spotType === "large") return "l"
              if (spot.spotType === "motorcycle") return "m"
              return "?"
            })}
            <br />
          </div>
        ))}
      </div>
    </div>
  )
}
