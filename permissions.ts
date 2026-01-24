import { UserRole, RolePermissions } from './types';

// Role-based permissions configuration
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
    admin: {
        canViewSales: true,
        canCreateSales: true,
        canEditSales: true,
        canDeleteSales: true,
        canViewReports: true,
        canManageInventory: true,
        canManageCustomers: true,
        canManageExpenses: true,
        canViewSettings: true,
        canManageSettings: true,
        canManageStaff: true,
        canManageUsers: true,
        canViewComplaints: true,
        canEditComplaints: true,
        canAccessBilling: true,
        canAccessPurchase: true,
        canAccessAnalytics: true,
    },
    employee: {
        canViewSales: true,
        canCreateSales: false,
        canEditSales: false,
        canDeleteSales: false,
        canViewReports: false,
        canManageInventory: false,
        canManageCustomers: false,
        canManageExpenses: false,
        canViewSettings: false,
        canManageSettings: false,
        canManageStaff: false,
        canManageUsers: false,
        canViewComplaints: true,
        canEditComplaints: true,
        canAccessBilling: false,
        canAccessPurchase: false,
        canAccessAnalytics: false,
    },
    manager: {
        canViewSales: true,
        canCreateSales: true,
        canEditSales: true,
        canDeleteSales: false,
        canViewReports: true,
        canManageInventory: true,
        canManageCustomers: true,
        canManageExpenses: true,
        canViewSettings: true,
        canManageSettings: false,
        canManageStaff: false,
        canManageUsers: false,
        canViewComplaints: true,
        canEditComplaints: true,
        canAccessBilling: true,
        canAccessPurchase: true,
        canAccessAnalytics: true,
    },
};

/**
 * Get permissions for a given role
 */
export function getPermissions(role: UserRole): RolePermissions {
    return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
    role: UserRole,
    permission: keyof RolePermissions
): boolean {
    return ROLE_PERMISSIONS[role][permission];
}

/**
 * Get route access based on role
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
    const permissions = getPermissions(role);

    const routePermissionMap: Record<string, keyof RolePermissions> = {
        'sales': 'canViewSales',
        'billing': 'canAccessBilling',
        'sale_report': 'canViewReports',
        'items': 'canManageInventory',
        'inventory': 'canManageInventory',
        'customers': 'canManageCustomers',
        'expenses': 'canManageExpenses',
        'settings': 'canManageSettings',
        'staff_control': 'canManageStaff',
        'purchase': 'canAccessPurchase',
        'dashboard': 'canAccessAnalytics',
        'business': 'canAccessAnalytics',
        'complaints': 'canViewComplaints',
        'payment_receipt': 'canAccessBilling',
    };

    const requiredPermission = routePermissionMap[route];
    if (!requiredPermission) {
        // If route is not in the map, allow access by default
        return true;
    }

    return permissions[requiredPermission];
}
