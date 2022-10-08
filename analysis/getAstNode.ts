import fs from "fs/promises";
import * as ts from "typescript";

export default async function getAstNode(filePath: string) {
  const code = await fs.readFile(filePath, "utf-8");
  return ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest);
}
