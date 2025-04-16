import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for our ParkingLog document
export interface IParkingLog extends Document {
  vehicleType: string;
  licensePlate: string;
  action: 'park' | 'leave';
  timestamp: Date;
  levelNumber: number;
  spotNumber: number;
}

// Create the schema
const ParkingLogSchema: Schema = new Schema({
  vehicleType: { type: String, required: true, enum: ['car', 'bus', 'motorcycle'] },
  licensePlate: { type: String, required: true },
  action: { type: String, required: true, enum: ['park', 'leave'] },
  timestamp: { type: Date, default: Date.now },
  levelNumber: { type: Number, required: true },
  spotNumber: { type: Number, required: true }
});

// Create and export the model
let ParkingLogModel: mongoose.Model<IParkingLog>;

// Fix for "Cannot read properties of undefined (reading 'ParkingLog')"
try {
  // Check if the model already exists to prevent model overwrite errors
  ParkingLogModel = mongoose.model<IParkingLog>('ParkingLog');
} catch (error) {
  // Model doesn't exist yet, so create it
  ParkingLogModel = mongoose.model<IParkingLog>('ParkingLog', ParkingLogSchema);
}

export default ParkingLogModel; 