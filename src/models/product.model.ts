import mongoose, { Schema } from "mongoose";
import { IProducts, ProductSize, ProductColor, ProductType } from "../types/types";

const ProductSchema = new Schema<IProducts>({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  images: [
    {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
  ],
  type: { type: String, enum: Object.values(ProductType), required: true },
  stock: { type: Number, default: 0 },
  file: {
    url: { type: String },
    publicId: { type: String },
  },
  sizes: {
    type: [String],
    enum: Object.values(ProductSize),
    default: [],
  },
  colors: {
    type: [String],
    enum: Object.values(ProductColor),
    default: [],
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "Users", required: true },
}, { timestamps: true });

ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IProducts>("Product", ProductSchema);