export interface User {
  id: number;
  loginId: string;
  displayName: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  createdAt: string;
}

export interface MenuPermission {
  menuId: number;
  menuCode: string;
  menuName: string;
  menuRoute: string;
  canAccess: boolean;
}

export interface UserPermissions {
  userId: number;
  loginId: string;
  displayName: string;
  role: string;
  permissions: MenuPermission[];
}

export interface MenuItem {
  id: number;
  code: string;
  name: string;
  route: string;
}

export interface CurrentUser {
  id: number;
  loginId: string;
  displayName: string;
  role: 'ADMIN' | 'USER';
}
