import { Request, Response, NextFunction } from 'express';
import Redis from '../config/redis/index.ts';
import {
  RoleType,
  permissions,
  defaultPermission
} from '../models/permission.ts';
import { message } from '../utilities/constants/index.ts';

export const getPermission = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const roleName = (req as any)?.user?.role?.name as RoleType;
    const data = await Redis.get(`${roleName}-permissions`);
    if (!data) {
      const userPermission = permissions[roleName];
      await Redis.set(
        `${roleName}-permissions`,
        JSON.stringify(userPermission)
      );
      return res.status(200).json({ data: userPermission });
    }
    return res.status(200).json({ data: JSON.parse(data) });
  } catch (error) {
    return res.status(500).json({
      message: message.INTERNAL_SERVER_ERROR,
      error
    });
  }
};

export const getAllPermission = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    return res
      .status(200)
      .json({ data: defaultPermission, message: message.SUCCESS });
  } catch (error) {
    return next(error);
  }
};
