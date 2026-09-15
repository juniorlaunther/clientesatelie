import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
content = `import { AuthProvider, useAuth } from './contexts/AuthContext';\nimport Login from './pages/Login';\nimport { useStore } from './store/useStore';\nimport { Navigate, Outlet } from 'react-router-dom';\nimport { Loader2, LogOut } from 'lucide-react';\n` + content;

// ProtectedRoute
const protectedRoute = `
function ProtectedRoute() {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
`;

content = content.replace("function Sidebar(", protectedRoute + "\nfunction Sidebar(");

// Add Logout logic to Sidebar
const sidebarRegex = /<nav className="flex-1 p-4 space-y-2 overflow-y-auto">[\s\S]*?<\/nav>/;
const sidebarMatch = content.match(sidebarRegex);
if (sidebarMatch) {
  let nav = sidebarMatch[0];
  const logoutBtn = `
          <div className="pt-4 mt-4 border-t border-neutral-200">
            <button onClick={() => {
               useStore.getState().invalidateCache();
               // clear any local memory if needed, though state is wiped on navigate normally if unmounted
               useAuth().logout();
            }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
  `;
  nav = nav.replace("</nav>", logoutBtn + "</nav>");
  content = content.replace(sidebarMatch[0], nav);
}

// Add the AuthProvider and Routes
const appRegex = /export default function App\(\) \{\n\s*return \(\n\s*<BrowserRouter>\n\s*<Layout \/>\n\s*<\/BrowserRouter>\n\s*\);\n\}/;
const newApp = `
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<Layout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
`;
content = content.replace(appRegex, newApp);

// Remove the individual routes from Layout and keep them inside Layout?
// Ah wait, Layout currently has:
/*
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            ...
          </Routes>
        </main>
*/
// The above routing change `<Route path="/*" element={<Layout />} />` works perfectly with nested Routes inside Layout.

// Wait, the hook `useAuth` is used in Sidebar, but Sidebar is inside Layout, which is wrapped in AuthProvider, so it's fine.
// But we cannot call `useAuth().logout()` inside `onClick` directly without it being a hook invocation issue (React rules of hooks: can't call hooks inside callbacks).
// Let's fix Sidebar:
content = content.replace("function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (v: boolean) => void }) {", 
"function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (v: boolean) => void }) {\n  const { logout } = useAuth();\n  const invalidateCache = useStore(state => state.invalidateCache);");

content = content.replace("useAuth().logout();", "logout(); invalidateCache();");
content = content.replace("useStore.getState().invalidateCache();", "");

fs.writeFileSync('src/App.tsx', content);
