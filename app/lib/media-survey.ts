import "server-only";
import { db } from "./db";
import { IMAGE_COLUMNS, countSql } from "./media-migration";

export type SurveyRow = { column: string; movable: number; orphaned: number };
export type Survey = { rows: SurveyRow[]; movable: number; orphaned: number };

/**
 * Count what still sits inside content rows as a `data:` URL, split into what
 * can be matched to a stored media row and what cannot. Reads only.
 */
export async function surveyMedia(): Promise<Survey> {
  const rows: SurveyRow[] = [];
  let movable = 0;
  let orphaned = 0;
  for (const [table, column] of IMAGE_COLUMNS) {
    const sql = countSql(table, column);
    try {
      const m = Number((await db.execute(sql.movable)).rows[0]?.n ?? 0);
      const o = Number((await db.execute(sql.orphaned)).rows[0]?.n ?? 0);
      if (m || o) rows.push({ column: `${table}.${column}`, movable: m, orphaned: o });
      movable += m;
      orphaned += o;
    } catch {
      // A table this deployment does not have is not worth failing the survey for.
    }
  }
  return { rows, movable, orphaned };
}
