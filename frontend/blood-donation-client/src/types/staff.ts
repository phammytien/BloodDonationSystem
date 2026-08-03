export interface StaffDto {
  userId: number;
  username: string;
  fullName?: string;
  email: string;
  phone?: string;
  isActive: boolean;
  roleId: number;
  createdAt: string;
  password?: string;
}
