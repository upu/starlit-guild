import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

/** Transpile a whole source module; callers keep their own React and dependency mocks. */
export function compileSourceModule(relativePath, baseUrl, compilerOptions = {}) {
  const url = new URL(relativePath, baseUrl);
  const filename = fileURLToPath(url);
  const result = ts.transpileModule(readFileSync(url, "utf8"), {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      ...compilerOptions,
    },
  });
  const errors = result.diagnostics.filter((item) => item.category === ts.DiagnosticCategory.Error);
  if (errors.length) {
    throw new SyntaxError(
      `${filename}: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join("\n")}`,
    );
  }
  return { code: result.outputText, diagnostics: result.diagnostics, filename };
}

/** Unknown imports fail immediately instead of receiving permissive placeholder modules. */
export function evaluateSourceModule(compiled, modules, globals = {}) {
  const exports = {};
  const require = (id) => {
    if (!Object.hasOwn(modules, id) || modules[id] === undefined) {
      throw new Error(`Unregistered test dependency "${id}" in ${compiled.filename}`);
    }
    return modules[id];
  };
  vm.runInNewContext(
    compiled.code,
    { ...globals, exports, require },
    { filename: compiled.filename },
  );
  return exports;
}
