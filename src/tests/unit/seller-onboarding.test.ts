import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sellerProfile: { findUnique: vi.fn(), upsert: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  role: { findUnique: vi.fn() },
  userRole: { upsert: vi.fn(), deleteMany: vi.fn() },
  mail: { submitted: vi.fn(), approved: vi.fn(), rejected: vi.fn() },
}));

vi.mock("@/server/database/prisma", () => ({
  prisma: {
    sellerProfile: mocks.sellerProfile,
    role: mocks.role,
    userRole: mocks.userRole,
    $transaction: vi.fn(async (callback: (transaction: unknown) => unknown) => callback({ sellerProfile: mocks.sellerProfile, role: mocks.role, userRole: mocks.userRole })),
  },
}));
vi.mock("@/server/emails/seller-events", () => ({ SellerMailHooks: mocks.mail }));

import { canAccessSellerDashboard } from "@/server/authorization/roles";
import { approveSellerApplication, rejectSellerApplication, restoreSellerApplication, saveSellerDraft, submitSellerApplication, suspendSellerApplication } from "@/server/services/seller-onboarding";

const application = {
  id: "application_1", userId: "user_1", businessName: "Amina Farms", businessType: "hatchery",
  description: "Day-old chicks and healthy point-of-lay birds.", phone: "+2348000000000", whatsapp: "",
  email: "sales@amina.test", state: "Oyo", lga: "Ibadan North", address: "12 Farm Road, Ibadan",
  logoPath: null, verificationStatus: "DRAFT", rejectionReason: null, approvedAt: null, approvedByUserId: null,
  createdAt: new Date(), updatedAt: new Date(), approvedBy: null,
  user: { id: "user_1", email: "amina@example.test", username: "amina", profile: { displayName: "Amina" } },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mail.submitted.mockResolvedValue(undefined);
  mocks.mail.approved.mockResolvedValue(undefined);
  mocks.mail.rejected.mockResolvedValue(undefined);
});

describe("seller application transitions", () => {
  it("keeps one user-linked application while draft progress is saved", async () => {
    mocks.sellerProfile.findUnique.mockResolvedValue({ verificationStatus: "DRAFT" });
    mocks.sellerProfile.upsert.mockResolvedValue(application);
    await saveSellerDraft("user_1", { businessName: "Amina Farms" });
    await saveSellerDraft("user_1", { phone: "+2348000000000" });
    expect(mocks.sellerProfile.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.sellerProfile.upsert).toHaveBeenLastCalledWith(expect.objectContaining({ where: { userId: "user_1" } }));
  });

  it("submits a complete draft without granting the seller role", async () => {
    mocks.sellerProfile.findUnique.mockResolvedValueOnce(application);
    mocks.sellerProfile.updateMany.mockResolvedValue({ count: 1 });
    mocks.role.findUnique.mockResolvedValue(null);
    mocks.sellerProfile.findUniqueOrThrow.mockResolvedValue({ ...application, verificationStatus: "PENDING_REVIEW" });

    await submitSellerApplication("user_1");

    expect(mocks.sellerProfile.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { verificationStatus: "PENDING_REVIEW", rejectionReason: null } }));
    expect(mocks.userRole.upsert).not.toHaveBeenCalled();
    expect(mocks.mail.submitted).toHaveBeenCalledOnce();
  });

  it("prevents duplicate application submission", async () => {
    mocks.sellerProfile.findUnique.mockResolvedValueOnce({ ...application, verificationStatus: "PENDING_REVIEW" });
    await expect(submitSellerApplication("user_1")).rejects.toMatchObject({ code: "INVALID_STATE" });
    expect(mocks.sellerProfile.updateMany).not.toHaveBeenCalled();
  });

  it("approves a pending application and assigns the existing seller role", async () => {
    mocks.sellerProfile.findUnique.mockResolvedValueOnce({ ...application, verificationStatus: "PENDING_REVIEW" });
    mocks.role.findUnique.mockResolvedValue({ id: "seller_role" });
    mocks.sellerProfile.update.mockResolvedValue({ ...application, verificationStatus: "APPROVED" });

    await approveSellerApplication(application.id, "admin_1");

    expect(mocks.userRole.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { userId: "user_1", roleId: "seller_role" } }));
    expect(mocks.sellerProfile.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ verificationStatus: "APPROVED", approvedByUserId: "admin_1" }) }));
    expect(mocks.mail.approved).toHaveBeenCalledOnce();
  });

  it("rejects with a reason and revokes seller access", async () => {
    mocks.sellerProfile.findUnique.mockResolvedValueOnce({ ...application, verificationStatus: "PENDING_REVIEW" });
    mocks.role.findUnique.mockResolvedValue({ id: "seller_role" });
    mocks.sellerProfile.update.mockResolvedValue({ ...application, verificationStatus: "REJECTED" });

    await rejectSellerApplication(application.id, "The operating address needs more detail.");

    expect(mocks.userRole.deleteMany).toHaveBeenCalledWith({ where: { userId: "user_1", roleId: "seller_role" } });
    expect(mocks.sellerProfile.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ verificationStatus: "REJECTED", rejectionReason: "The operating address needs more detail." }) }));
    expect(mocks.mail.rejected).toHaveBeenCalledOnce();
  });

  it("suspends an approved seller and removes the seller role", async () => {
    mocks.sellerProfile.findUnique.mockResolvedValueOnce({ ...application, verificationStatus: "APPROVED" });
    mocks.role.findUnique.mockResolvedValue({ id: "seller_role" });
    mocks.sellerProfile.update.mockResolvedValue({ ...application, verificationStatus: "SUSPENDED" });

    await suspendSellerApplication(application.id);

    expect(mocks.userRole.deleteMany).toHaveBeenCalledOnce();
    expect(mocks.sellerProfile.update).toHaveBeenCalledWith(expect.objectContaining({ data: { verificationStatus: "SUSPENDED" } }));
  });

  it("restores a suspended seller by reassigning the seller role", async () => {
    mocks.sellerProfile.findUnique.mockResolvedValueOnce({ ...application, verificationStatus: "SUSPENDED" });
    mocks.role.findUnique.mockResolvedValue({ id: "seller_role" });
    mocks.sellerProfile.update.mockResolvedValue({ ...application, verificationStatus: "APPROVED" });
    await restoreSellerApplication(application.id, "admin_1");
    expect(mocks.userRole.upsert).toHaveBeenCalledOnce();
    expect(mocks.sellerProfile.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ verificationStatus: "APPROVED" }) }));
  });
});

describe("seller dashboard authorization", () => {
  it("denies URL access when client state claims seller but server records are not approved", () => {
    const user = { sellerProfile: { verificationStatus: "PENDING_REVIEW" }, roles: [{ role: { name: "seller" } }] } as Parameters<typeof canAccessSellerDashboard>[0];
    expect(canAccessSellerDashboard(user)).toBe(false);
  });

  it("requires both an approved application and the database seller role", () => {
    const withoutRole = { sellerProfile: { verificationStatus: "APPROVED" }, roles: [] } as unknown as Parameters<typeof canAccessSellerDashboard>[0];
    const approved = { sellerProfile: { verificationStatus: "APPROVED" }, roles: [{ role: { name: "seller" } }] } as Parameters<typeof canAccessSellerDashboard>[0];
    expect(canAccessSellerDashboard(withoutRole)).toBe(false);
    expect(canAccessSellerDashboard(approved)).toBe(true);
  });
});
