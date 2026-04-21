import { SignJWT, jwtVerify } from 'jose';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  workspaceId: string;
}

const encoder = new TextEncoder();

function getSecret(secret: string) {
  return encoder.encode(secret);
}

/**
 * Sign an access token.
 */
export async function signAccessToken(
  payload: JwtPayload,
  secret: string,
  expiresIn: string = '15m',
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setSubject(payload.sub)
    .sign(getSecret(secret));
}

/**
 * Sign a refresh token (longer-lived).
 */
export async function signRefreshToken(
  payload: Pick<JwtPayload, 'sub'>,
  secret: string,
  expiresIn: string = '7d',
): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setSubject(payload.sub)
    .sign(getSecret(secret));
}

/**
 * Verify and decode a JWT.
 */
export async function verifyToken(
  token: string,
  secret: string,
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(secret));
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
