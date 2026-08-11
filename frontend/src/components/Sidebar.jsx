// // import React from 'react'
// // import { LayoutDashboard, FileText, Database, Settings, Box, FlaskConical, Tag, Ship } from 'lucide-react';
// // // import dsbrdIcon from "../public/iconImgs/dsbrd_menu-icon.svg";


// // function Sidebar({ collapsed }) {
// //   const menuItems = [
// //     // { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },.
// //     {
// //     name: "Dashboard",
// //     icon: <img src="/iconImgs/dsbrd_menu-icon.svg" className="w-5 h-5" />,
// //   },
// //     { name: 'PP Sample', icon: <img src="/iconImgs/pp_menu-icon.svg" className="w-5 h-5" />,},
// //     { name: 'MDM Material Code', icon: <img src="/iconImgs/mdm_menu-icon.svg" className="w-5 h-5" />,},
// //     { name: 'FSO Creation', icon: <img src="/iconImgs/fso_menu-icon.svg" className="w-5 h-5" />, },
// //     { name: 'Carton Activity', icon: <img src="/iconImgs/carton_menu-icon.svg" className="w-5 h-5" />,active: true },
// //     { name: 'Lab Dip', icon: <img src="/iconImgs/lab_menu-icon.svg" className="w-5 h-5" />, },
// //     { name: 'TOP Activity', icon: <img src="/iconImgs/topActivity_menu-icon.svg" className="w-5 h-5" />, },
// //     { name: 'Container Booking', icon: <img src="/iconImgs/container_menu-icon.svg" className="w-5 h-5" />, },
// //   ];

// //   return (
// //     <div className="h-full bg-white flex flex-col pt-4 pl-2">

// //       <nav className="flex-1 overflow-y-auto overflow-x-hidden">
// //         {/* 'MENU' Label - only visible when expanded */}
// //         <div className={`px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-300 ${collapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
// //             Menu
// //         </div>

// //         <ul>
// //           {menuItems.map((item, index) => (
// //             <li key={index} className="mb-1">
// //               <a 
// //                 href="#" 
// //                 className={`flex items-center py-3 font-medium transition-colors duration-150
// //                   ${collapsed ? 'justify-center px-0' : 'justify-start px-4'} 
// //                   ${item.active 
// //                     ? 'bg-[#003366] text-white rounded-l-full' 
// //                     : 'text-gray-600 rounded-l-full hover:bg-gray-100 hover:text-gray-900'
// //                   }`}
// //               >
// //                 {/* Icon */}
// //                 <span className={`flex-shrink-0 ${item.active ? 'text-white' : 'text-gray-500'}`}>
// //                     {item.icon}
// //                 </span>

// //                 {/* Text - Completely removed from DOM when collapsed */}
// //                 {!collapsed && (
// //                     <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300">
// //                         {item.name}
// //                     </span>
// //                 )}
// //               </a>
// //             </li>
// //           ))}
// //         </ul>
// //       </nav>
// //     </div>
// //   )
// // }

// // export default Sidebar
















// import React from 'react';
// // We don't need the direct Lucide imports if you are using custom SVGs, 
// // but keeping the import consistent with your original file just in case.
// import { LayoutDashboard } from 'lucide-react'; 

// function Sidebar({ collapsed }) {
//   // 1. DATA REFACTOR: 
//   // Store only data (strings), not JSX components. 
//   // This allows the UI to decide how to render and color them.
//   const menuItems = [
//     { 
//       name: "Dashboard", 
//       iconSrc: "/iconImgs/dsbrd_menu-icon.svg",
//       active: false 
//     },
//     { 
//       name: 'PP Sample', 
//       iconSrc: "/iconImgs/pp_menu-icon.svg",
//       active: false 
//     },
//     { 
//       name: 'MDM Material Code', 
//       iconSrc: "/iconImgs/mdm_menu-icon.svg",
//       active: false 
//     },
//     { 
//       name: 'FSO Creation', 
//       iconSrc: "/iconImgs/fso_menu-icon.svg",
//       active: false 
//     },
//     { 
//       name: 'Carton Activity', 
//       iconSrc: "/iconImgs/carton_menu-icon.svg", 
//       active: true // Matches your screenshot
//     },
//     { 
//       name: 'Lab Dip', 
//       iconSrc: "/iconImgs/lab_menu-icon.svg",
//       active: false 
//     },
//     { 
//       name: 'TOP Activity', 
//       iconSrc: "/iconImgs/topActivity_menu-icon.svg",
//       active: false 
//     },
//     { 
//       name: 'Container Booking', 
//       iconSrc: "/iconImgs/container_menu-icon.svg",
//       active: false 
//     },
//   ];

//   return (
//     <div className="h-full bg-white flex flex-col pt-4 pl-2 border-r border-gray-100">

//       <nav className="flex-1 overflow-y-auto overflow-x-hidden">
//         {/* 'MENU' Label */}
//         <div className={`px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-all duration-300 ${collapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
//             Menu
//         </div>

//         <ul className="space-y-1">
//           {menuItems.map((item, index) => (
//             <li key={index}>
//               <a 
//                 href="#" 
//                 className={`
//                   group flex items-center py-3 font-medium transition-all duration-200
//                   ${collapsed ? 'justify-center px-2' : 'justify-start px-4'} 

//                   /* ACTIVE STATE STYLES */
//                   ${item.active 
//                     ? 'bg-[#003366] text-white shadow-md' // Active: Dark Blue Bg, White Text
//                     : 'text-gray-600 hover:bg-gray-100 hover:text-[#003366]' // Inactive: Gray Text, Blue Text on Hover
//                   }
//                   rounded-l-full
//                 `}
//               >
//                 {/* 2. ICON RENDERING (THE FIX): 
//                    Instead of an <img />, we use a <div> with a mask.
//                    'bg-current' ensures the icon takes the exact color of the text (parent).
//                    - When Active: parent is text-white -> icon is white.
//                    - When Hover: parent is hover:text-[#003366] -> icon turns blue.
//                 */}
//                 <div 
//                   className={`w-5 h-5 flex-shrink-0 bg-current transition-colors duration-200`}
//                   style={{
//                     maskImage: `url(${item.iconSrc})`,
//                     WebkitMaskImage: `url(${item.iconSrc})`, // Safari support
//                     maskSize: 'contain',
//                     WebkitMaskSize: 'contain',
//                     maskRepeat: 'no-repeat',
//                     WebkitMaskRepeat: 'no-repeat',
//                     maskPosition: 'center',
//                     WebkitMaskPosition: 'center'
//                   }}
//                 />

//                 {/* Text Label */}
//                 {!collapsed && (
//                     <span className="ml-3 whitespace-nowrap overflow-hidden text-sm">
//                         {item.name}
//                     </span>
//                 )}
//               </a>
//             </li>
//           ))}
//         </ul>
//       </nav>
//     </div>
//   )
// }

// export default Sidebar;

import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar({ collapsed, role }) {

  const fullMenu = [
    {
      name: "Dashboard",
      iconSrc: "/iconImgs/dsbrd_menu-icon.svg",
      path: "/dashboard"
    },
    {
      name: 'PP Sample',
      iconSrc: "/iconImgs/pp_menu-icon.svg",
      path: "/pp"
    },
    {
      name: 'MDM Material Code',
      iconSrc: "/iconImgs/mdm_menu-icon.svg",
      path: "/mdm"
    },
    {
      name: 'FSO Creation',
      iconSrc: "/iconImgs/fso_menu-icon.svg",
      path: "/fso"
    },
    {
      name: 'Carton Activity',
      iconSrc: "/iconImgs/carton_menu-icon.svg",
      path: "/"
    },
    {
      name: 'Lab Dip',
      iconSrc: "/iconImgs/lab_menu-icon.svg",
      path: "/lab"
    },
    {
      name: 'TOP Activity',
      iconSrc: "/iconImgs/topActivity_menu-icon.svg",
      path: "/top"
    },
    {
      name: 'Container Booking',
      iconSrc: "/iconImgs/container_menu-icon.svg",
      path: "/container"
    },
  ];

  // 🔥 Role-based filtering
  let filteredMenu = fullMenu;

  if (['ttqm', 'warehouse', 'ppc', 'purchase'].includes(role.toLowerCase())) {
    filteredMenu = fullMenu.filter(
      item => item.name === "Dashboard" || item.name === "Carton Activity"
    );
  }

  return (
    <div className="h-full bg-white flex flex-col pt-4 pl-2 border-r border-gray-100">

      <nav className="flex-1 overflow-y-auto overflow-x-hidden">

        <div
          className={`px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-all duration-300 ${collapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
            }`}
        >
          Menu
        </div>

        <ul className="space-y-1">
          {filteredMenu.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  group flex items-center py-3 font-medium transition-all duration-200
                  ${collapsed ? 'justify-center px-2' : 'justify-start px-4'}
                  ${isActive
                    ? 'bg-[#003366] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#003366]'
                  }
                  rounded-l-full
                `}
              >
                {/* Mask-based Icon */}
                <div
                  className="w-5 h-5 flex-shrink-0 bg-current transition-colors duration-200"
                  style={{
                    maskImage: `url(${item.iconSrc})`,
                    WebkitMaskImage: `url(${item.iconSrc})`,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center'
                  }}
                />

                {!collapsed && (
                  <span className="ml-3 whitespace-nowrap overflow-hidden text-sm">
                    {item.name}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
