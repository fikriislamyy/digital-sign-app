import type { HttpSet } from '../interface/http.interface';
import type { RegisterDto, LoginDto } from '../dto/users.dto';
import type { User } from '../models/users.model';
import { registerUser, loginUser, getProfile } from '../services/users.service';

export async function registerController({ body, set }: { body: RegisterDto; set: HttpSet }) {
  try {
    const result = await registerUser({
      fullName: body.full_name,
      email: body.email,
      password: body.password,
      phoneNumber: body.phone_number,
      organizationName: body.organization_name,
    });

    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      },
    };
  } catch (error: any) {
    if (error?.message === 'Email already registered') {
      set.status = 400;
      return { error: 'Email already registered' };
    }
    set.status = 500;
    return { error: 'Internal server error' };
  }
}

export async function loginController({ body, set }: { body: LoginDto; set: HttpSet }) {
  try {
    const result = await loginUser({
      email: body.email,
      password: body.password,
    });

    return {
      success: true,
      message: 'User logged in successfully',
      data: {
        user: result.user,
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      },
    };
  } catch (error: any) {
    if (error?.message === 'Invalid email or password') {
      set.status = 401;
      return { error: 'Invalid email or password' };
    }
    set.status = 500;
    return { error: 'Internal server error' };
  }
}

export async function meController({ user }: { user: User }) {
  return { success: true, data: await getProfile(user) };
}
