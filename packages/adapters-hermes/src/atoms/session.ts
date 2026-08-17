import type { HermesSpecialAtomDescriptor } from "./types.ts"

export const hermesSessionStoreSqliteFtsAtom: HermesSpecialAtomDescriptor = {
  id: "hermes.session.store.sqlite-fts",
  port: "session.store",
  implementation: "Hermes SQLite/FTS session reference descriptor",
  referenceSource: "reference only: hermes_state.py; current adapter descriptor does not prove native SQLite/FTS session execution",
  implementationKind: "metadata-only",
}
