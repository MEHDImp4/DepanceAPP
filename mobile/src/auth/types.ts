export interface User {
  id: number;
  email: string;
  username: string;
  currency: string;
}

export interface TokenPair {
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface MobileLoginResponse extends TokenPair {
  user: User;
  newDevice: boolean;
}
