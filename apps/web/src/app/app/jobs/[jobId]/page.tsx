import { Suspense } from "react";
import { JobDetail } from "@/features/jobs/job-detail";

export default function JobPage({ params }: PageProps<"/app/jobs/[jobId]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading job…</p>}>
      {params.then(({ jobId }) => (
        <JobDetail jobId={jobId} />
      ))}
    </Suspense>
  );
}
