import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import ts from "typescript";
import postcss from "postcss";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const sorted = (values) => [...new Set(values)].sort();
const packageName = (id) =>
  id.startsWith("@") ? id.split("/").slice(0, 2).join("/") : id.split("/")[0];

/** Generate delivery facts from the same source that builds the public package. */
export function buildComponentCatalog({
  root = defaultRoot,
  packageRoot = join(root, "packages/tiraz"),
} = {}) {
  const sourceRoot = join(packageRoot, "source/system");
  const read = (path) => readFileSync(join(sourceRoot, path), "utf8");
  const release = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8"),
  );
  const registry = JSON.parse(read("ai/registry.json"));
  const knownDependencies = {
    ...release.dependencies,
    ...release.peerDependencies,
  };
  const graph = new Map();
  function inspect(path) {
    if (graph.has(path)) return graph.get(path);
    if (path.startsWith("../") || posix.isAbsolute(path))
      throw new Error(`Source leaves the system: ${path}`);
    const text = read(path);
    const node = {
      files: [],
      dependencies: [],
      classes: sorted(text.match(/\btz-[a-zA-Z][\w-]*/g) ?? []),
    };
    graph.set(path, node);
    const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    const imports = new Set();
    function visit(item) {
      if (
        (ts.isImportDeclaration(item) || ts.isExportDeclaration(item)) &&
        item.moduleSpecifier &&
        ts.isStringLiteral(item.moduleSpecifier)
      )
        imports.add(item.moduleSpecifier.text);
      if (
        ts.isImportTypeNode(item) &&
        ts.isLiteralTypeNode(item.argument) &&
        ts.isStringLiteral(item.argument.literal)
      )
        imports.add(item.argument.literal.text);
      if (
        ts.isCallExpression(item) &&
        item.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        if (!ts.isStringLiteral(item.arguments[0]))
          throw new Error(`Non-static import in ${path}`);
        imports.add(item.arguments[0].text);
      }
      ts.forEachChild(item, visit);
    }
    visit(ast);
    for (const id of imports) {
      if (id.startsWith(".")) {
        const base = posix.normalize(posix.join(posix.dirname(path), id));
        const dependency = [
          base,
          `${base}.ts`,
          `${base}.tsx`,
          `${base}/index.ts`,
          `${base}/index.tsx`,
        ].find(
          (candidate) =>
            existsSync(join(sourceRoot, candidate)) &&
            /\.(tsx?|css|png|jpe?g|svg)$/.test(candidate),
        );
        if (!dependency)
          throw new Error(`Unresolved import ${id} from ${path}`);
        if (dependency.startsWith("../"))
          throw new Error(`Source leaves the system: ${dependency}`);
        node.files.push(dependency);
      } else {
        const name = packageName(id);
        if (!knownDependencies[name])
          throw new Error(`Undeclared dependency ${name} in ${path}`);
        node.dependencies.push(name);
      }
    }
    return node;
  }
  function closure(entries) {
    const files = new Set();
    const dependencies = new Set([
      "react",
      "react-dom",
      "@fontsource/ibm-plex-sans-arabic",
    ]);
    const classes = new Set();
    function visit(path) {
      if (files.has(path)) return;
      files.add(path);
      if (!/\.tsx?$/.test(path)) return;
      const node = inspect(path);
      node.dependencies.forEach((name) => dependencies.add(name));
      node.classes.forEach((name) => classes.add(name));
      node.files.forEach(visit);
    }
    entries.forEach(visit);
    return {
      files: sorted(files),
      dependencies: Object.fromEntries(
        sorted(dependencies).map((name) => [name, knownDependencies[name]]),
      ),
      classes: sorted(classes),
    };
  }

  // Keep rule order, grouping contexts and whole keyframes. Filtering is only a
  // build operation; consumers do not need PostCSS or the TypeScript compiler API.
  const rules = [];
  function flatten(container, wrappers = []) {
    for (const node of container.nodes ?? []) {
      if (
        node.type === "comment" ||
        (node.type === "atrule" && node.name === "import")
      )
        continue;
      if (
        node.type === "atrule" &&
        node.nodes &&
        !node.name.endsWith("keyframes")
      ) {
        flatten(node, [...wrappers, node]);
        continue;
      }
      let copy = node.clone();
      for (const wrapper of [...wrappers].reverse())
        copy = wrapper.clone({ nodes: [copy] });
      rules.push({
        css: copy.toString(),
        classes:
          node.type === "rule"
            ? sorted(node.selector.match(/\btz-[\w-]+/g) ?? [])
            : [],
        keyframe:
          node.type === "atrule" && node.name.endsWith("keyframes")
            ? node.params
            : null,
      });
    }
  }
  flatten(postcss.parse(read("components.css")));
  flatten(postcss.parse(read("patterns/patterns.css")));
  const index = ts.createSourceFile(
    "index.ts",
    read("index.ts"),
    ts.ScriptTarget.Latest,
    true,
  );
  const exportStatements = index.statements
    .filter(ts.isExportDeclaration)
    .map((statement) => ({
      source: statement.moduleSpecifier?.text?.replace(/^\.\//, ""),
      text: statement.getText(index),
    }));
  const components = {};
  for (const item of registry.components) {
    const resolved = closure(["Provider.tsx", "config.ts", item.source]);
    const classes = new Set(resolved.classes);
    const matches = (name) =>
      classes.has(name) ||
      resolved.classes.some(
        (prefix) => prefix.endsWith("-") && name.startsWith(prefix),
      );
    const styleIds = rules.flatMap((rule, i) =>
      !rule.keyframe && (!rule.classes.length || rule.classes.some(matches))
        ? [i]
        : [],
    );
    const styles =
      styleIds.map((i) => rules[i].css).join("\n") + read("tokens.css");
    rules.forEach((rule, i) => {
      if (rule.keyframe && new RegExp(`\\b${rule.keyframe}\\b`).test(styles))
        styleIds.push(i);
    });
    const sourceModules = new Set(
      resolved.files.map((path) => path.replace(/\.tsx?$/, "")),
    );
    components[item.id] = {
      source: item.source,
      api: item.api,
      description: item.purpose,
      files: resolved.files,
      dependencies: resolved.dependencies,
      styles: styleIds.sort((a, b) => a - b),
      exports: exportStatements
        .filter((entry) => sourceModules.has(entry.source))
        .map((entry) => entry.text),
    };
  }
  const files = sorted(
    Object.values(components)
      .flatMap((item) => item.files)
      .concat(["tokens.css", "LICENSE"]),
  );
  return {
    schemaVersion: 1,
    name: release.name,
    version: release.version,
    files: Object.fromEntries(
      files.map((path) => [path, hash(readFileSync(join(sourceRoot, path)))]),
    ),
    rules: rules.map((rule) => rule.css),
    components: Object.fromEntries(
      Object.entries(components).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}

export function writeComponentCatalog(options = {}) {
  const packageRoot =
    options.packageRoot ?? join(options.root ?? defaultRoot, "packages/tiraz");
  writeFileSync(
    join(packageRoot, "source/components.json"),
    JSON.stringify(
      buildComponentCatalog({ ...options, packageRoot }),
      null,
      2,
    ) + "\n",
  );
}
