"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Icon } from "@/components/shared/icon";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatePanel } from "@/components/shared/state-panel";
import {
  organizationListHref,
  type Organization,
  type OrganizationPage,
  type OrganizationQuery,
  type OrganizationStatus,
} from "@/lib/organizations/contracts";
import { OrganizationCard } from "./organization-card";
import { OrganizationDetails } from "./organization-details";
import { OrganizationSearch } from "./organization-search";
import { OrganizationStatusFilter } from "./organization-status-filter";
import styles from "./organization-list.module.css";

export function OrganizationList({
  data,
  query,
  canCreate,
}: {
  data: OrganizationPage;
  query: OrganizationQuery;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [term, setTerm] = useState("");
  const [dialog, setDialog] = useState<{
    organization: Organization;
    trigger: HTMLElement;
  } | null>(null);
  const count = data.items.length;
  const trail = query.previous.filter((cursor) => cursor !== "first");
  const page = query.cursor ? trail.length + 2 : 1;
  const canGoNext =
    data.nextCursor !== null && (!query.cursor || trail.length < 19);
  const needle = term.trim().toLocaleLowerCase("en");
  const visible = needle
    ? data.items.filter(
        (item) =>
          item.name.toLocaleLowerCase("en").includes(needle) ||
          item.slug.includes(needle),
      )
    : data.items;
  const noun = count === 1 ? "organization" : "organizations";
  const scope = query.status ? `${query.status.toLowerCase()} ` : "";
  const more = data.nextCursor ? " · more results available" : "";
  const summary = needle
    ? `${visible.length} of ${count} ${noun} in this view match “${term.trim()}”`
    : `${count} ${scope}${noun} in this view${more}`;

  function navigate(
    status: OrganizationStatus | undefined,
    cursor?: string,
    previous: string[] = [],
  ) {
    if (refreshing) return;
    startRefresh(() =>
      router.push(
        organizationListHref({ limit: query.limit, status, cursor, previous }),
      ),
    );
  }

  function reset() {
    if (refreshing) return;
    setTerm("");
    startRefresh(() => {
      router.replace(
        organizationListHref({ limit: query.limit, previous: [] }),
      );
      router.refresh();
    });
  }

  function goToPage(target: number) {
    if (target === 1) navigate(query.status);
    else if (target === page + 1 && canGoNext && data.nextCursor) {
      navigate(
        query.status,
        data.nextCursor,
        query.cursor ? ["first", ...trail, query.cursor] : ["first"],
      );
    } else {
      const cursor = trail[target - 2];
      if (cursor)
        navigate(query.status, cursor, [
          "first",
          ...trail.slice(0, target - 2),
        ]);
    }
  }

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Review organization registry records and platform lifecycle statuses."
        actions={
          canCreate ? (
            <Button
              icon={<Icon name="building" />}
              onClick={() => router.push("/organizations/new")}
            >
              Register organization
            </Button>
          ) : undefined
        }
      />
      <section
        className={styles.registry}
        aria-label="Organization registry"
        aria-busy={refreshing}
      >
        <div className={styles.toolbar}>
          <p className={styles.summary} role="status">
            {refreshing ? "Loading current organizations…" : summary}
          </p>
          <div className={styles.tools}>
            <OrganizationSearch term={term} onTermChange={setTerm} />
            <OrganizationStatusFilter
              status={query.status}
              pending={refreshing}
              onChange={(status) => navigate(status)}
            />
          </div>
        </div>
        {refreshing ? (
          <StatePanel
            kind="loading"
            headingLevel={2}
            title="Loading organizations…"
          />
        ) : count === 0 ? (
          <div className={styles.empty}>
            <EmptyState
              title={
                query.cursor
                  ? "No more organizations in this result set"
                  : query.status
                    ? "No organizations with this status"
                    : "No organizations registered yet"
              }
              description={
                query.cursor || query.status
                  ? "Reset your filters and refresh the directory to see current records."
                  : "Add your first organization to get started, or reset to check for new records."
              }
            >
              {canCreate && (
                <Button
                  icon={<Icon name="add" />}
                  onClick={() => router.push("/organizations/new")}
                >
                  Add organization
                </Button>
              )}
              <Button
                icon={<Icon name="refresh" />}
                variant="secondary"
                pending={refreshing}
                loadingLabel="Refreshing organizations"
                onClick={reset}
              >
                Reset
              </Button>
            </EmptyState>
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <EmptyState
              title={`No organizations in this view match “${term.trim()}”`}
              description="No names or slugs on this page match your search. Reset to clear your search and filters and refresh the directory."
            >
              {canCreate && (
                <Button
                  icon={<Icon name="add" />}
                  onClick={() => router.push("/organizations/new")}
                >
                  Add organization
                </Button>
              )}
              <Button
                icon={<Icon name="refresh" />}
                variant="secondary"
                pending={refreshing}
                loadingLabel="Refreshing organizations"
                onClick={reset}
              >
                Reset
              </Button>
            </EmptyState>
          </div>
        ) : (
          <ul className={styles.grid} role="list">
            {visible.map((organization) => (
              <li key={organization.id} className={styles.item}>
                <OrganizationCard
                  organization={organization}
                  onOpen={(trigger) => setDialog({ organization, trigger })}
                />
              </li>
            ))}
          </ul>
        )}
        <Pagination
          label="Organization pages"
          page={page}
          pageCount={canGoNext ? page + 1 : page}
          pageSize={query.limit}
          itemCount={count}
          pending={refreshing}
          onPageChange={goToPage}
        />
        {data.nextCursor && !canGoNext && (
          <p className={styles.summary}>
            This navigation history is full. Return to page 1 or narrow the
            status filter to continue browsing.
          </p>
        )}
      </section>
      {dialog && (
        <OrganizationDetails
          organization={dialog.organization}
          returnFocus={dialog.trigger}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
