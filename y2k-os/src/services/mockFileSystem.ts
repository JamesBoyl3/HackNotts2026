import { simulatedFiles } from "../domain/mockData";
import type { FileOpenResult, SimulatedFile } from "../domain/types";

export function listMockFiles(path: string): SimulatedFile[] {
  if (path === "C:\\HedgeCo") return simulatedFiles;
  const name = path.split("\\").at(-1);
  return simulatedFiles.find(file => file.name === name)?.children ?? [];
}

export function openMockFile(file: SimulatedFile): FileOpenResult {
  if (file.openAs) return { kind: "browser-page", pageId: file.openAs };
  if (file.kind === "text") return { kind: "text", file };
  return { kind: "unsupported", file };
}
