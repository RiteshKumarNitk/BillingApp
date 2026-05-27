const fs = require('fs'); 
const paths = [
  'app/(app)/products/page.tsx', 
  'app/(app)/dashboard/page.tsx', 
  'app/(app)/dashboard/DashboardCharts.tsx', 
  'app/(app)/billing/[id]/page.tsx', 
  'app/(app)/billing/page.tsx'
]; 
paths.forEach(p => { 
  let c = fs.readFileSync(p, 'utf8'); 
  c = c.replace(/₹\{/g, '${'); 
  c = c.replace(/₹₹/g, '₹'); // Fix double currency symbols too!
  fs.writeFileSync(p, c); 
}); 
console.log('Fixed broken template literals');
