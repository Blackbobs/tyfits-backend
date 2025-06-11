import mongoose, { Document, Types } from "mongoose";

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

export interface IProducts {
  _id?: Types.ObjectId;
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
export enum Role {
    customer = 'customer',
    admin = 'admin'
}

export enum ProductType {
    physical = "physical",
    digital = "digital"
}