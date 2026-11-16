import Form from "next/form";
import Link from "next/link";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import { Select } from "@/components/shared/select";
import {
  organizationListHref,
  organizationProblem,
  organizationReturnHref,
  organizationStatuses,
  pageLinks,
  parseOrganizationQuery,
  statusLabels,
  validOrganizationId,
  type OrganizationStatus,
  type SearchParams,
} from "@/lib/organizations/contracts";
import {
  getOrganization,
  listOrganizations,
} from "@/lib/organizations/organizations.server";
import { OrganizationError } from "./organization-error";
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
    <section
      className={styles.loading}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <p>Loading organization information…</p>
      <div className={styles.skeleton} aria-hidden="true" />
      <div className={styles.skeleton} aria-hidden="true" />
      <div className={styles.skeleton} aria-hidden="true" />
    </section>
  );
}

export async function OrganizationListView({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = parseOrganizationQuery(await searchParams);
  if (!query)
    return (
      <div className={styles.page}>
        <h1>Organizations</h1>
        <OrganizationError problem={organizationProblem(400)} />
        <Link href="/organizations" prefetch={false}>
          Return to the first page
        </Link>
      </div>
    );
  const result = await listOrganizations(query);
  const href = organizationListHref(query);
  const links = pageLinks(
    query,
    result.kind === "success" ? result.data.nextCursor : null,
  );
  return (
    <section className={styles.page} aria-labelledby="organizations-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Platform administration</p>
          <h1 id="organizations-title">Organizations</h1>
          <p className={styles.description}>
            Review organizations and their current lifecycle status.
          </p>
        </div>
        <span className={styles.headerIcon} aria-hidden="true">
          <Icon name="building" />
        </span>
      </header>

      <Form action="/organizations" prefetch={false} className={styles.filters}>
        <Select
          key={query.status ?? "all"}
          id="organization-status"
          name="status"
          label="Status"
          defaultValue={query.status ?? ""}
          placeholder="All organizations (except archived)"
          icon={<Icon name="building" />}
          options={organizationStatuses.map((status) => ({
            value: status,
            label: statusLabels[status],
          }))}
        />
        <Select
          key={query.limit}
          id="organization-limit"
          name="limit"
          label="Organizations per page"
          defaultValue={String(query.limit)}
          required
          icon={<Icon name="list" />}
          options={[...new Set([10, 20, 50, query.limit])]
            .sort((a, b) => a - b)
            .map((limit) => ({ value: String(limit), label: String(limit) }))}
        />
        <Button
          type="submit"
          loadingLabel="Applying filters…"
          icon={<Icon name="check" />}
        >
          Apply filters
        </Button>
        <Link href="/organizations" prefetch={false} className={styles.reset}>
          Reset
        </Link>
      </Form>
      <p className={styles.hint}>
        Search is not available yet. Use the status filter to narrow the list.
      </p>

      {result.kind === "error" ? (
        <OrganizationError problem={result.problem} />
      ) : (
        <>
          <div className={styles.resultsHeading}>
            <h2>
              {query.status
                ? `${statusLabels[query.status]} organizations`
                : "Organization directory"}
            </h2>
            <p role="status">
              {result.data.items.length}{" "}
              {result.data.items.length === 1
                ? "organization"
                : "organizations"}{" "}
              on this page
            </p>
          </div>
          {result.data.items.length === 0 ? (
            <div className={styles.empty} role="status">
              <Icon name="building" />
              <h3>
                {query.cursor
                  ? "No more organizations"
                  : query.status
                    ? "No organizations match this status"
                    : "No organizations to display"}
              </h3>
              <p>
                {query.cursor
                  ? "Return to an earlier page or choose another status."
                  : "Choose another status to view other organizations."}
              </p>
            </div>
          ) : (
            <div
              className={styles.tableRegion}
              role="region"
              aria-label="Organization results"
              tabIndex={0}
            >
              <table className={styles.table}>
                <caption className={styles.caption}>
                  Organizations ordered by creation date, newest first
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Organization</th>
                    <th scope="col">Slug</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.items.map((organization) => (
                    <tr key={organization.id}>
                      <th scope="row">
                        <Link
                          href={`/organizations/${organization.id}?from=${encodeURIComponent(href)}`}
                          prefetch={false}
                          className={styles.nameLink}
                        >
                          {organization.name}
                          <Icon name="arrow-right" />
                        </Link>
                      </th>
                      <td>
                        <span className={styles.slug}>{organization.slug}</span>
                      </td>
                      <td>
                        <Status value={organization.status} />
                      </td>
                      <td>
                        <DateValue value={organization.createdAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <nav
            className={styles.pagination}
            aria-label="Organization pagination"
          >
            {query.cursor && (
              <Link href={links.first} prefetch={false}>
                First page
              </Link>
            )}
            {links.previous && (
              <Link href={links.previous} prefetch={false}>
                Previous
              </Link>
            )}
            {links.next && (
              <Link href={links.next} prefetch={false}>
                Next <Icon name="arrow-right" />
              </Link>
            )}
            {!links.next && result.data.items.length > 0 && (
              <span>End of results</span>
            )}
          </nav>
        </>
      )}
      {result.kind === "error" && query.cursor && (
        <Link href={links.first} prefetch={false}>
          Return to the first page
        </Link>
      )}
    </section>
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
          <OrganizationError problem={result.problem} />
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
