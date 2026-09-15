const fs = require('fs');
let s = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

// 1. Remove the strict height calculation on the main wrapper
s = s.replace(
  /className="p-4 md:p-8 max-w-7xl mx-auto h-\[calc\(100vh-theme\(spacing\.16\)\)\] md:h-screen flex flex-col"/,
  'className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col"'
);

// 2. Modify the filters top wrapper to remove the "card" styling
s = s.replace(
  /className="bg-white rounded-t-2xl shadow-sm border-x border-t border-neutral-200 p-4 flex-shrink-0"/,
  'className="mb-4"'
);

// 3. Modify the table wrapper to remove the card styling and vertical scroll restriction
s = s.replace(
  /className="bg-white rounded-b-2xl shadow-sm border border-neutral-200 overflow-hidden flex-1 flex flex-col min-h-0 relative"/,
  'className="w-full relative"'
);

// 4. Change the inner table wrapper to only scroll horizontally, not vertically
s = s.replace(
  /className="overflow-auto flex-1"/,
  'className="overflow-x-auto w-full"'
);

// 5. Modify the pagination footer to remove its card styling
s = s.replace(
  /className="border-t border-neutral-200 p-4 bg-neutral-50 flex items-center justify-between flex-shrink-0"/,
  'className="py-6 flex items-center justify-between flex-shrink-0 mt-4"'
);

// 6. Fix the header sticking if needed, or remove sticky top since we rely on page scroll
s = s.replace(
  /className="text-xs text-neutral-500 uppercase bg-neutral-50 sticky top-0 z-10 shadow-sm"/,
  'className="text-xs text-neutral-500 uppercase bg-transparent border-b border-neutral-200"'
);

fs.writeFileSync('src/pages/Clientes.tsx', s);
