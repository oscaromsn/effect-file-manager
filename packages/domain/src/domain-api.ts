import { EventStreamRpc } from "./api/event-stream-rpc.js";
import { FilesRpc } from "./api/files/files-rpc.js";
import { ResumeRpc } from "./api/resume/resume-rpc.js";

export class DomainRpc extends EventStreamRpc.merge(FilesRpc).merge(ResumeRpc) {}
