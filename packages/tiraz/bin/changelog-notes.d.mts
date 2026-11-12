export type ChangelogNotesRange = { from: string; to: string };

export type ChangelogNoteChange = {
  components?: string[];
  area?: string;
  label?: string;
  type?: string;
  breaking?: boolean;
  summary: { en: string; ar?: string };
  steps?: { en: string; ar?: string }[];
};

export type ChangelogNoteRelease = {
  version: string;
  date?: string;
  published?: boolean;
  changes: ChangelogNoteChange[];
};

export function selectChangelogNotes(
  changelog: unknown,
  options: ChangelogNotesRange & { components?: readonly string[] | null },
): ChangelogNoteRelease[];

export function formatChangelogNotes(
  releases: readonly ChangelogNoteRelease[],
  options: ChangelogNotesRange & { registry?: unknown },
): string[];
