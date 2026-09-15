const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('<span>Presentes</span>')) {
  code = code.replace(
    /<Link to="\/listas"[\s\S]*?<\/Link>/,
    `<Link to="/listas" onClick={() => setMobileOpen(false)} className={navLinkClass("/listas")}>
            <List size={20} />
            <span>Listas Salvas</span>
          </Link>
          <Link to="/presentes" onClick={() => setMobileOpen(false)} className={navLinkClass("/presentes")}>
            <Gift size={20} />
            <span>Presentes</span>
          </Link>`
  );
}

fs.writeFileSync('src/App.tsx', code);
