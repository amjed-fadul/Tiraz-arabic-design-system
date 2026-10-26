import * as ts from "typescript";
import postcss from "postcss";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { accentColors, defaultConfig } from "../src/system/config.ts";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(root, "src/system");
const generated = "src/system/ai/generated";
const slash = (path) => path.split(sep).join("/");
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const hash = (content) => createHash("sha256").update(content).digest("hex");

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${path}`);
      return entry.isDirectory() ? filesUnder(path) : [path];
    })
    .sort(compare);
}

function sourceFiles() {
  return filesUnder(sourceRoot).filter((path) => {
    const name = slash(relative(sourceRoot, path));
    return !(
      name.startsWith("ai/generated/") ||
      /(?:^|\/)(?:__tests__|__snapshots__|tests)(?:\/|$)/.test(name) ||
      /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(name) ||
      /(?:^|\/)css-audit(?:[./]|$)/.test(name)
    );
  });
}

function tokenInventory(providerSources) {
  const tokens = {};
  const css = readFileSync(resolve(sourceRoot, "tokens.css"), "utf8");
  postcss.parse(css, { from: "tokens.css" }).walkDecls(/^--/, (declaration) => {
    const contexts = [];
    const atRules = [];
    const selectors = [];
    for (
      let parent = declaration.parent;
      parent?.type !== "root";
      parent = parent.parent
    ) {
      if (parent.type === "atrule") {
        atRules.unshift({ name: parent.name, params: parent.params });
        contexts.unshift(
          `@${parent.name}${parent.params ? ` ${parent.params}` : ""}`,
        );
      } else if (parent.type === "rule") {
        selectors.unshift(parent.selector);
        contexts.unshift(parent.selector);
      }
    }
    const references = [
      ...declaration.value.matchAll(/var\(\s*(--[\w-]+)/g),
    ].map((match) => match[1]);
    const token = (tokens[declaration.prop] ??= {
      name: declaration.prop,
      values: [],
      references: [],
    });
    token.values.push({
      source: "tokens.css",
      selector: selectors.at(-1),
      selectors,
      atRules,
      context: contexts.join(" > "),
      value: declaration.value,
      important: Boolean(declaration.important),
    });
    token.references.push(...references);
  });
  // Provider values are separate from the CSS cascade: they are inline styles.
  // Preserve any CSS declarations for these names instead of replacing them.
  function providerTokens(node) {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isStringLiteral(node.name) &&
      node.name.text.startsWith("--")
    ) {
      const name = node.name.text;
      const expression = node.initializer.getText();
      const override = ts.isTemplateExpression(node.initializer)
        ? node.initializer.head.text.match(/^var\((--[\w-]+), /)?.[1]
        : undefined;
      const fallback =
        override && node.initializer.templateSpans.length === 1
          ? node.initializer.templateSpans[0].expression.getText()
          : expression;
      const knownValue =
        fallback === "accentColors[config.accent][config.theme]"
          ? {
              values: accentColors,
              default: accentColors[defaultConfig.accent][defaultConfig.theme],
            }
          : expression === "`${config.radius}px`" ||
              (override === "--tiraz-radius" && fallback === "config.radius")
            ? { default: `${defaultConfig.radius}px` }
            : {};
      tokens[name] ??= { name, values: [], references: [] };
      tokens[name].provider = {
        source: slash(relative(sourceRoot, node.getSourceFile().fileName)),
        expression,
        ...(override ? { override } : {}),
        ...knownValue,
      };
    }
    ts.forEachChild(node, providerTokens);
  }
  providerSources.forEach(providerTokens);
  for (const token of Object.values(tokens)) {
    token.references = [...new Set(token.references)].sort(compare);
  }
  return {
    schemaVersion: 1,
    format: "tiraz-css-token-inventory",
    sources: [
      "tokens.css",
      "config.ts",
      ...providerSources.map((source) =>
        slash(relative(sourceRoot, source.fileName)),
      ),
    ],
    defaults: defaultConfig,
    note: "CSS expressions, declaration order, selectors and at-rules are preserved. Provider values are inline styles. This is not a DTCG interchange file; evaluate CSS in its actual cascade and provider context.",
    tokens: Object.fromEntries(
      Object.entries(tokens).sort(([a], [b]) => compare(a, b)),
    ),
  };
}

export function buildKnowledge() {
  const paths = sourceFiles();
  // Hash bytes, including bundled assets. Only TypeScript/CSS is read as text.
  const files = Object.fromEntries(
    paths.map((path) => [
      slash(relative(sourceRoot, path)),
      hash(readFileSync(path)),
    ]),
  );
  const entryPath = resolve(sourceRoot, "index.ts");
  const program = ts.createProgram([entryPath], {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strictNullChecks: true,
    skipLibCheck: true,
    types: ["vite/client"],
    noEmit: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    throw new Error(
      ts.formatDiagnostics(diagnostics, {
        getCanonicalFileName: (file) => file,
        getCurrentDirectory: () => root,
        getNewLine: () => "\n",
      }),
    );
  }
  const checker = program.getTypeChecker();
  const entry = program.getSourceFile(entryPath);
  const unalias = (symbol) =>
    symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  const exports = checker
    .getExportsOfModule(checker.getSymbolAtLocation(entry))
    .map((symbol) => ({ name: symbol.name, symbol: unalias(symbol) }))
    .sort((a, b) => compare(a.name, b.name));
  const publicTypes = new Map(
    exports
      .filter(
        ({ symbol }) =>
          symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias),
      )
      .map(({ name, symbol }) => [symbol, name]),
  );
  const typeString = (type, node) =>
    checker.typeToString(
      type,
      node,
      ts.TypeFormatFlags.NoTruncation |
        ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
    );
  const sourcePath = (node) =>
    slash(relative(sourceRoot, node.getSourceFile().fileName));
  const isLiteral = (type) =>
    Boolean(
      type.flags &
      (ts.TypeFlags.StringLiteral |
        ts.TypeFlags.NumberLiteral |
        ts.TypeFlags.BigIntLiteral |
        ts.TypeFlags.BooleanLiteral |
        ts.TypeFlags.Undefined |
        ts.TypeFlags.Null |
        ts.TypeFlags.Never),
    );
  const description = (symbol) =>
    ts.displayPartsToString(symbol.getDocumentationComment(checker));
  const typeParameters = (parameters = []) =>
    parameters.map((parameter) => ({
      name: parameter.name.getText(),
      ...(parameter.constraint
        ? { constraint: parameter.constraint.getText() }
        : {}),
      ...(parameter.default ? { default: parameter.default.getText() } : {}),
    }));
  const hasObjectShape = (type) => {
    if (type.isUnion()) return type.types.some(hasObjectShape);
    if (type.isIntersection()) return type.types.every(hasObjectShape);
    return Boolean(type.flags & ts.TypeFlags.Object);
  };

  function propsFor(type, node) {
    if (!hasObjectShape(type)) return {};
    return Object.fromEntries(
      checker
        .getPropertiesOfType(type)
        .map((symbol) => {
          const declaration =
            symbol.valueDeclaration ?? symbol.declarations?.[0] ?? node;
          // Use the instantiated parent type, retaining generic substitutions and
          // optional undefined. The declaration alone can give an unbound T.
          const propertyType =
            checker.getTypeOfPropertyOfType(type, symbol.name) ??
            checker.getTypeOfSymbolAtLocation(symbol, declaration);
          const doc = sourcePath(declaration).startsWith("../")
            ? ""
            : description(symbol);
          return [
            symbol.name,
            {
              type: typeString(propertyType, declaration),
              required: !(symbol.flags & ts.SymbolFlags.Optional),
              ...(propertyType.isUnion() && propertyType.types.every(isLiteral)
                ? {
                    members: propertyType.types.map((member) =>
                      typeString(member, declaration),
                    ),
                  }
                : {}),
              ...(doc ? { description: doc } : {}),
            },
          ];
        })
        .sort(([a], [b]) => compare(a, b)),
    );
  }

  function describe(type, node) {
    if (!hasObjectShape(type)) return {};
    return {
      props: propsFor(type, node),
      branches: type.isUnion()
        ? type.types.map((branch) => ({
            type: typeString(branch, node),
            props: propsFor(branch, node),
          }))
        : [],
      ...(checker.getIndexInfosOfType(type).length
        ? {
            indexSignatures: checker.getIndexInfosOfType(type).map((index) => ({
              key: typeString(index.keyType, node),
              value: typeString(index.type, node),
              readonly: index.isReadonly,
            })),
          }
        : {}),
    };
  }

  function relatedTypes(symbol, node) {
    const names = new Set();
    const seen = new Set();
    function visit(declaration) {
      if (
        !declaration ||
        seen.has(declaration) ||
        sourcePath(declaration).startsWith("../")
      )
        return;
      seen.add(declaration);
      function scan(child) {
        if (
          ts.isTypeReferenceNode(child) ||
          ts.isExpressionWithTypeArguments(child)
        ) {
          const reference = checker.getSymbolAtLocation(
            child.typeName ?? child.expression,
          );
          if (reference) {
            const resolved = unalias(reference);
            const name = publicTypes.get(resolved);
            if (name && resolved !== symbol) names.add(name);
            for (const next of resolved.declarations ?? []) visit(next);
          }
        }
        ts.forEachChild(child, scan);
      }
      scan(declaration);
    }
    visit(node);
    // Label/record types in the same source form a useful local contract index,
    // including names referenced through indexed access or mapped types.
    for (const [typeSymbol, name] of publicTypes) {
      if (
        typeSymbol !== symbol &&
        typeSymbol.declarations?.some(
          (declaration) => declaration.getSourceFile() === node.getSourceFile(),
        )
      )
        names.add(name);
    }
    return Object.fromEntries(
      [...names].sort(compare).map((name) => [name, `${name}.json`]),
    );
  }

  const output = new Map();
  const json = (path, data) =>
    output.set(`${generated}/${path}`, `${JSON.stringify(data, null, 2)}\n`);
  for (const { name, symbol } of exports) {
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!declaration)
      throw new Error(`No declaration for public export ${name}`);
    const source = sourcePath(declaration);
    if (!files[source])
      throw new Error(
        `Public export ${name} is outside the source inventory: ${source}`,
      );
    const isType = Boolean(
      symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias),
    );
    const type = isType
      ? checker.getDeclaredTypeOfSymbol(symbol)
      : checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const calls = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
    // JSX component exports are capitalized callables returning a JSX element.
    // A helper's string/object parameters must never become component props.
    const isComponent =
      /^[A-Z]/.test(name) &&
      calls.some((signature) =>
        /(?:^|\W)(?:Element|ReactElement|ReactNode)(?:\W|$)/.test(
          typeString(checker.getReturnTypeOfSignature(signature), declaration),
        ),
      );
    const signatures = calls.map((signature) => {
      const node = signature.getDeclaration() ?? declaration;
      return {
        typeParameters: typeParameters(node.typeParameters),
        parameters: signature.getParameters().map((parameter, index) => {
          const parameterNode =
            parameter.valueDeclaration ?? node.parameters?.[index] ?? node;
          const type = checker.getTypeOfSymbolAtLocation(
            parameter,
            parameterNode,
          );
          return {
            name: ts.isParameter(parameterNode)
              ? parameterNode.name.getText()
              : parameter.name,
            type: typeString(type, parameterNode),
            required:
              !(parameter.flags & ts.SymbolFlags.Optional) &&
              !parameterNode.questionToken &&
              !parameterNode.initializer &&
              !parameterNode.dotDotDotToken,
            ...(parameterNode.dotDotDotToken ? { rest: true } : {}),
            ...(parameterNode.initializer
              ? { default: parameterNode.initializer.getText() }
              : {}),
          };
        }),
        returns: typeString(checker.getReturnTypeOfSignature(signature), node),
      };
    });
    const defaults = {};
    let componentProps;
    if (isComponent) {
      const signature = calls[0];
      const parameter = signature.getParameters()[0];
      const node = signature.getDeclaration() ?? declaration;
      if (parameter) {
        componentProps = describe(
          checker.getTypeOfSymbolAtLocation(parameter, node),
          node,
        );
        const binding = node.parameters?.[0]?.name;
        if (binding && ts.isObjectBindingPattern(binding)) {
          for (const element of binding.elements) {
            if (element.initializer)
              defaults[(element.propertyName ?? element.name).getText()] =
                element.initializer.getText();
          }
        }
      }
    }
    const doc = description(symbol);
    json(`api/${name}.json`, {
      schemaVersion: 1,
      exportName: name,
      kind: isType
        ? "type"
        : isComponent
          ? "component"
          : calls.length
            ? "function"
            : "value",
      source,
      sourceHash: files[source],
      type: typeString(type, declaration),
      ...(doc ? { description: doc } : {}),
      ...(isType
        ? { typeParameters: typeParameters(declaration.typeParameters) }
        : {}),
      ...(type.isUnion()
        ? {
            members: type.types.map((member) =>
              typeString(member, declaration),
            ),
          }
        : {}),
      ...(calls.length ? { signatures } : {}),
      ...(isType || !calls.length
        ? describe(type, declaration)
        : componentProps),
      ...(isComponent ? { defaults } : {}),
      relatedTypes: relatedTypes(symbol, declaration),
    });
  }
  json(
    "tokens.json",
    tokenInventory(
      ["Provider.tsx", "portal-scope.tsx"].map((path) =>
        program.getSourceFile(resolve(sourceRoot, path)),
      ),
    ),
  );
  json("manifest.json", {
    schemaVersion: 1,
    format: "tiraz-public-api-manifest",
    sourceRoot: "../..",
    entry: "index.ts",
    hashAlgorithm: "sha256",
    hashScope:
      "Source-root files, including authored guidance and binary assets; excludes generated metadata, tests and CSS audit tooling.",
    sourceDigest: hash(JSON.stringify(files)),
    files,
    typescriptVersion: ts.version,
    publicExports: exports.map(({ name }) => name),
    api: Object.fromEntries(
      exports.map(({ name }) => [name, `api/${name}.json`]),
    ),
    tokens: "tokens.json",
    note: "Generated TypeScript facts, not authored usage guidance. Source paths are relative to sourceRoot; API/token pointers are relative to this manifest. API relatedTypes pointers are relative to their API file. Component props include inherited attributes; union branches carry their full conditional requirements. Defaults are source expressions, not evaluated values.",
  });
  return output;
}

export function writeOrCheck(output, check = false, outputRoot = root) {
  const destination = resolve(outputRoot);
  const owned = resolve(destination, generated);
  // Validate every target before removing any obsolete files or writing output.
  function rejectSymlinks(path) {
    for (
      let directory = path;
      directory !== destination;
      directory = dirname(directory)
    ) {
      if (lstatSync(directory, { throwIfNoEntry: false })?.isSymbolicLink())
        throw new Error(`Refusing symlink: ${directory}`);
    }
  }
  rejectSymlinks(owned);
  for (const path of output.keys()) {
    const target = resolve(destination, path);
    if (path !== slash(relative(destination, target))) {
      throw new Error(`Generated output path must be canonical: ${path}`);
    }
    if (
      isAbsolute(path) ||
      slash(relative(owned, target)).startsWith("../") ||
      target === owned ||
      !path.startsWith(`${generated}/`)
    ) {
      throw new Error(`Output outside generated directory: ${path}`);
    }
    rejectSymlinks(resolve(destination, path));
  }
  const obsolete = filesUnder(owned)
    .map((path) => slash(relative(destination, path)))
    .filter((path) => !output.has(path));
  const missing = [];
  const stale = [];
  for (const [path, content] of output) {
    const target = resolve(destination, path);
    if (!existsSync(target)) missing.push(path);
    else if (readFileSync(target, "utf8") !== content) stale.push(path);
  }
  if (check) {
    const issues = [
      obsolete.length
        ? `Obsolete generated artifacts: ${obsolete.join(", ")}`
        : "",
      missing.length
        ? `Missing generated artifacts: ${missing.join(", ")}`
        : "",
      stale.length ? `Stale generated artifacts: ${stale.join(", ")}` : "",
    ].filter(Boolean);
    if (issues.length)
      throw new Error(
        `${issues.join("\n")}\nRun node scripts/knowledge.mjs to regenerate.`,
      );
    return;
  }
  for (const path of obsolete) rmSync(resolve(destination, path));
  for (const path of [...missing, ...stale]) {
    const target = resolve(destination, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, output.get(path));
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const check = process.argv.includes("--check");
  writeOrCheck(buildKnowledge(), check);
  console.log(check ? "Knowledge is current." : "Knowledge generated.");
}
