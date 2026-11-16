"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/button";
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
}: {
  data: OrganizationPage;
  query: OrganizationQuery;
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
        {count === 0 ? (
          <div className={styles.empty}>
            <StatePanel
              kind="empty"
              layout="compact"
              headingLevel={2}
              title={
                query.cursor
                  ? "No more organizations in this result set"
                  : query.status
                    ? "No organizations with this status"
                    : "No organizations registered yet"
              }
              description={
                query.cursor || query.status
                  ? "Choose another status or go back to page 1 to see current records."
                  : "Organizations will appear here when they are registered."
              }
            />
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <StatePanel
              kind="empty"
              layout="compact"
              headingLevel={2}
              title={`No organizations in this view match “${term.trim()}”`}
              description="Search checks only the organizations on this page, by name or slug. Try another term, or clear the search and open another page."
            >
              <Button
                icon={<Icon name="close" />}
                variant="secondary"
                onClick={() => setTerm("")}
              >
                Clear search
              </Button>
            </StatePanel>
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
