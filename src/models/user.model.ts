import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/types';

const UserSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    address: { type: String, required : true},
    profilePicture: {
      type: String,
      required: false,
      default:
        'https://i.pinimg.com/originals/cf/7b/65/cf7b6579b699862233526da318a4d3fa.jpg',
    },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    orders: [{
      type: Schema.Types.ObjectId,
      ref: 'Order' 
    }]
  },
  { timestamps: true },
);

const User = mongoose.model<IUser>('Users', UserSchema);
export default User;