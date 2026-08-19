import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Protected from './components/Protected';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Prebuild = lazy(() => import('./pages/Prebuild'));
const Product = lazy(() => import('./pages/Product'));
const Configure = lazy(() => import('./pages/Configure'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Contact = lazy(() => import('./pages/Contact'));
const Faq = lazy(() => import('./pages/Faq'));
const Policy = lazy(() => import('./pages/Policy'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Forgot = lazy(() => import('./pages/Forgot'));
const Reset = lazy(() => import('./pages/Reset'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyConfig = lazy(() => import('./pages/MyConfig'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Support = lazy(() => import('./pages/Support'));
const Profile = lazy(() => import('./pages/Profile'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Admin = lazy(() => import('./pages/admin/Admin'));
const Shared = lazy(() => import('./pages/Shared'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Fallback() {
  return (
    <div className="wrap" style={{ padding: 48 }}>
      <div className="skel" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/prebuild" element={<Prebuild />} />
            <Route path="/prebuild/:slug" element={<Product />} />
            <Route path="/configure" element={<Configure />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact-us" element={<Contact />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/refund-policy" element={<Policy kind="refund" />} />
            <Route path="/privacy-policy" element={<Policy kind="privacy" />} />
            <Route path="/terms-of-service" element={<Policy kind="terms" />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<Forgot />} />
            <Route path="/reset-password" element={<Reset />} />
            <Route path="/share/:token" element={<Shared />} />
            <Route
              path="/dashboard"
              element={
                <Protected>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/my-config"
              element={
                <Protected>
                  <MyConfig />
                </Protected>
              }
            />
            <Route
              path="/my-orders"
              element={
                <Protected>
                  <MyOrders />
                </Protected>
              }
            />
            <Route
              path="/support"
              element={
                <Protected>
                  <Support />
                </Protected>
              }
            />
            <Route
              path="/profile"
              element={
                <Protected>
                  <Profile />
                </Protected>
              }
            />
            <Route
              path="/cart"
              element={
                <Protected>
                  <Cart />
                </Protected>
              }
            />
            <Route
              path="/checkout"
              element={
                <Protected>
                  <Checkout />
                </Protected>
              }
            />
          </Route>
          <Route
            path="/admin/*"
            element={
              <Protected role="ADMIN">
                <Admin />
              </Protected>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
