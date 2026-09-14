export interface RegisterDto {
  organization_name?: string;
  full_name: string;
  phone_number?: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ProfileDto {
  user: {
    id: number;
    name: string;
    email: string;
    type: 'OWNER' | 'PERSONAL' | 'MEMBER' | 'ADMIN';
    organization: { id: number; name: string; slug: string } | null;
  };
  wallet: { balance: string; currency: string };
}
