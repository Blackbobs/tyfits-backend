import mongoose, { Document, Types } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  address: string;
  password: string;
  profilePicture?: string;
  role: Role;
  orders?: Types.ObjectId[] | PopulatedOrder[];
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
  sizes?: ProductSize[];
  colors?: ProductColor[];
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
    size: string;
    color: string;
  }[];
  totalAmount: number;
  status: OrderStatus;
  paymentInfo: {
    method: string;
    reference: string;
    status: 'success' | 'failed' | 'cancelled';
  };
  isDigital: boolean;
  shippingAddress?: {
    name?: string;
    phone?: string;
    address: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICartItem {
  product: IProducts;
  quantity: number;
  size?: string; 
  color?: string;
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

export enum ProductSize {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
}

export enum ProductColor {
  RED = 'Red',
  BLUE = 'Blue',
  GREEN = 'Green',
  BLACK = 'Black',
  WHITE = 'White',
  YELLOW = 'Yellow',
  BROWN = 'Brown',
  PURPLE = 'Purple',
  ORANGE = 'Orange',
  PINK = 'Pink',
  // add more named colors as needed
}

 
 export interface PopulatedOrderItem {
  product: {
    _id: Types.ObjectId;
    title: string;
    price: number;
    images?: { url: string }[];
  } | Types.ObjectId; 
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface PopulatedOrder {
  _id: Types.ObjectId;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  items: PopulatedOrderItem[];
}


