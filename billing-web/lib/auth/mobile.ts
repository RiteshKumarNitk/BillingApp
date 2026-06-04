import jwt, { JwtPayload } from 'jsonwebtoken';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error('JWT_SECRET environment variable is required for mobile authentication. Set it in your .env file.');
}
const JWT_SECRET: string = rawSecret;

export function signMobileToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyMobileToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getMobileUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyMobileToken(token);
  if (!decoded || typeof decoded === 'string') {
    return null;
  }
  return decoded;
}
