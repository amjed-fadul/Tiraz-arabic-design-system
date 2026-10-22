import * as ts from "typescript";
import postcss from "postcss";
import { createHash } from "node:crypto";
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  existsSync,
  rmSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { catalog } from "../src/knowledge/catalog.ts";
import { guidance } from "../src/knowledge/guidance.ts";
import { defaultConfig, accentColors } from "../src/system/config.ts";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
export const hash = (content) =>
  createHash("sha256").update(content).digest("hex");
export function filesUnder(dir) {
  if (!existsSync(resolve(root, dir))) return [];
  return readdirSync(resolve(root, dir), { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? filesUnder(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
    )
    .sort();
}
export function runtimeFiles() {
  return ["src/system", "src/patterns", "src/examples"]
    .flatMap(filesUnder)
    .filter((p) => !/\.test\.|\/__/.test(p));
}
function tokenInventory() {
  const css = read("src/system/tokens.css");
  const tokens = {};
  postcss.parse(css).walkDecls(/^--/, (declaration) => {
    const name = declaration.prop,
      value = declaration.value;
    const contexts = [];
    let parent = declaration.parent;
    while (parent && parent.type !== "root") {
      contexts.unshift(
        parent.type === "atrule"
          ? `@${parent.name} ${parent.params}`
          : parent.selector,
      );
      parent = parent.parent;
    }
    const token = (tokens[name] ??= {
      name,
      role: roleFor(name),
      values: [],
      references: [],
    });
    token.values.push({ context: contexts.join(" > "), value });
    token.references.push(
      ...[...value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]),
    );
  });
  tokens["--action"] = {
    name: "--action",
    role: "Primary action and focus accent; resolved by theme and accent preset in SystemProvider.",
    values: accentColors,
    references: [],
  };
  tokens["--radius"] = {
    name: "--radius",
    role: "Configured base corner radius in pixels.",
    values: { default: defaultConfig.radius },
    references: [],
  };
  for (const token of Object.values(tokens))
    token.references = [...new Set(token.references)];
  return {
    schemaVersion: 1,
    format: "tiraz-css-token-inventory",
    sources: [
      "src/system/tokens.css",
      "src/system/config.ts",
      "src/system/Provider.tsx",
    ],
    defaults: defaultConfig,
    precedence: [
      "base tokens",
      "theme",
      "density and typography",
      "provider accent and radius",
      "reduced motion setting or OS preference",
    ],
    note: "CSS expressions and contexts are preserved. This inventory is not a DTCG interchange file. Reduced-motion media overrides are also defined in tokens.css.",
    tokens,
  };
}
function roleFor(name) {
  const families = {
    surface: "Surface background",
    text: "Text color or typography role",
    action: "Action treatment",
    success: "Successful action feedback",
    danger: "Error or destructive feedback",
    info: "Informational feedback",
    border: "Boundary contrast",
    focus: "Keyboard focus indicator",
    space: "Layout spacing scale",
    control: "Control size or spacing; density dependent",
    motion: "Transition duration; reduced-motion aware",
    radius: "Corner treatment",
    shadow: "Surface elevation",
    weight: "Font weight",
    font: "Font family",
    switch: "Switch track color",
  };
  const family = name.slice(2).split("-")[0];
  return `${families[family] ?? "Shared component foundation"} (${name}). Use its semantic role; inspect conditional values before overriding.`;
}
export function buildKnowledge() {
  const paths = runtimeFiles();
  const program = ts.createProgram(
    paths.filter((p) => /\.tsx?$/.test(p)).map((p) => resolve(root, p)),
    {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      skipLibCheck: true,
      types: ["vite/client"],
      noEmit: true,
    },
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (file) => file,
        getCurrentDirectory: () => root,
        getNewLine: () => "\n",
      }),
    );
  const checker = program.getTypeChecker();
  const output = new Map();
  const json = (path, data) =>
    output.set(path, JSON.stringify(data, null, 2) + "\n");
  const sourceFiles = Object.fromEntries(paths.map((p) => [p, hash(read(p))]));
  const sourceDigest = hash(JSON.stringify(sourceFiles));
  const pkg = JSON.parse(read("package.json"));
  const dependencies = {
    react: pkg.dependencies.react,
    "react-dom": pkg.dependencies["react-dom"],
  }; // React DOM is required by browser consumers.
  for (const path of paths) {
    for (const [, specifier] of read(path).matchAll(
      /(?:from\s*|import\s*|@import\s*)["']([^"']+)["']/g,
    )) {
      if (specifier.startsWith(".")) continue;
      const name = specifier.startsWith("@")
        ? specifier.split("/").slice(0, 2).join("/")
        : specifier.split("/")[0];
      if (!pkg.dependencies[name])
        throw new Error(`Undeclared runtime dependency ${name} in ${path}`);
      dependencies[name] = pkg.dependencies[name];
    }
  }
  const typeString = (type, node) =>
    checker.typeToString(type, node, ts.TypeFormatFlags.NoTruncation);
  const literal = (member) =>
    member.isLiteral() ||
    member.flags & (ts.TypeFlags.BooleanLiteral | ts.TypeFlags.Undefined);
  function describe(type, node) {
    const props = Object.fromEntries(
      checker
        .getPropertiesOfType(type)
        .map((symbol) => {
          const declaration =
            symbol.valueDeclaration ?? symbol.declarations?.[0] ?? node;
          const propertyType = checker.getTypeOfSymbolAtLocation(
            symbol,
            declaration,
          );
          return [
            symbol.name,
            {
              type: typeString(
                checker.getTypeOfSymbolAtLocation(symbol, declaration),
                declaration,
              ),
              required: !(symbol.flags & ts.SymbolFlags.Optional),
              ...(propertyType.isUnion() && propertyType.types.every(literal)
                ? {
                    members: propertyType.types.map((member) =>
                      typeString(member, declaration),
                    ),
                  }
                : {}),
            },
          ];
        })
        .sort(([a], [b]) => a.localeCompare(b)),
    );
    const branches = type.isUnion()
      ? type.types.map((branch) => ({
          required: checker
            .getPropertiesOfType(branch)
            .filter((s) => !(s.flags & ts.SymbolFlags.Optional))
            .map((s) => s.name),
          props: Object.fromEntries(
            checker
              .getPropertiesOfType(branch)
              .filter((s) => {
                const t = checker.getTypeOfSymbolAtLocation(
                  s,
                  s.valueDeclaration ?? node,
                );
                return literal(t) || (t.isUnion() && t.types.every(literal));
              })
              .map((s) => [
                s.name,
                typeString(
                  checker.getTypeOfSymbolAtLocation(
                    s,
                    s.valueDeclaration ?? node,
                  ),
                  node,
                ),
              ]),
          ),
        }))
      : [];
    return { props, branches };
  }
  const entry = program.getSourceFile(resolve(root, "src/system/index.ts"));
  const exports = checker.getExportsOfModule(
    checker.getSymbolAtLocation(entry),
  );
  const resolveSymbol = (name) => {
    const symbol = exports.find((s) => s.name === name);
    if (!symbol) throw new Error(`Missing public export ${name}`);
    return symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  };
  for (const component of catalog) {
    const advice = guidance[component.id];
    const symbol = resolveSymbol(advice.exportName);
    const declaration = symbol.valueDeclaration;
    const fnType = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const signature = checker.getSignaturesOfType(
      fnType,
      ts.SignatureKind.Call,
    )[0];
    const parameter = signature.getParameters()[0];
    const api = describe(
      checker.getTypeOfSymbolAtLocation(parameter, declaration),
      declaration,
    );
    const defaults = {};
    const binding = declaration.parameters?.[0]?.name;
    if (binding && ts.isObjectBindingPattern(binding))
      for (const el of binding.elements)
        if (el.initializer)
          defaults[(el.propertyName ?? el.name).getText()] =
            el.initializer.getText();
    const relatedTypes = {};
    for (const name of advice.relatedTypes) {
      const s = resolveSymbol(name);
      const d = s.declarations[0];
      const t = checker.getDeclaredTypeOfSymbol(s);
      relatedTypes[name] =
        t.getProperties().length && !t.isUnion()
          ? describe(t, d)
          : {
              type: typeString(t, d),
              ...(t.isUnion()
                ? { members: t.types.map((member) => typeString(member, d)) }
                : {}),
              ...(name.endsWith("Props") ? describe(t, d) : {}),
            };
    }
    json(`knowledge/api/${advice.exportName}.json`, {
      exportName: advice.exportName,
      source: `src/system/${component.file}`,
      ...api,
      relatedTypes,
    });
    const record = {
      schemaVersion: 1,
      id: component.id,
      name: component.name,
      description: component.description,
      exportName: advice.exportName,
      source: `src/system/${component.file}`,
      sourceDigest,
      defaults,
      prerequisites: ["SystemProvider", "system/styles.css"],
      api: `../api/${advice.exportName}.json`,
      ...advice,
      props: Object.fromEntries(
        advice.props.filter((k) => api.props[k]).map((k) => [k, api.props[k]]),
      ),
    };
    json(`knowledge/components/${component.id}.json`, record);
    const rows = Object.entries(record.props)
      .map(
        ([name, p]) =>
          `| ${name} | \`${p.type.replaceAll("|", "\\|")}\` | ${p.required ? "yes" : "no"} | ${defaults[name] ?? "—"} |`,
      )
      .join("\n");
    output.set(
      `docs/ai/components/${component.id}.md`,
      `# ${component.name[1]} · ${component.name[0]}\n\nGenerated from the public TypeScript API and authored guidance. Source digest: \`${sourceDigest}\`.\n\n${advice.useFor}\n\nAvoid: ${advice.avoidFor}\n\n## Setup\n\nRead [integration](../integration.md). Import \`${advice.exportName}\` from the installed manifest's entry; load its styles once and use SystemProvider.\n\n## Common props\n\n| Prop | Type | Required | Runtime default expression |\n| --- | --- | --- | --- |\n${rows}\n\nFull inherited API and conditional branches: [contract](../../../knowledge/api/${advice.exportName}.json). Related types are included there. Do not interpret this concise table as the complete inherited API.\n\n## Rules\n\n${advice.rules.map((s) => "- " + s).join("\n")}\n\n## Parts\n\n${Object.entries(
        advice.parts,
      )
        .map(([k, v]) => "- **" + k + "**: " + v)
        .join(
          "\n",
        )}\n\n## Example\n\nSee the [compiling examples](../../../src/examples/Components.tsx). The workbench editor is a demonstration model, not the runtime API.\n`,
    );
  }
  const patternEntry = program.getSourceFile(
    resolve(root, "src/patterns/index.ts"),
  );
  const patternExports = checker.getExportsOfModule(
    checker.getSymbolAtLocation(patternEntry),
  );
  const patternTypes = {};
  for (const exported of patternExports) {
    const symbol =
      exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported;
    if (!(symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)))
      continue;
    const declaration = symbol.declarations[0];
    patternTypes[symbol.name] = describe(
      checker.getDeclaredTypeOfSymbol(symbol),
      declaration,
    );
  }
  json("knowledge/patterns.json", {
    schemaVersion: 1,
    docs: "../docs/ai/patterns.md",
    types: patternTypes,
  });
  json("knowledge/tokens.json", tokenInventory());
  json("knowledge/system.manifest.json", {
    schemaVersion: 1,
    name: "tiraz",
    version: pkg.version,
    sourceDigest,
    files: sourceFiles,
    dependencies,
    supported: {
      react: "19",
      environment: "Vite browser application",
      ssr: "not verified",
    },
    defaults: defaultConfig,
    configuration: describe(
      checker.getDeclaredTypeOfSymbol(resolveSymbol("SystemConfig")),
      entry,
    ),
    publicExports: exports.map((s) => s.name).sort(),
    components: catalog.map((c) => ({
      id: c.id,
      name: c.name,
      contract: `components/${c.id}.json`,
      docs: `../docs/ai/components/${c.id}.md`,
    })),
    patterns: ["customer-edit", "preference-settings", "invoice-actions"],
    tokens: "tokens.json",
  });
  output.set(
    "llms.txt",
    `# Tiraz\n\nArabic-first, source-owned React components. Follow the installed tiraz.project.json for real paths.\n\n- [Integration](docs/ai/integration.md)\n- [Rules](docs/ai/rules.md)\n- [Patterns](docs/ai/patterns.md)\n- [Pattern types](knowledge/patterns.json)\n- [Invoice details with actions](docs/ai/patterns.md#invoice-actions-and-nested-menus)\n- [System contract](knowledge/system.manifest.json)\n- [Tokens](knowledge/tokens.json)\n${catalog.map((c) => `- [${c.name[1]} / ${c.name[0]}](docs/ai/components/${c.id}.md)`).join("\n")}\n`,
  );
  // Serve the same focused knowledge at /llms.txt on the Vite documentation site.
  // Mirror the original relative layout so links remain valid when hosted.
  const published = new Map(output);
  for (const path of [
    ...filesUnder("docs/ai").filter(
      (p) => !p.startsWith("docs/ai/components/"),
    ),
    ...paths,
    "LICENSE",
  ]) {
    if (!published.has(path)) published.set(path, read(path));
  }
  for (const [path, content] of published)
    output.set(`public/ai/${path}`, content);
  output.set(
    "public/llms.txt",
    output.get("llms.txt").replace(/\]\(([^)]+)\)/g, "](ai/$1)"),
  );
  return output;
}
export function writeOrCheck(
  output,
  check = false,
  ownedDirectories = ["knowledge", "docs/ai/components", "public/ai"],
) {
  const obsolete = ownedDirectories
    .flatMap(filesUnder)
    .filter((path) => !output.has(path));
  if (check && obsolete.length)
    throw new Error(
      `Obsolete generated artifacts: ${obsolete.join(", ")}. Regenerate knowledge and registry.`,
    );
  if (!check) for (const path of obsolete) rmSync(resolve(root, path));
  const stale = [];
  for (const [path, content] of output) {
    const target = resolve(root, path);
    if (check) {
      if (!existsSync(target) || read(path) !== content) stale.push(path);
    } else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
  }
  if (stale.length)
    throw new Error(
      `Stale generated artifacts: ${stale.join(", ")}. Run npm run knowledge:build and npm run registry:build.`,
    );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  writeOrCheck(buildKnowledge(), process.argv.includes("--check"));
  console.log(
    process.argv.includes("--check")
      ? "Knowledge is current."
      : "Knowledge generated.",
  );
}
