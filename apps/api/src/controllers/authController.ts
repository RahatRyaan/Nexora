import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Organization } from '../models/index.js';
import { config } from '../config/index.js';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: { message: 'Email and password are required', statusCode: 400 } });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, error: { message: 'Invalid credentials', statusCode: 401 } });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: { message: 'Invalid credentials', statusCode: 401 } });
      return;
    }

    const org = await Organization.findById(user.organization_id);

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        organization_id: user.organization_id.toString(),
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    user.last_login_at = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          organization_id: user.organization_id,
          organization_name: org?.name || 'Acme Enterprise Holdings',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized', statusCode: 401 } });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found', statusCode: 404 } });
      return;
    }

    const org = await Organization.findById(user.organization_id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          organization_id: user.organization_id,
          organization_name: org?.name,
        },
      },
    });
  } catch {
    res.status(401).json({ success: false, error: { message: 'Invalid token', statusCode: 401 } });
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
