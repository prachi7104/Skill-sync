import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { read, utils } from "xlsx";
import {
  computeCategoryDistribution,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS,
  parseAmcatRows,
  processAmcatData,
} from "@/lib/amcat/parser";

function parseCSV(text: string): { headers: string[]; rows: unknown[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV file has no data rows");

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const rows = lines
    .slice(1)
    .filter((line) => line.trim() && !line.startsWith(",,"))
    .map(parseCSVLine);

  return { headers, rows };
}

function parseSpreadsheet(filePath: string): { headers: string[]; rows: unknown[][] } {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".csv") {
    return parseCSV(readFileSync(filePath, "utf8"));
  }

  if (ext === ".xlsx" || ext === ".xls") {
    const workbook = read(readFileSync(filePath), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const matrix = utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
    const headers = (matrix[0] as string[]).map(String);
    const rows = matrix
      .slice(1)
      .filter((row: string[]) => row.some((value) => value !== ""));
    return { headers, rows };
  }

  throw new Error("Unsupported file extension. Use .csv, .xlsx, or .xls");
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/amcat-dry-run.ts <path-to-amcat-file>");
    process.exit(1);
  }

  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const { headers, rows } = parseSpreadsheet(filePath);
  const { data, unmapped, errors } = parseAmcatRows(headers, rows);
  const processed = processAmcatData(data, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);
  const distribution = computeCategoryDistribution(processed);

  console.log("AMCAT Dry Run Report");
  console.log("====================");
  console.log(`File: ${filePath}`);
  console.log(`Headers: ${headers.length}`);
  console.log(`Rows in sheet: ${rows.length}`);
  console.log(`Rows parsed as AMCAT records: ${data.length}`);
  console.log(`Unmapped columns: ${unmapped.length}`);
  console.log(`Parse errors: ${errors.length}`);
  console.log("Distribution:", distribution);

  if (unmapped.length > 0) {
    console.log("\nUnmapped columns:");
    for (const col of unmapped) {
      console.log(`- ${col}`);
    }
  }

  if (errors.length > 0) {
    console.log("\nParse errors:");
    for (const err of errors.slice(0, 20)) {
      console.log(`- ${err}`);
    }
    if (errors.length > 20) {
      console.log(`...and ${errors.length - 20} more`);
    }
  }

  if (data.length > 0) {
    console.log("\nPreview (first 3 parsed rows):");
    console.log(JSON.stringify(processed.slice(0, 3), null, 2));
  }
}

main().catch((err) => {
  console.error("AMCAT dry run failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
