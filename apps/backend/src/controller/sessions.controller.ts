import type { HttpSet } from '../interface/http.interface';
import type { LogoutDto, RefreshDto } from '../dto/sessions.dto';
import { revokeSession, refreshAccessToken } from '../services/sessions.service';

export async function logoutController({ body, set }: { body: LogoutDto; set: HttpSet }) {
  try {
    const revoked = await revokeSession(body.refresh_token);
    if (!revoked) {
      set.status = 401;
      return { error: 'Invalid token' };
    }
    return { success: true, message: 'User logged out successfully' };
  } catch (error: any) {
    set.status = 500;
    return { error: 'Internal server error' };
  }
}

export async function refreshController({ body, set }: { body: RefreshDto; set: HttpSet }) {
  try {
    const accessToken = await refreshAccessToken(body.refresh_token);
    if (!accessToken) {
      set.status = 401;
      return { error: 'Invalid token' };
    }
    return { success: true, data: { access_token: accessToken } };
  } catch (error: any) {
    set.status = 500;
    return { error: 'Internal server error' };
  }
}
