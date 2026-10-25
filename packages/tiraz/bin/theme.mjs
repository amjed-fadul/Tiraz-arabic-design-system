export const themeSource = `/* Your Tiraz theme. This file belongs to your application.
 * Add commands preserve it; source verification ignores intentional theme edits.
 * Import it after Tiraz's defaults. No !important is needed.
 * Uncomment an override to use it instead of the provider's selected preset.
 */
.tiraz-system {
  /* --font: "IBM Plex Sans Arabic", system-ui, sans-serif; */
  /* --tiraz-radius: 8px; */
  /* --control-height: 44px; */
}

.tiraz-system[data-theme="light"] {
  /* --tiraz-action: #355e4c; */
  /* --action-text: #ffffff; */
  /* --surface-page: #f7f8f7; */
  /* --surface: #ffffff; */
  /* --text: #232a26; */
}

.tiraz-system[data-theme="dark"] {
  /* --tiraz-action: #a5c9b4; */
  /* --action-text: #13231a; */
  /* --surface-page: #101713; */
  /* --surface: #1c251f; */
  /* --text: #e6ebe6; */
}

/* Keep text/action contrast readable in both themes, and check Arabic and English. */
`;
