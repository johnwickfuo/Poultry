export const ROLE_NAMES = {
  ADMIN: "admin",
  SELLER: "seller",
  MENTOR: "mentor",
  WORKER: "worker",
  EMPLOYER: "employer",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];
