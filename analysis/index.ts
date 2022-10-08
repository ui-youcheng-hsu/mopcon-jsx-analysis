import getAstNode from "./getAstNode";
import getExportedJsx from "./getExportedJsx";

async function start() {
  const sourceNode = await getAstNode("./src/App.tsx");
  getExportedJsx(sourceNode);
}
start();
