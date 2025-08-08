import { Schema } from "mongoose";
import { IOrder, OrderStatus } from "../types/types";
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
    },
    isDigital: {
        type: Boolean,
        default: false,
    },
    }, { timestamps: true });

    export default mongoose.model<IOrder>("Order", OrderSchema);