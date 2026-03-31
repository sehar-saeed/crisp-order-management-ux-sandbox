import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavigationSidebar } from './components/layout/NavigationSidebar';
import { NotificationContainer } from './components/NotificationContainer';
import { LandingPage } from './pages/LandingPage';
import { IncomingData } from './pages/IncomingData';
import { OrderBrowsePage } from './pages/orders/OrderBrowsePage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { SupplierBrowse } from './pages/SupplierBrowse';
import { SupplierDetail } from './pages/SupplierDetail';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { PageNotFound } from './pages/PageNotFound';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <NavigationSidebar />
          <main style={{ flex: 1, overflowY: 'auto' }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/incoming-data" element={<IncomingData />} />
              <Route path="/orders" element={<OrderBrowsePage />} />
              <Route path="/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/suppliers" element={<SupplierBrowse />} />
              <Route path="/suppliers/:supplierId" element={<SupplierDetail />} />
              <Route path="/retailers" element={<PlaceholderPage title="Retailer Management" />} />
              <Route path="/retailers/:retailerId" element={<PlaceholderPage title="Retailer Details" />} />
              <Route path="/retailer-suppliers" element={<PlaceholderPage title="Retailer-Supplier Connections" />} />
              <Route path="/product-hierarchy" element={<PlaceholderPage title="Product Hierarchy" />} />
              <Route path="/product-categories" element={<PlaceholderPage title="Product Categories" />} />
              <Route path="/products" element={<PlaceholderPage title="Product Management" />} />
              <Route path="/locations" element={<PlaceholderPage title="Location Management" />} />
              <Route path="/units-of-measure" element={<PlaceholderPage title="Units of Measure" />} />
              <Route path="/users" element={<PlaceholderPage title="User Management" />} />
              <Route path="/users/:userId" element={<PlaceholderPage title="User Details" />} />
              <Route path="/master-retailers" element={<PlaceholderPage title="Master Retailers" showSystemAdminNav />} />
              <Route path="/master-retailers/:retailerId" element={<PlaceholderPage title="Master Retailer Details" showSystemAdminNav />} />
              <Route path="/field-registry" element={<PlaceholderPage title="Field Registry" showSystemAdminNav />} />
              <Route path="/field-registry/:tableName/:columnName" element={<PlaceholderPage title="Field Registry Detail" showSystemAdminNav />} />
              <Route path="/master-retailer-overrides" element={<PlaceholderPage title="Retailer/Client Overrides" showSystemAdminNav />} />
              <Route path="/master-retailer-overrides/:retailerUid/:clientUid" element={<PlaceholderPage title="Override Details" showSystemAdminNav />} />
              <Route path="/rep-splits" element={<PlaceholderPage title="Rep Splits" showSystemAdminNav />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </main>
        </div>
        <NotificationContainer />
      </div>
    </BrowserRouter>
  );
}

export default App;
