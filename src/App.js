import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Cart = lazy(() => import("./pages/Cart"));
const Profile = lazy(() => import("./pages/Profile"));
const Products = lazy(() => import("./pages/Products"));
const Accessories = lazy(() => import("./pages/Accessories"));
const AccessoriesDetailsPage = lazy(() => import("./pages/AccessoriesDetailsPage"));
const Help = lazy(() => import("./pages/Help"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
const AddReview = lazy(() => import("./components/AddReview"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const OrderNow = lazy(() => import("./pages/OrderNow"));
const About = lazy(() => import("./pages/About"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const AdminFeedback = lazy(() => import("./pages/AdminFeedback"));
const AdminExistingProducts = lazy(() => import("./pages/AdminExistingProducts"));
const AdminAddProduct = lazy(() => import("./pages/AdminAddProduct"));
const AdminEditProduct = lazy(() => import("./pages/AdminEditProduct"));
const AdminBills = lazy(() => import("./pages/AdminBills"));
const BillsHistory = lazy(() => import("./pages/BillsHistory"));
const ClerkSessionSync = lazy(() => import("./components/ClerkSessionSync"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));

// Loading component for lazy-loaded routes
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

function AdminProtectedRoute({ children }) {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const location = useLocation();
  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return children;
}

function Layout({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Suspense fallback={<LoadingSpinner />}>
          <ClerkSessionSync />
        </Suspense>
        <Router>
          <Layout>
            <ToastContainer position="top-center" autoClose={500} />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/products" element={<Products />} />
                <Route path="/accessory" element={<Accessories />} />    
                <Route path="/accessory/:id" element={<AccessoriesDetailsPage />} /> 
                <Route path="/search" element={<SearchResults />} />
                <Route path="/review" element={<ReviewsPage />} />
                <Route path="/add-review" element={<AddReview />} />
                <Route path="/help" element={<Help />} />
                <Route path="/about" element={<About />} />
                <Route path="/bills" element={<BillsHistory />} />
                <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminProtectedRoute>} />
                <Route path="/productdetails/:id" element={<ProductDetails />} />
                <Route path="/ordernow" element={<OrderNow />} />
                <Route path="/admin/products" element={<AdminProtectedRoute><AdminLayout><AdminProducts /></AdminLayout></AdminProtectedRoute>} />
                <Route path="/admin/existing-products" element={<AdminProtectedRoute><AdminLayout><AdminExistingProducts /></AdminLayout></AdminProtectedRoute>} />
                <Route path="/admin/add-product" element={<AdminProtectedRoute><AdminLayout><AdminAddProduct /></AdminLayout></AdminProtectedRoute>} />
                <Route path="/admin/edit-product/:id" element={<AdminProtectedRoute><AdminLayout><AdminEditProduct /></AdminLayout></AdminProtectedRoute>} />
                <Route path="/admin/orders" element={<AdminProtectedRoute><AdminLayout><AdminOrders /></AdminLayout></AdminProtectedRoute>} />
                <Route path="/admin/bills" element={<AdminProtectedRoute><AdminLayout><AdminBills /></AdminLayout></AdminProtectedRoute>} />
                <Route path="/admin/customers" element={<AdminProtectedRoute><AdminLayout><AdminCustomers /></AdminLayout></AdminProtectedRoute>} />
                <Route path="/admin/feedback" element={<AdminProtectedRoute><AdminLayout><AdminFeedback /></AdminLayout></AdminProtectedRoute>} />
                <Route path="/admin/login" element={<AdminLogin />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default App;