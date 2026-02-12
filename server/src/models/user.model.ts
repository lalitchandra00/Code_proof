import mongoose, { Schema, Document, Model } from "mongoose";

type UsageHistoryEntry = {
  date: string;
  count: number;
};

const startOfCurrentMonth = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
};

export interface UserDocument extends Document {
  userId: string;
  linkedClientIds: string[];
  plan: "free" | "premium";
  monthlyLimit: number;
  monthlyUsed: number;
  usageHistory: UsageHistoryEntry[];
  resetAt: Date;
  createdAt: Date;
  lastLoginAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    userId: { type: String, required: true, unique: true },
    linkedClientIds: { type: [String], required: true, default: [] },
    plan: { type: String, required: true, default: "free", enum: ["free", "premium"] },
    monthlyLimit: { type: Number, required: true, default: 20 },
    monthlyUsed: { type: Number, required: true, default: 0 },
    usageHistory: {
      type: [
        {
          date: { type: String, required: true },
          count: { type: Number, required: true },
        },
      ],
      required: true,
      default: [],
    },
    resetAt: { type: Date, required: true, default: startOfCurrentMonth },
    createdAt: { type: Date, required: true, default: Date.now },
    lastLoginAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false }
);

export const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);
