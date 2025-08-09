import mongoose from "mongoose";
import { Schema } from "mongoose";
import { ICart, ICartItem, ProductColor, ProductSize } from "../types/types";

const CartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
    },
    size: {  
      type: String,
      enum: Object.values(ProductSize),
      required: false
    },
    color: {  
      type: String,
      enum: Object.values(ProductColor),
      required: false
    }
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        unique: true,
        required: true,
    },
    items: [CartItemSchema]
}, {timestamps: true});


export default mongoose.model<ICart>("Cart", cartSchema);