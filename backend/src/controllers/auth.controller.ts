import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catchAsync';
import { ApiError } from '@/utils/ApiError';
import * as authService from '@/services/auth.service';
import { env } from '@/config/env';

const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax' as const,
  path: '/api/auth',
};

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, employee } = await authService.login(email, password);

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { accessToken, employee },
  });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token provided');

  const { accessToken } = await authService.refreshAccessToken(token);
  res.status(200).json({ success: true, data: { accessToken } });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await authService.logout(token);
  }
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const me = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: req.user });
});
