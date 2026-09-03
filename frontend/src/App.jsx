// src/App.jsx
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import CartonMain from './pages/Carton activity/CartonMain'
import FormMain from './pages/Form/FormMain'
import CartonView from './pages/Carton activity/CartonView'
import EditCartonForm from './pages/Form/EditCartonForm'
import LoginPage from './pages/Login/login'
import CartonMainTTQM from './pages/Carton activity/CartonMainTTQM';
import CartonMainPPC from './pages/Carton activity/CartonMainPPC';
import CartonMainWarehouse from './pages/Carton activity/CartonMainWarehouse';
import PPSampleMarketing from './pages/PP_Sample/PP_SampleMarketing'
import PPSamplePPC from './pages/PP_Sample/PP_SamplePPC'
import PPSampleTOP from './pages/PP_Sample/PP_SampleTOP'
import PPSamplePPCView from './pages/PP_Sample/PP_SamplePPCView'
import LabDipMarketing from './pages/Lab Dip/Lab_DipMarketing'
import LabDipLab from './pages/Lab Dip/Lab_Dip_Lab'
import LabDipView from './pages/Lab Dip/Lab_Dip_View'
import GussetView from './pages/Carton activity/GussetView'
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard'
import ArtworkList from './pages/Artwork/ArtworkList';
import ArtworkForm from './pages/Artwork/ArtworkForm';
import PackagingSpecForm from './pages/Artwork/PackagingSpecForm';
import ArtworkDetails from './pages/Artwork/ArtworkDetails';
import ArtworkManagementTabs from './pages/Artwork/ArtworkManagementTabs';
// import GussetView from './pages/Carton activity/GussetView'
// import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [role, setRole] = useState(() => {
    return localStorage.getItem('userRole');
  });

  const handleLogin = (userRole) => {
    const normalizedRole = userRole.toLowerCase();

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', normalizedRole);

    setRole(normalizedRole);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setRole(null);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col bg-gray-50 font-sans text-gray-800 !h-[128vh]">
      <Topbar
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div
          className={`${isSidebarOpen ? 'w-64' : 'w-20'
            } transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden border-r border-gray-200`}
        >
          <Sidebar collapsed={!isSidebarOpen} role={role} />
        </div>

        <main className="flex-1 overflow-hidden">
          {/* <Routes>
            <Route
              path="/"
              element={
                role === 'ttqm' 
                  ? <CartonMainTTQM /> 
                  : role === 'purchase' 
                  ? <CartonMainTTQM /> 
                  : role === 'ppc'
                  ? <CartonMainPPC />
                  : <CartonMain />
              }
            />
            <Route
              path="/form"
              element={
                role === 'marketing' || role === 'ppc'
                  ? <FormMain />
                  : <Navigate to="/" replace />
              }
            />

            <Route
              path="/carton/edit/:id"
              element={
                role === 'marketing' || role === 'ppc'
                  ? <EditCartonForm />
                  : <Navigate to="/" replace />
              }
            />
            <Route path="/carton/view/:id" element={<CartonView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes> */}

          {/* // src/App.jsx - Update the routes section */}
          <Routes>
            <Route
              path="/"
              element={
                role === 'super_admin' ? <SuperAdminDashboard /> :
                role === 'ttqm' ? <CartonMainTTQM /> :
                  role === 'purchase' ? <CartonMainTTQM /> :
                    // role === 'ppc' ? <CartonMainPPC /> :
                    role === 'ppc' ? <PPSamplePPC /> :
                      role === 'warehouse' ? <CartonMainWarehouse /> :
                        role === 'lab' ? <LabDipLab /> :
                         role === 'procurement' ? <ArtworkList role={role} /> :
                          <CartonMain />
              }
            />
            <Route
              path="/pp-sample"
              element={
                role === 'ttqm' ? <CartonMainTTQM /> :
                  role === 'purchase' ? <CartonMainTTQM /> :
                    role === 'ppc' ? <PPSamplePPC /> :
                      role === 'top' ? <PPSampleTOP /> :
                        role === 'warehouse' ? <CartonMainWarehouse /> :
                          <PPSampleMarketing />
              }
            />
            <Route
              path="/pp-sample-ppc"
              element={
                role === 'marketing' ? <PPSamplePPC /> :
                  role === 'ppc' ? <PPSamplePPC /> :
                    role === 'top' ? <PPSampleTOP /> :
                      <PPSampleMarketing />
              }
            />
            <Route
              path="/pp-sample-ppc-view/:id"
              element={
                role === 'ppc' ? <PPSamplePPCView /> :
                  <PPSampleMarketing />
              }
            />
            <Route
              path="/pp-sample-carton-view"
              element={
                role === 'ppc' ? <CartonMainPPC /> :
                  <Navigate to="/" replace />
              }
            />
            <Route
              path="/lab-dip"
              element={
                role === 'ttqm' ? <LabDipMarketing /> :
                  role === 'lab' ? <LabDipLab /> :
                    //   role === 'ppc' ? <PPSamplePPC /> :
                    //     role === 'top' ? <PPSampleTOP /> :
                    //       role === 'warehouse' ? <CartonMainWarehouse /> :
                    <LabDipMarketing />
              }
            />
            <Route
              path="/form"
              element={
                role === 'marketing'
                  ? <FormMain />
                  : <Navigate to="/" replace />
              }
            />

            <Route
              path="/carton/edit/:id"
              element={
                role === 'marketing'
                  ? <EditCartonForm />
                  : <Navigate to="/" replace />
              }
            />
            <Route path="/carton/view/:id" element={<CartonView />} />
            <Route path="/gusset/view/:id" element={<GussetView />} />
            <Route
              path="/superadmin"
              element={
                role === 'super_admin' ? <SuperAdminDashboard /> : <Navigate to="/" replace />
              }
            />

            {/* <Route path="/gusset/view/:id" element={<GussetView />} /> */}
            <Route path="/lab-dip/view/:id" element={<LabDipView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/artwork" element={<ArtworkManagementTabs role={role} />} />
            <Route path="/artwork/new" element={<ArtworkForm />} />
            <Route path="/artwork/new-spec" element={<PackagingSpecForm />} />
            <Route path="/artwork/:artworkId" element={<ArtworkDetails role={role} />} />
          </Routes>

        </main>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </div>
  );
}

export default App;