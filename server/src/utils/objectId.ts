import mongoose from "mongoose";

export function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}
