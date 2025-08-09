import { Schema } from "mongoose";
import { IOrder, OrderStatus, ProductColor, ProductSize } from "../types/types";
import mongoose from "mongoose";

const OrderSchema = new Schema<IOrder>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  items: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      size: {  
        type: String,
        enum: Object.values(ProductSize),
      },
      color: {  
        type: String,
        enum: Object.values(ProductColor),
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.pending,
  },
  paymentInfo: {
    method: String,
    reference: String,
    status: {
      type: String,
      enum: ["success", "failed", "cancelled"],
    },
  },
  isDigital: {
    type: Boolean,
    default: false,
  },
  shippingAddress: {
    name: { type: String },
    phone: { type: String },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      postal_code: { type: String },
      country: { type: String },
    }
  }
}, { timestamps: true });

export default mongoose.model<IOrder>("Order", OrderSchema);
