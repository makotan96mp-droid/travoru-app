const fs = require("fs");
const path = "app/_components/ItineraryForm.tsx";
let src = fs.readFileSync(path, "utf8");

// そのままの {startDate}/{endDate} を replaceAll 版に置換
src = src.replaceAll("{startDate}", '{startDate?.replaceAll("-", "/")}');
src = src.replaceAll("{endDate}", '{endDate?.replaceAll("-", "/")}');

fs.writeFileSync(path, src);
console.log("✅ Notes の日付フォーマットを YYYY/MM/DD に統一しました:", path);
