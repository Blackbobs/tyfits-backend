// src/controllers/order.controller.ts
import { Request, Response } from "express";
import Order from "../models/order.model";
import { OrderStatus, PopulatedOrderItem } from "../types/types";
import { isValidObjectId } from "../utils/valid-object.id";


export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.userInfo?.id;

    if (!isValidObjectId(userId as string)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const orders = await Order.find({ user: userId })
      .populate<{ items: PopulatedOrderItem[] }>({
        path: 'items.product',
        select: 'title price images'
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!orders || orders.length === 0) {
      res.status(200).json({ 
        message: 'No orders found for this user',
        orders: []
      });
      return;
    }

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      createdAt: order.createdAt,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map(item => ({
        product: {
          _id: item.product._id,
          title: item.product.title,
          price: item.product.price,
          image: item.product.images?.[0]?.url || null,
        },
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color
      }))
    }));

    res.status(200).json({ 
      message: 'Orders retrieved successfully',
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      message: 'Server error while fetching orders' 
    });
  }
};

export const getAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username email')
      .populate<{ items: PopulatedOrderItem[] }>({
        path: 'items.product',
        select: 'title price'
      })
      .exec();

    const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      items: order.items.map(item => ({
        product: {
          _id: item.product._id,
          title: item.product.title,
          price: item.product.price
        },
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color
      }))
    }));

    res.status(200).json({ 
      message: "Orders fetched successfully", 
      orders: formattedOrders
    });
  } catch (error) {
    console.log("Error fetching all orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "user",
        select: "username email" 
      })
      .populate<{ items: PopulatedOrderItem[] }>({
        path: "items.product",
        select: "title price images" 
      })
      .lean();

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json({
      message: "Order retrieved successfully",
      order: {
        _id: order._id,
        createdAt: order.createdAt,
        status: order.status,
        totalAmount: order.totalAmount,
        user: order.user, 
        items: order.items.map(item => ({
          product: {
            _id: item.product._id,
            title: item.product.title,
            price: item.product.price,
            images: item.product.images || [], 
            image: item.product.images?.[0]?.url || null
          },
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    res.status(500).json({ message: "Server error while fetching order" });
  }
};

// The updateOrderStatus and deleteOrder functions remain exactly the same
// as they don't need to handle size/color information
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(orderId)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }
    
    if (!status) {
      res.status(400).json({ message: "Order status is required" });
      return;
    }

    if (!Object.values(OrderStatus).includes(status)) {
      res.status(400).json({ message: "Invalid order status" });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      orderId, 
      { status }, 
      { new: true }
    ).exec();

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json({ 
      message: "Order status updated successfully", 
      order 
    });
  } catch (error) {
    console.log("Error updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await Order.findByIdAndDelete(orderId).exec();

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json({ 
      message: "Order deleted successfully", 
      order 
    });
  } catch (error) {
    console.log("Error deleting order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};