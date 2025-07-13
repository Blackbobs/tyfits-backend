  import mongoose, { Document, Types } from 'mongoose';

  export interface IUser extends Document {
    username: string;
    email: string;
    address: string;
    password: string;
    profilePicture?: string;
    role: Role;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface IProducts extends Document {
    _id: Types.ObjectId;
    title: string;
    description?: string;
    price: number;

    images?: {
      url: string;
      publicId: string;
    }[];

    file?: {
      url: string;
      publicId: string;
    };

    type: ProductType;
    stock?: number;
    createdBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface IOrder extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    items: {
      product: Types.ObjectId;
      quantity: number;
      price: number;
    }[];
    totalAmount: number;
    status: OrderStatus;
    paymentInfo: {
      method: string;
      reference: string;
      status: 'success' | 'failed' | 'cancelled';
    };
    isDigital: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface ICartItem {
    product: IProducts;
    quantity: number;
  }

  export interface ICart extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    items: ICartItem[];
    createdAt?: Date;
    updatedAt?: Date;
  }

  export enum OrderStatus {
    pending = 'pending',
    processing = 'processing',
    shipped = 'shipped',
    delivered = 'delivered',
    cancelled = 'cancelled',
  }
  export enum Role {
    customer = 'customer',
    admin = 'admin',
  }
    
  export enum ProductType {
    physical = 'physical',
    digital = 'digital',
  }
