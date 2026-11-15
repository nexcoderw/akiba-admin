import { LoadingState } from "@/components/shared/loading-state";

export default function PlatformLoading() {
  return (
    <LoadingState
      title="Loading your workspace"
      message="We’re preparing this platform page. Your session remains protected while it loads."
    />
  );
}
