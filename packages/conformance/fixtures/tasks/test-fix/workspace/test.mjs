import { add } from "./src/add.js";

if (add(2, 3) !== 5) {
  console.error("expected 5");
  process.exit(1);
}

console.log("tests passed: expected 5");
