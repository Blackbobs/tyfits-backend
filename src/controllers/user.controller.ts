import { Request, Response } from 'express';
import User from '../models/user.model';
import bcrypt from 'bcrypt';
import config from '../config/config';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { Role } from '../types/types';
import { isValidObjectId } from '../utils/valid-object.id';


interface CustomJwtPayload extends JwtPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}


export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password');
    res.status(200).json({
      message: 'Customers retrieved successfully',
      customers,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
};

export const getCustomerDetails = async (req: Request, res: Response) => {
  try {
    const {id} = req.params

    if (!isValidObjectId(id)) {
       res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
      return
    }

    const customer = await User.findOne({
      _id: id,
      role: 'customer'
    })
    .select('-password -__v')
    .populate({
      path: 'orders',
      select: '_id status totalAmount createdAt',
      options: { sort: { createdAt: -1 } },
      populate: {
        path: 'items.product',
        select: 'title price images',
        transform: (doc) => ({
          _id: doc._id,
          title: doc.title,
          price: doc.price,
          image: doc.images?.[0]?.url || null
        })
      }
    }); 

    if (!customer) {
       res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
      return
    }

    res.status(200).json({
      message: "Customer details retrieved successfully",
      customer,
    })
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
}


// create a user
export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, address, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        message: 'Email already in use',
      });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const validRoles = Object.values(Role);
    const userRole = validRoles.includes(role) ? role : Role.customer;

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      address,
      role: userRole,
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
      config.secretKey,
      { expiresIn: '7d' },
    );

    const { password: _, ...userWithoutPassword } = newUser.toObject();

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
    return;
  }
};

export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const { email, password } = req.body;

     if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const accessToken = jwt.sign(
      {
        id: user?._id,
        email: user?.email,
        username: user?.username,
        role: user?.role,
      },
      config.secretKey,
      { expiresIn: '7d' },
    );

    // TODO: save refresh token in the database or memory
    const refreshToken = jwt.sign(
      {
        id: user?._id,
        email: user?.email,
        username: user.username,
        role: user.role,
      },
      config.refreshKey,
      { expiresIn: '7d' },
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
};




export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
       res.status(401).json({ message: 'No refresh token provided' });
       return
    }
    console.log(123)

    jwt.verify(
      token,
      config.refreshKey,
      (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
        if (err || !decoded || typeof decoded === 'string') {
           res.status(403).json({ message: 'Invalid refresh token' });
           return
        }

        const { id, email, username, role } = decoded as CustomJwtPayload;

        const accessToken = jwt.sign({ id, email, username, role }, config.secretKey, {
          expiresIn: '15m',
        });

        const newRefreshToken = jwt.sign({ id, email, username, role }, config.refreshKey, {
          expiresIn: '7d',
        });

        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

         res.status(200).json({
          message: 'Token refreshed successfully',
          accessToken,
        });
        return
      }
    );
  } catch (err) {
    console.error('Refresh error:', err);
     res.status(500).json({ message: 'Internal server error' });
     return
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userInfo?.id;

    // Validate user ID
    if (!isValidObjectId(userId as string)) {
       res.status(400).json({ message: 'Invalid user ID' });
       return
    }

    // Check if required fields are provided
    if (!currentPassword || !newPassword) {
       res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
      return
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
       res.status(404).json({ message: 'User not found' });
       return
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
       res.status(401).json({ message: 'Current password is incorrect' });
       return
    }

    // Validate new password
    if (newPassword.length < 6) {
       res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
      return
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Return success response
     res.status(200).json({ 
      message: 'Password changed successfully' 
    });
    return

  } catch (error) {
    console.error('Error changing password:', error);
     res.status(500).json({ 
      message: 'Server error while changing password' 
    });
    return
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userInfo?.id;
    const { username, email, address, phone } = req.body;

    if (!isValidObjectId(userId as string)) {
       res.status(400).json({ message: 'Invalid user ID' });
       return
    }

  
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
         res.status(409).json({ 
          message: 'Email already in use by another account' 
        });
        return
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        username, 
        email, 
        address, 
        phone 
      },
      { 
        new: true,
        select: '-password -__v' 
      }
    );

    if (!updatedUser) {
       res.status(404).json({ message: 'User not found' });
       return
    }

     res.status(200).json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
    return
  } catch (error) {
    console.error('Error updating profile:', error);
     res.status(500).json({ 
      message: 'Server error while updating profile' 
    });
    return
  }
};