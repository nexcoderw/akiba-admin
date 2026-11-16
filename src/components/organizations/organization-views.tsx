import Link from "next/link";
import { StatePanel } from "@/components/shared/state-panel";
import {
  organizationProblem,
  organizationReturnHref,
  statusLabels,
  validOrganizationId,
  type OrganizationStatus,
  type SearchParams,
} from "@/lib/organizations/contracts";
import { getOrganization } from "@/lib/organizations/organizations.server";
import { OrganizationProblem } from "./organization-problem";
import styles from "./organization-views.module.css";

function Status({ value }: { value: OrganizationStatus }) {
  return (
    <span className={styles.status} data-status={value}>
      {statusLabels[value]}
    </span>
  );
}

function DateValue({ value }: { value: string | null }) {
  if (!value) return <>Not recorded</>;
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(new Date(value))}
    </time>
  );
}

export function OrganizationLoading() {
  return (
    <StatePanel
      kind="loading"
      headingLevel={2}
      title="Loading organization information…"
    />
  );
}

export async function OrganizationDetailView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const back = organizationReturnHref(search.from);
  const result = validOrganizationId(id)
    ? await getOrganization(id)
    : { kind: "error" as const, problem: organizationProblem(404) };
  return (
    <section
      className={styles.page}
      aria-labelledby="organization-detail-title"
    >
      <Link href={back} prefetch={false} className={styles.back}>
        Back to organizations
      </Link>
      {result.kind === "error" ? (
        <>
          <h1 id="organization-detail-title">Organization details</h1>
          <OrganizationProblem problem={result.problem} />
        </>
      ) : (
        <>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Organization details</p>
              <h1 id="organization-detail-title">{result.data.name}</h1>
              <p className={styles.description}>
                Organization identity and lifecycle information.
              </p>
            </div>
            <Status value={result.data.status} />
          </header>
          <div className={styles.detailCard}>
            <h2>Organization overview</h2>
            <dl className={styles.details}>
              <div>
                <dt>Name</dt>
                <dd>{result.data.name}</dd>
              </div>
              <div>
                <dt>Slug</dt>
                <dd>{result.data.slug}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <Status value={result.data.status} />
                </dd>
              </div>
              <div>
                <dt>Organization ID</dt>
                <dd className={styles.identifier}>{result.data.id}</dd>
              </div>
            </dl>
            <p className={styles.hint}>
              A recorded slug does not confirm that public DNS or routing is
              ready.
            </p>
          </div>
          <div className={styles.detailCard}>
            <h2>
              Lifecycle history <span className={styles.timezone}>UTC</span>
            </h2>
            <dl className={styles.details}>
              <div>
                <dt>Created</dt>
                <dd>
                  <DateValue value={result.data.createdAt} />
                </dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>
                  <DateValue value={result.data.updatedAt} />
                </dd>
              </div>
              <div>
                <dt>Activated</dt>
                <dd>
                  <DateValue value={result.data.activatedAt} />
                </dd>
              </div>
              <div>
                <dt>Suspended</dt>
                <dd>
                  <DateValue value={result.data.suspendedAt} />
                </dd>
              </div>
              <div>
                <dt>Archived</dt>
                <dd>
                  <DateValue value={result.data.archivedAt} />
                </dd>
              </div>
            </dl>
          </div>
        </>
      )}
    </section>
  );
}
