import { useState } from "react";
import { listMockFiles, openMockFile } from "../../services/mockFileSystem";
import type { FileOpenResult, SimulatedFile } from "../../domain/types";

export default function FileExplorer({ onOpen }: { onOpen: (result: FileOpenResult) => void }) {
  const [path, setPath] = useState("C:\\HedgeCo"); const files = listMockFiles(path);
  const openItem = (file: SimulatedFile) => file.kind === "folder" ? setPath(`${path}\\${file.name}`) : onOpen(openMockFile(file));
  return <div className="files-app"><div className="file-toolbar"><button onClick={() => setPath("C:\\HedgeCo")}>← Up</button><input value={path} readOnly /><button>🔍 Find</button></div><div className="file-body"><aside><strong>My Computer</strong><button onClick={() => setPath("C:\\HedgeCo")}>📁 C: (HedgeCo)</button>{files.filter(file => file.kind === "folder").map(file => <button key={file.name} onClick={() => setPath(`${path}\\${file.name}`)}>📁 {file.name}</button>)}</aside><div className="file-list"><div className="file-head">Name <span>Type</span><span>Modified</span></div>{files.map(file => <button key={file.name} onDoubleClick={() => openItem(file)}><span className="file-icon">{file.kind === "folder" ? "📁" : "📄"}</span><strong>{file.name}</strong><span>{file.kind === "folder" ? "File folder" : "Text document"}</span><span>{file.modified}</span></button>)}</div></div><div className="file-status">{files.length} object(s) · Simulated filesystem</div></div>;
}
