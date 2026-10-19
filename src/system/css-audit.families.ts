// The component families whose rules in components.css must pass the Woven CSS
// audit (css-audit.ts). Each key names a family and each value lists the class
// prefixes that make up its rules: ".tz-button" covers ".tz-button" and
// ".tz-button-label", never ".tz-buttons". A family is added here in the commit
// that migrates its CSS, and css-audit.test.ts audits it on every run from then
// on. Until a family is listed, its CSS is not held to the audit. Every prefix
// must name at least one rule, so a misspelled one fails instead of auditing
// nothing.
export const wovenFamilies: Record<string, readonly string[]> = {};
