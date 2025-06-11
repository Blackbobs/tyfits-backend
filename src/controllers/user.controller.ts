import { Request, Response } from 'express';
import User from '../models/user.model';
import bcrypt from 'bcrypt';
import config from '../config/config';
import jwt from 'jsonwebtoken';
import { Role } from '../types/types';

// Get all users
const getAllUsers = async () => {};

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
      { expiresIn: '15m' },
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
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token not provided' });
    }

    jwt.verify(
      refreshToken,
      config.refreshKey,
      (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err) {
          res.status(403).json({ message: 'Invalid refresh token' });
        }

        const newAccessToken = jwt.sign(
          {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role,
          },
          config.secretKey,
          { expiresIn: '15m' },
        );

        res.status(200).json({
          message: 'New access token generated',
          accessToken: newAccessToken,
        });
      },
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
};
