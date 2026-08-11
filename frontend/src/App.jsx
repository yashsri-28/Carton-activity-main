// // // src/App.jsx  ← REMOVE BrowserRouter from here
// // import { useState } from 'react'
// // import { Routes, Route, Navigate } from 'react-router-dom'   // ← import these
// // import Topbar from './components/Topbar'
// // import Sidebar from './components/Sidebar'
// // import CartonMain from './pages/Carton activity/CartonMain'
// // import FormMain from './pages/Form/FormMain'
// // import CartonView from './pages/Carton activity/CartonView'
// // import EditCartonForm from './pages/Form/EditCartonForm'
// // import LoginPage from './pages/Login/login'
// // import CartonMainTTQM from './pages/Carton activity/CartonMainTTQM';

// // import { ToastContainer } from 'react-toastify';
// // import 'react-toastify/dist/ReactToastify.css';


// // function App() {
// //   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
// //   const [isLoggedIn, setIsLoggedIn] = useState(() => {
// //     return localStorage.getItem('isLoggedIn') === 'true';
// //   });
// //   const [role, setRole] = useState(() => {
// //     return localStorage.getItem('userRole');
// //   });


// //   // const handleLogin = () => {
// //   //   localStorage.setItem('isLoggedIn', 'true');
// //   //   setIsLoggedIn(true);
// //   // };
// //   const handleLogin = (userRole) => {
// //     const normalizedRole = userRole.toLowerCase();

// //     localStorage.setItem('isLoggedIn', 'true');
// //     localStorage.setItem('userRole', normalizedRole);

// //     setRole(normalizedRole);
// //     setIsLoggedIn(true);
// //   };



// //   // const handleLogout = () => {
// //   //   localStorage.removeItem('isLoggedIn');
// //   //   setIsLoggedIn(false);
// //   // };
// //   const handleLogout = () => {
// //     localStorage.removeItem('isLoggedIn');
// //     localStorage.removeItem('userRole');
// //     setIsLoggedIn(false);
// //     setRole(null);
// //   };


// //   if (!isLoggedIn) {
// //     return <LoginPage onLogin={handleLogin} />;
// //   }

// //   return (
// //     <div className="flex flex-col bg-gray-50 font-sans text-gray-800 !h-[128vh]">
// //       <Topbar
// //         toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
// //       // onLogout={handleLogout}  // if Topbar has logout button
// //       />

// //       <div className="flex flex-1 overflow-hidden">
// //         {/* Sidebar */}
// //         <div
// //           className={`${isSidebarOpen ? 'w-64' : 'w-20'
// //             } transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden border-r border-gray-200`}
// //         >
// //           {/* <Sidebar collapsed={!isSidebarOpen} /> */}
// //           <Sidebar collapsed={!isSidebarOpen} role={role} />

// //         </div>

// //         {/* Main content with routes */}
// //         <main className="flex-1 overflow-hidden">
// //           <Routes>
// //             {/* <Route path="/" element={<CartonMain />} />
// //             <Route path="/carton-ttqm" element={<CartonMainTTQM />} /> */}
// //             <Route
// //               path="/"
// //               element={
// //                 role === 'ttqm' || role === 'purchase'
// //                   ? <CartonMainTTQM />
// //                   : <CartonMain />
// //               }
// //             />
// //             <Route
// //               path="/form"
// //               element={
// //                 role === 'marketing'
// //                   ? <FormMain />
// //                   : <Navigate to="/" replace />
// //               }
// //             />

// //             <Route
// //               path="/carton/edit/:id"
// //               element={
// //                 role === 'marketing'
// //                   ? <EditCartonForm />
// //                   : <Navigate to="/" replace />
// //               }
// //             />
// //             <Route path="/carton/view/:id" element={<CartonView />} />




// //             <Route path="*" element={<Navigate to="/" replace />} />

// //           </Routes>
// //         </main>
// //       </div>
// //       <ToastContainer
// //         position="top-right"
// //         autoClose={2500}
// //         newestOnTop
// //         closeOnClick
// //         pauseOnHover
// //         draggable
// //         theme="light"
// //       />
// //     </div>
// //   );
// // }

// // export default App;

// // // import { useState } from 'react'
// // // import Topbar from './components/Topbar'
// // // import Sidebar from './components/Sidebar'
// // // import CartonMain from './pages/Carton activity/CartonMain'
// // // import FormMain from './pages/Form/FormMain'
// // // import LoginPage from './pages/Login/login'

// // // function App() {
// // //   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
// // //   const [currentView, setCurrentView] = useState('carton'); // 'carton' or 'form'
// // //   // const [isLoggedIn, setIsLoggedIn] = useState(false);
// // // const [isLoggedIn, setIsLoggedIn] = useState(() => {
// // //   return localStorage.getItem('isLoggedIn') === 'true';
// // // });

// // // const handleLogin = () => {
// // //   localStorage.setItem('isLoggedIn', 'true');
// // //   setIsLoggedIn(true);
// // // };

// // //   // 1. Check if user is NOT logged in first
// // //   // if (!isLoggedIn) {
// // //   //   return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
// // //   // }
// // //   if (!isLoggedIn) {
// // //   return <LoginPage onLogin={handleLogin} />;
// // // }
// // // const handleLogout = () => {
// // //   localStorage.removeItem('isLoggedIn');
// // //   setIsLoggedIn(false);
// // // };


// // //   if (currentView === 'form') {
// // //     return (
// // //       <div className="max-h-[128vh] overflow-y-auto">
// // //         <FormMain onBack={() => setCurrentView('carton')} />
// // //       </div>
// // //     );
// // //   }


// // //   // Otherwise render the full dashboard layout
// // //   return (
// // //     <div className="flex flex-col max-h-[128vh] bg-gray-50 font-sans text-gray-800">
// // //       <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

// // //       <div className="flex flex-1 overflow-hidden">
// // //         <div
// // //           className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden border-r border-gray-200`}
// // //         >
// // //           <Sidebar collapsed={!isSidebarOpen} />
// // //         </div>

// // //         <main className="flex-1 overflow-auto">
// // //           <CartonMain onCreateRequest={() => setCurrentView('form')} />
// // //         </main>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // export default App




















// // src/App.jsx  ← REMOVE BrowserRouter from here
// import { useState } from 'react'
// import { Routes, Route, Navigate } from 'react-router-dom'   // ← import these
// import Topbar from './components/Topbar'
// import Sidebar from './components/Sidebar'
// import CartonMain from './pages/Carton activity/CartonMain'
// import FormMain from './pages/Form/FormMain'
// import CartonView from './pages/Carton activity/CartonView'
// import EditCartonForm from './pages/Form/EditCartonForm'
// import LoginPage from './pages/Login/login'
// import CartonMainTTQM from './pages/Carton activity/CartonMainTTQM';

// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';


// function App() {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [isLoggedIn, setIsLoggedIn] = useState(() => {
//     return localStorage.getItem('isLoggedIn') === 'true';
//   });
//   const [role, setRole] = useState(() => {
//     return localStorage.getItem('userRole');
//   });

//   const handleLogin = (userRole) => {
//     const normalizedRole = userRole.toLowerCase();

//     localStorage.setItem('isLoggedIn', 'true');
//     localStorage.setItem('userRole', normalizedRole);

//     setRole(normalizedRole);
//     setIsLoggedIn(true);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('isLoggedIn');
//     localStorage.removeItem('userRole');
//     setIsLoggedIn(false);
//     setRole(null);
//   };

//   if (!isLoggedIn) {
//     return <LoginPage onLogin={handleLogin} />;
//   }

//   return (
//     <div className="flex flex-col bg-gray-50 font-sans text-gray-800 !h-[128vh]">
//       <Topbar
//         toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
//       // onLogout={handleLogout}  // if Topbar has logout button
//       />

//       <div className="flex flex-1 overflow-hidden">
//         {/* Sidebar */}
//         <div
//           className={`${isSidebarOpen ? 'w-64' : 'w-20'
//             } transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden border-r border-gray-200`}
//         >
//           {/* <Sidebar collapsed={!isSidebarOpen} /> */}
//           <Sidebar collapsed={!isSidebarOpen} role={role} />

//         </div>

//         {/* Main content with routes */}
//         <main className="flex-1 overflow-hidden">
//           <Routes>
//             <Route
//               path="/"
//               element={
//                 // role === 'ttqm' || role === 'purchase'
//                 role === 'ttqm' || role === 'purchase' || role === 'ppc'
//                   ? <CartonMainTTQM />
//                   : <CartonMain />
//               }
//             />
//             <Route
//               path="/form"
//               element={
//                 role === 'marketing'
//                   ? <FormMain />
//                   : <Navigate to="/" replace />
//               }
//             />

//             <Route
//               path="/carton/edit/:id"
//               element={
//                 role === 'marketing'
//                   ? <EditCartonForm />
//                   : <Navigate to="/" replace />
//               }
//             />
//             <Route path="/carton/view/:id" element={<CartonView />} />
//             <Route path="*" element={<Navigate to="/" replace />} />

//           </Routes>
//         </main>
//       </div>
//       <ToastContainer
//         position="top-right"
//         autoClose={2500}
//         newestOnTop
//         closeOnClick
//         pauseOnHover
//         draggable
//         theme="light"
//       />
//     </div>
//   );
// }

// export default App;






















// src/App.jsx
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
                role === 'ttqm' ? <CartonMainTTQM /> :
                  role === 'purchase' ? <CartonMainTTQM /> :
                    role === 'ppc' ? <CartonMainPPC /> :
                      role === 'warehouse' ? <CartonMainWarehouse /> :
                        <CartonMain />
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
            <Route path="*" element={<Navigate to="/" replace />} />
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