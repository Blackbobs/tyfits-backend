import { Document } from "mongoose";

export interface IUsers extends Document {
  username: string;
  email: string;
  address: string;
  password: string;
  profilePicture?: string;
  role: Role;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum Role {
    customer = 'customer',
    admin = 'admin'
}