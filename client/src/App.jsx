import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Layout } from "./components/Layout.jsx";
import { Protected } from "./components/Protected.jsx";

const Home = lazy(() => import("./pages/Home.jsx").then((m) => ({ default: m.Home })));
const About = lazy(() => import("./pages/Home.jsx").then((m) => ({ default: m.About })));
const FaqPage = lazy(() => import("./pages/Home.jsx").then((m) => ({ default: m.FaqPage })));
const Gallery = lazy(() => import("./pages/Home.jsx").then((m) => ({ default: m.Gallery })));
const Contact = lazy(() => import("./pages/Home.jsx").then((m) => ({ default: m.Contact })));
const Builder = lazy(() => import("./pages/Builder.jsx").then((m) => ({ default: m.Builder })));
const Prebuilt = lazy(() => import("./pages/Catalog.jsx").then((m) => ({ default: m.Prebuilt })));
const ComponentsPage = lazy(() => import("./pages/Catalog.jsx").then((m) => ({ default: m.ComponentsPage })));
const ShareBuild = lazy(() => import("./pages/Catalog.jsx").then((m) => ({ default: m.ShareBuild })));
const Login = lazy(() => import("./pages/Auth.jsx").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("./pages/Auth.jsx").then((m) => ({ default: m.Register })));
const CartPage = lazy(() => import("./pages/Cart.jsx").then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("./pages/Cart.jsx").then((m) => ({ default: m.CheckoutPage })));
const Dashboard = lazy(() => import("./pages/Account.jsx").then((m) => ({ default: m.Dashboard })));
const BuildsPage = lazy(() => import("./pages/Account.jsx").then((m) => ({ default: m.BuildsPage })));
const OrdersPage = lazy(() => import("./pages/Account.jsx").then((m) => ({ default: m.OrdersPage })));
const OrderDetail = lazy(() => import("./pages/Account.jsx").then((m) => ({ default: m.OrderDetail })));
const ProfilePage = lazy(() => import("./pages/Account.jsx").then((m) => ({ default: m.ProfilePage })));
const SupportPage = lazy(() => import("./pages/Account.jsx").then((m) => ({ default: m.SupportPage })));
const Admin = lazy(() => import("./pages/Admin.jsx").then((m) => ({ default: m.Admin })));

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="page-loader muted">LOADING KAELON…</div>}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/builder" element={<Builder />} />
                <Route path="/prebuilt" element={<Prebuilt />} />
                <Route path="/components" element={<ComponentsPage />} />
                <Route path="/build/:shareId" element={<ShareBuild />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={<Protected><CartPage /></Protected>} />
                <Route path="/checkout" element={<Protected><CheckoutPage /></Protected>} />
                <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
                <Route path="/dashboard/builds" element={<Protected><BuildsPage /></Protected>} />
                <Route path="/dashboard/orders" element={<Protected><OrdersPage /></Protected>} />
                <Route path="/dashboard/profile" element={<Protected><ProfilePage /></Protected>} />
                <Route path="/dashboard/support" element={<Protected><SupportPage /></Protected>} />
                <Route path="/order/:id" element={<Protected><OrderDetail /></Protected>} />
                <Route path="/admin/*" element={<Protected role="ADMIN"><Admin /></Protected>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
