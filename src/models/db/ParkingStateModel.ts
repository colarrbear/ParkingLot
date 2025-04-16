import mongoose, { Schema, Document } from 'mongoose';

// Interface for an occupied parking spot
interface OccupiedSpot {
  spotType: string;
  spotIndex: number;
  levelIndex: number;
  vehicleType: string;
  licensePlate: string;
  timeParked: Date;
}

// Interface for our ParkingState document
export interface IParkingState extends Document {
  timestamp: Date;
  occupiedSpots: OccupiedSpot[];
  totalSpots: number;
  availableSpots: number;
}

// Create the schema
const OccupiedSpotSchema = new Schema({
  spotType: { type: String, required: true, enum: ['compact', 'large', 'motorcycle'] },
  spotIndex: { type: Number, required: true },
  levelIndex: { type: Number, required: true },
  vehicleType: { type: String, required: true, enum: ['car', 'bus', 'motorcycle'] },
  licensePlate: { type: String, required: true },
  timeParked: { type: Date, default: Date.now }
});

const ParkingStateSchema: Schema = new Schema({
  timestamp: { type: Date, default: Date.now },
  occupiedSpots: [OccupiedSpotSchema],
  totalSpots: { type: Number, required: true },
  availableSpots: { type: Number, required: true }
});

// Create and export the model
let ParkingStateModel: mongoose.Model<IParkingState>;

// Fix for "Cannot read properties of undefined (reading 'ParkingState')"
try {
  // Check if the model already exists to prevent model overwrite errors
  ParkingStateModel = mongoose.model<IParkingState>('ParkingState');
} catch (error) {
  // Model doesn't exist yet, so create it
  ParkingStateModel = mongoose.model<IParkingState>('ParkingState', ParkingStateSchema);
}

export default ParkingStateModel; 