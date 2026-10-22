# Tiraz · طِراز

Arabic-first React components, editable source and AI-ready guidance. MIT.
Requires Node >=22.12 and React/React DOM 19.

## Use the package

```sh
npm install @amjedfadul/tiraz
```

```tsx
import "@amjedfadul/tiraz/styles.css";
import { Button, SystemProvider, defaultConfig } from "@amjedfadul/tiraz";

export function App() {
  return (
    <div lang="ar" dir="rtl">
      <SystemProvider config={{ ...defaultConfig, direction: "rtl" }}>
        <Button>ابدأ الآن</Button>
      </SystemProvider>
    </div>
  );
}
```

`styles.css` loads IBM Plex Sans Arabic, tokens and components. To use your own
font, import `@amjedfadul/tiraz/tokens.css` and `@amjedfadul/tiraz/components.css` separately. Preserve
`:dir()` in your CSS target: Chrome/Edge 120+, Firefox 114+, Safari 16.4+.

## Own the source

```sh
npx @amjedfadul/tiraz init --new my-app
cd my-app
npm run dev
```

Inside an existing **Vite React TypeScript** application:

```sh
npx @amjedfadul/tiraz init
```

The installer copies the complete library to `src/system`, optional Khayt
runtime to `src/mascot`, retains assets/licenses and adds an `AGENTS.md` pointer.
It preserves routes, entry files, scripts and existing dependency versions.
It refuses existing source folders; there is no overwrite flag. Other React bundlers can use the compiled package imports above. Read
`TIRAZ_SETUP.md` for the entry imports. `--no-install` prepares files without
running npm. Review compatibility if your existing app uses React before 19.

## Optional Khayt avatar

```tsx
import "@amjedfadul/tiraz/mascot.css";
import { Khayt } from "@amjedfadul/tiraz/mascot";

const agentPresentation = {
  avatar: <Khayt state="working" color="#946D91" size={48} animated />,
  color: "#946D91",
};
```

Pass this through a supported component's `agentPresentation` prop. Map the real
task state to `idle`, `thinking`, `working`, `waiting`, `done` or `blocked`.
The avatar is decorative; keep visible names and status text. Reduced motion is
respected by the runtime.

The complete AI guide and registry are included at
`node_modules/@amjedfadul/tiraz/source/system/ai/README.md` and `registry.json`. Query only
the component you need, then check its source and exported types. The library
has no backend or model credentials; example actions are local demonstrations.

[Website and examples](https://tiraz.dev) ·
[Source](https://github.com/amjed-fadul/Tiraz-arabic-design-system)
