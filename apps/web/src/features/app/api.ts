import type {
  ApplicationDto,
  ApplicationListItemDto,
  CandidateProfile,
  CreateSourceInput,
  DashboardDto,
  JobDetailDto,
  JobSummaryDto,
  ProfileDto,
  SourceDto,
  UpdateApplicationInput,
  Verdict,
} from "@copilot/shared";
import { api } from "@/lib/api-client";

export const copilotApi = {
  dashboard: () => api<DashboardDto>("/dashboard"),
  profile: () => api<{ profile: ProfileDto | null }>("/profile"),
  uploadCv: (file: File) => {
    const form = new FormData();
    form.append("cv", file);
    return api<ProfileDto>("/profile/cv", { method: "POST", form });
  },
  saveProfile: (data: CandidateProfile) => api<ProfileDto>("/profile", { method: "PUT", body: data }),
  sources: () => api<SourceDto[]>("/sources"),
  addSource: (input: CreateSourceInput) => api<SourceDto[]>("/sources", { method: "POST", body: input }),
  syncSource: (id: string) => api<{ queued: boolean }>(`/sources/${id}/sync`, { method: "POST" }),
  removeSource: (id: string) => api<void>(`/sources/${id}`, { method: "DELETE" }),
  jobs: (filters: { verdict?: Verdict; includeFiltered?: boolean; q?: string }) => {
    const params = new URLSearchParams();
    if (filters.verdict) params.set("verdict", filters.verdict);
    if (filters.includeFiltered) params.set("includeFiltered", "true");
    if (filters.q) params.set("q", filters.q);
    return api<JobSummaryDto[]>(`/jobs?${params}`);
  },
  job: (id: string) => api<JobDetailDto>(`/jobs/${id}`),
  startApplication: (jobId: string) => api<ApplicationDto>(`/jobs/${jobId}/application`, { method: "POST" }),
  draft: (applicationId: string) => api<ApplicationDto>(`/applications/${applicationId}/draft`, { method: "POST" }),
  updateApplication: (applicationId: string, input: UpdateApplicationInput) =>
    api<ApplicationDto>(`/applications/${applicationId}`, { method: "PATCH", body: input }),
  applications: () => api<ApplicationListItemDto[]>("/applications"),
};

export const keys = {
  dashboard: ["dashboard"] as const,
  profile: ["profile"] as const,
  sources: ["sources"] as const,
  jobs: (filters: object) => ["jobs", filters] as const,
  allJobs: ["jobs"] as const,
  job: (id: string) => ["job", id] as const,
  applications: ["applications"] as const,
};
