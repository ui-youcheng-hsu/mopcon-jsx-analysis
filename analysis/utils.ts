import * as ts from "typescript";

type ParentTrackable = ts.Node & {
  __parent__?: ParentTrackable;
};

export function getJsxElements(sourceNode: ts.Node): ts.JsxElement[] {
  const collected: ts.JsxElement[] = [];
  const exec = (node: ts.Node) => {
    const flag = ts.isJsxElement(node);
    if (flag) {
      collected.push(node);
    } else {
      node.forEachChild((n) => {
        (n as ParentTrackable).__parent__ = node;
        exec(n);
      });
    }
  };
  exec(sourceNode);

  return collected;
}

type ImportCollection = {
  node: ts.ImportDeclaration;
  path: string;
  defaultImport?: string;
  subImports: [import: string, as: string][];
  subImportMap: Record<string, [import: string, as: string]>;
};

export function getImportNodes(sourceNode: ts.Node) {
  const arr: ImportCollection[] = [];
  const exec = (node: ts.Node) => {
    const flag = ts.isImportDeclaration(node);
    if (flag) {
      const { moduleSpecifier, importClause } = node;
      const subImports: [import: string, as: string][] = [];
      const subImportMap: Record<string, [import: string, as: string]> = {};
      importClause?.namedBindings?.forEachChild((n) => {
        const { name, propertyName } = n as ts.ImportSpecifier;
        const tuple: [string, string] = [
          (propertyName || name).text,
          name.text,
        ];
        subImports.push(tuple);
        subImportMap[name.text] = tuple;
      });
      arr.push({
        node,
        path: (moduleSpecifier as ts.StringLiteral).text,
        defaultImport: importClause?.name?.text,
        subImports,
        subImportMap,
      });
    } else {
      node.forEachChild(exec);
    }
  };
  exec(sourceNode);

  return arr;
}

export function getTagNames(
  sourceNode: ts.Node
): { tagName: string; instance: number }[] {
  const arr: ts.Identifier[] = [];
  function exec(node: ts.Node) {
    if (ts.isJsxOpeningElement(node)) {
      arr.push(node.tagName as ts.Identifier);
    }
    node.forEachChild(exec);
  }
  exec(sourceNode);

  return Object.values(
    arr.reduce(
      (draft: Record<string, { tagName: string; instance: number }>, id) => {
        const tagName = id.text;
        const obj = draft[tagName] || {
          tagName,
          instance: 0,
        };
        draft[tagName] = obj;
        obj.instance++;
        return draft;
      },
      {}
    )
  );
}

export function getClosestFunctionScope(
  node: ParentTrackable
): ts.SignatureDeclaration | null {
  let parent = node.__parent__;
  while (parent && !ts.isFunctionLike(parent)) {
    parent = parent.__parent__;
  }

  return parent || null;
}

export function getFunctionIdentifier(node: ts.SignatureDeclaration) {
  if (ts.isFunctionDeclaration(node) && node.name) return node.name;

  let parent = (node as ParentTrackable).__parent__;
  while (parent && (parent as any).name) {
    parent = (node as ParentTrackable).__parent__;
  }

  return parent;
}
