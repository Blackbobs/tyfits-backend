import mongoose, { Schema } from "mongoose";
import { IProducts, ProductType } from "../types/types";

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
    createdBy: { type: Schema.Types.ObjectId, ref: "Users", required: true },
}, {timestamps: true});

export default mongoose.model<IProducts>("Product", ProductSchema);