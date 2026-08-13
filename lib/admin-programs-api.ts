export type PartnerProgramStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "completed"
  | "archived";

export type PartnerProgramEffectiveStatus =
  | "draft"
  | "upcoming"
  | "active"
  | "completed"
  | "expired"
  | "archived";

export type PartnerProgramTargetType =
  | "reports"
  | "lessons"
  | "course_completion"
  | "leads_submitted"
  | "qualified_lead"
  | "confirmed_sale"
  | "partner_referral"
  | "custom_challenge";

export type PartnerProgramRewardType =
  | "bonus_commission"
  | "fixed_etb"
  | "none";

export type PartnerProgramRewardScope =
  | "next_qualifying_sale"
  | "challenge_sale";

export type PartnerProgramTarget = {
  id?: string;
  targetType: PartnerProgramTargetType;
  targetValue: number;
  courseId: string | null;
  courseTitleEn?: string | null;
  courseTitleAm?: string | null;
  sortOrder?: number;
};

export type PartnerProgramReward = {
  id: string | null;
  type: PartnerProgramRewardType;
  value: number | null;
  scope: PartnerProgramRewardScope | null;
  description: string;
  status: "locked" | "earned" | "approved" | "paid" | "applied";
  saleReference: string | null;
  saleAmountEtb: number | null;
  baseCommissionPercent: number | null;
  effectiveCommissionPercent: number | null;
  earnedAt: string | null;
  approvedAt: string | null;
  paidOrAppliedAt: string | null;
  adminNote: string;
};

export type PartnerProgram = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  startDate: string;
  endDate: string;
  status: PartnerProgramStatus;
  effectiveStatus: PartnerProgramEffectiveStatus;
  assignmentScope: "everyone" | "selected";
  icon: string | null;
  participantCount: number;
  completedCount: number;
  targetCount: number;
  progressPercent: number;
  pendingSubmissionCount: number;
  pendingRewardCount: number;
  attentionCount: number;
  reward: PartnerProgramReward;
  createdAt: string;
  updatedAt: string;
};

export type PartnerProgramSubmission = {
  id: string;
  representativeId: string;
  representativeName: string;
  partnerId: string;
  targetId: string;
  submissionType: PartnerProgramTargetType;
  status: "pending" | "approved" | "rejected";
  businessName: string | null;
  contactName: string | null;
  contactMethod: string | null;
  businessType: string | null;
  needSummary: string | null;
  notes: string;
  explanation: string;
  publicUrl: string | null;
  saleAmountEtb: number | null;
  saleReference: string | null;
  saleConfirmed: boolean;
  customerPaymentCleared: boolean;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type PartnerProgramDetail = PartnerProgram & {
  targets: PartnerProgramTarget[];
  representativeIds: string[];
  ranking: Array<{
    representativeId: string;
    name: string;
    partnerId: string;
    progressPercent: number;
    targets: Array<{
      targetId: string;
      targetType: PartnerProgramTargetType;
      targetValue: number;
      actualValue: number;
      courseId: string | null;
    }>;
  }>;
  submissions: PartnerProgramSubmission[];
  rewards: Array<PartnerProgramReward & {
    representativeId: string;
    representativeName: string;
    partnerId: string;
  }>;
};

export type PartnerProgramInput = {
  title: string;
  description: string;
  instructions: string;
  startDate: string;
  endDate: string;
  status: PartnerProgramStatus;
  assignmentScope: "everyone" | "selected";
  representativeIds: string[];
  icon:
    | "target"
    | "growth"
    | "training"
    | "reports"
    | "star"
    | "calendar"
    | "lead"
    | "sale"
    | "referral"
    | "custom"
    | null;
  targets: PartnerProgramTarget[];
  reward: {
    type: PartnerProgramRewardType;
    value: number | null;
    scope: PartnerProgramRewardScope | null;
    description: string;
  };
};

export type PartnerProgramOptions = {
  representatives: Array<{ id: string; name: string; partnerId: string }>;
  courses: Array<{
    id: string;
    titleEn: string;
    titleAm: string;
    status: "draft" | "published";
  }>;
};

function apiUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (!value) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  return value.replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiUrl()}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!response.ok) {
    let message = "Unable to update the Program.";
    try {
      const body = await response.json();
      message = typeof body.message === "string" ? body.message : body.message?.en ?? message;
    } catch {
      // Keep the safe fallback.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function getAdminPrograms() {
  const result = await request<{ programs: PartnerProgram[] }>("/api/admin/programs");
  return result.programs;
}

export async function getAdminProgramAttentionCount() {
  const result = await request<{ count: number }>("/api/admin/programs/attention-count");
  return result.count;
}

export async function getAdminProgramOptions() {
  return request<PartnerProgramOptions>("/api/admin/programs/options");
}

export async function getAdminProgram(programId: string) {
  const result = await request<{ program: PartnerProgramDetail }>(
    `/api/admin/programs/${encodeURIComponent(programId)}`,
  );
  return result.program;
}

export async function createAdminProgram(input: PartnerProgramInput) {
  const result = await request<{ program: PartnerProgramDetail }>("/api/admin/programs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return result.program;
}

export async function updateAdminProgram(programId: string, input: PartnerProgramInput) {
  const result = await request<{ program: PartnerProgramDetail }>(
    `/api/admin/programs/${encodeURIComponent(programId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return result.program;
}

export async function deleteAdminProgram(programId: string) {
  await request(`/api/admin/programs/${encodeURIComponent(programId)}`, { method: "DELETE" });
}

export async function reviewAdminProgramSubmission(
  submissionId: string,
  input: {
    decision: "approve" | "reject";
    rejectionReason?: string;
    saleAmountEtb?: number;
    saleReference?: string;
    saleConfirmed?: boolean;
    customerPaymentCleared?: boolean;
  },
) {
  return request(`/api/admin/programs/submissions/${encodeURIComponent(submissionId)}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateAdminProgramReward(
  rewardId: string,
  input: {
    action: "approve" | "mark_paid" | "mark_applied";
    note?: string;
    saleReference?: string;
    saleAmountEtb?: number;
  },
) {
  return request(`/api/admin/programs/rewards/${encodeURIComponent(rewardId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
