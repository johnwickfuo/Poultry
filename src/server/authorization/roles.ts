export const ROLE_NAMES = {
  ADMIN: "admin",
  SELLER: "seller",
  MENTOR: "mentor",
  WORKER: "worker",
  EMPLOYER: "employer",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export function canAccessSellerDashboard(user: { sellerProfile?: { verificationStatus: string } | null; roles: Array<{ role: { name: string } }> }) {
  return user.sellerProfile?.verificationStatus === "APPROVED"
    && user.roles.some((assignment) => assignment.role.name === ROLE_NAMES.SELLER);
}
