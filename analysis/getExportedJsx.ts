import * as ts from "typescript";
import {
  getClosestFunctionScope,
  getFunctionIdentifier,
  getImportNodes,
  getJsxElements,
  getTagNames,
} from "./utils";

export default function getExportedJsx(sourceNode: ts.SourceFile) {
  const imports = getImportNodes(sourceNode);
  const jsxNodes = getJsxElements(sourceNode).map((node) => {
    const funcNode = getClosestFunctionScope(node);
    const isExport = funcNode?.modifiers?.some(
      (n) => n.kind === ts.SyntaxKind.ExportKeyword
    );
    const isDefaultExport =
      isExport &&
      funcNode?.modifiers?.some((n) => n.kind === ts.SyntaxKind.DefaultKeyword);
    const jsxNodes = getTagNames(node).map((n) => {
      const { tagName } = n;
      const importData = imports.find(
        ({ defaultImport, subImportMap }) =>
          defaultImport === tagName || !!subImportMap[tagName]
      );
      if (!importData) {
        return {
          ...n,
          tagName: n.tagName,
        };
      }

      const [componentName] = importData.subImportMap[tagName] || [
        importData.defaultImport!,
      ];
      return {
        ...n,
        tagName: componentName,
        importData,
      };
    });
    return {
      jsxNodes,
      methodName: funcNode && getFunctionIdentifier(funcNode)?.text,
      isExport,
      isDefaultExport,
    };
  });

  return {
    fileName: sourceNode.fileName,
    // sourceNode,
    jsxNodes,
  };
}
