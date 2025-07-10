import { Request, Response } from "express";
import Order from "../models/order.model";
import { OrderStatus } from "../types/types";
import { isValidObjectId } from "../utils/valid-object.id";

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.userInfo?.id;
    const orders = await Order.find({ user: userId }).populate("items.product").exec();
    if(!orders.length){
      res.status(404).json({ message: "No orders found" })
    }
    res.status(200).json({ message: "Orders fetched successfully", orders });
  } catch (error) {
    console.log("Error fetching user orders:", error)
    res.status(500).json({ message: "Internal server error" })
}
}

export const getAllOrders = async (_req: Request, res: Response) => {
  try {
  const orders = await Order.find().populate("items.product").exec();

  if(!orders){
    res.status(404).json({ message: "No orders found" })
    return
  }

  res.status(200).json({ message: "Orders fetched successfully", orders });

  } catch (error) {
    console.log("Error fetching all orders:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

      if (!isValidObjectId(orderId)) {
       res.status(400).json({ message: "Invalid order ID" });
       return
    }
    if (!status) {
      res.status(400).json({ message: "Order status is required" });
      return;
    }

    if (!Object.values(OrderStatus).includes(status)) {
      res.status(400).json({ message: "Invalid order status" });
      return;
    }

    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true }).exec();
    
    if(!order){
      res.status(404).json({ message: "Order not found" })
      return;
    }

    res.status(200).json({ message: "Order status updated successfully", order });

  } catch (error) {
    console.log("Error updating order status:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndDelete(orderId).exec();

    if(!order){
      res.status(404).json({ message: "Order not found" })
      return;
    }

    res.status(200).json({ message: "Order deleted successfully", order });

  } catch (error) {
    console.log("Error deleting order:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}