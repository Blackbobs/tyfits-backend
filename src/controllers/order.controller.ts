// src/controllers/order.controller.ts
import { Request, Response } from "express";
import Order from "../models/order.model";
import { IOrder, OrderStatus } from "../types/types";
import { isValidObjectId } from "../utils/valid-object.id";
import { Types } from "mongoose";


export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.userInfo?.id;

    // Validate user ID
    if (!isValidObjectId(userId as string)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find orders for the user with proper typing
    const orders = await Order.find({ user: userId })
    .populate<{
      items: {
        product: {
          _id: Types.ObjectId;
          title: string;
          price: number;
          images?: { url: string }[];
        };
        quantity: number;
        price: number;
      }[];
    }>
    ({
        path: 'items.product',
        select: 'title price images'
      })
      .sort({ createdAt: -1 }) 
      .lean()

    if (!orders || orders.length === 0) {
      return res.status(404).json({ 
        message: 'No orders found for this user',
        orders: []
      });
    }

    // Format the response with proper typing
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      createdAt: order.createdAt,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map(item => {
        const product = item.product as {
          _id: Types.ObjectId;
          title: string;
          price: number;
          images?: any[];
        };
      
        return {
          product: {
            _id: product._id,
            title: product.title,
            price: product.price,
            image: product.images?.[0]?.url || null,
          },
          quantity: item.quantity,
          price: item.price,
        };
      }),
      
    }));

    return res.status(200).json({ 
      message: 'Orders retrieved successfully',
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ 
      message: 'Server error while fetching orders' 
    });
  }
};

export const getAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username email')
      .populate<{ items: { product: { _id: Types.ObjectId; title: string; price: number } }[] }>({
        path: 'items.product',
        select: 'title price'
      })
      .exec();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    return res.status(200).json({ 
      message: "Orders fetched successfully", 
      orders 
    });

  } catch (error) {
    console.log("Error fetching all orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    
    if (!status) {
      return res.status(400).json({ message: "Order status is required" });
    }

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId, 
      { status }, 
      { new: true }
    ).exec();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ 
      message: "Order status updated successfully", 
      order 
    });

  } catch (error) {
    console.log("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findByIdAndDelete(orderId).exec();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ 
      message: "Order deleted successfully", 
      order 
    });

  } catch (error) {
    console.log("Error deleting order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};