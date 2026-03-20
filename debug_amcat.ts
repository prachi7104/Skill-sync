
import { 
  parseAmcatRows, 
  processAmcatData, 
  DEFAULT_WEIGHTS, 
  DEFAULT_THRESHOLDS 
} from "./lib/amcat/parser";

const headers = [
  "email", "sap_id", "full_name", "course", "branch", "programme_name", 
  "status", "attendance_pct", "cs_score", "cp_score", "automata_score", 
  "automata_fix_score", "quant_score"
];

const rows = [
  ["alice@stu.upes.ac.in", "500123001", "Alice Kumar", "BTech", "CSE", "CSE-IV", "Present", "85", "85", "80", "92", "88", "75"],
  ["bob@stu.upes.ac.in", "500123002", "Bob Singh", "BTech", "CSE", "CSE-IV", "Present", "80", "45", "48", "55", "52", "50"],
  ["charlie@stu.upes.ac.in", "500123003", "Charlie Brown", "BTech", "IT", "IT-IV", "Present", "75", "25", "28", "32", "30", "26"]
];

const { data: parsed } = parseAmcatRows(headers, rows);
const processed = processAmcatData(parsed, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);

processed.forEach(p => {
  console.log(`Student: ${p.full_name}, Total: ${p.computed_total}, Category: ${p.final_category}`);
});
