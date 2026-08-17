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
      name: 'Sample - Top/Testing Etc',
      iconSrc: "/iconImgs/pp_menu-icon.svg",
      path: "/pp-sample"
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
      name: 'Carton View PPC',
      iconSrc: "/iconImgs/carton_menu-icon.svg",
      path: "/pp-sample-carton-view"
    },
    {
      name: 'Carton Activity',
      iconSrc: "/iconImgs/carton_menu-icon.svg",
      path: "/"
    },
    {
      name: 'Lab Dip',
      iconSrc: "/iconImgs/lab_menu-icon.svg",
      path: "/lab-dip"
    },
    {
      name: 'Artwork Management',
      iconSrc: "/iconImgs/carton_menu-icon.svg",   // temp icon, baad me apna svg daal dena
      path: "/artwork"
    },
    {
      name: 'Container Booking',
      iconSrc: "/iconImgs/container_menu-icon.svg",
      path: "/container"
    },
  ];

  // 🔥 Role-based filtering
  let filteredMenu = fullMenu;

  if (['ttqm', 'warehouse', 'purchase'].includes(role.toLowerCase())) {
    filteredMenu = fullMenu.filter(
      item => item.name === "Dashboard" || item.name === "Carton Activity" || item.name === "Artwork Management"
    );
  }

  if (role.toLowerCase() === 'ppc') {
    filteredMenu = fullMenu.filter(
      item => item.name === "Dashboard" || item.name === "Sample - Top/Testing Etc" || item.name === "TOP Activity" ||  item.name === "Carton View PPC" || item.name === "Artwork Management"
    );
  }

  if (role.toLowerCase() === 'lab') {
    filteredMenu = fullMenu.filter(
      item => item.name === "Dashboard" || item.name === "Lab Dip" 
    );
  }

  if (role.toLowerCase() === 'procurement') {
    filteredMenu = fullMenu.filter(
      item => item.name === "Artwork Management"
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

// import React from 'react';
// import { NavLink } from 'react-router-dom';

// function Sidebar({ collapsed, role }) {

//   const fullMenu = [
//     {
//       name: "Dashboard",
//       iconSrc: "/iconImgs/dsbrd_menu-icon.svg",
//       path: "/dashboard"
//     },
//     {
//       name: 'PP Sample',
//       iconSrc: "/iconImgs/pp_menu-icon.svg",
//       path: "/pp-sample"
//     },
//     {
//       name: 'MDM Material Code',
//       iconSrc: "/iconImgs/mdm_menu-icon.svg",
//       path: "/mdm"
//     },
//     {
//       name: 'FSO Creation',
//       iconSrc: "/iconImgs/fso_menu-icon.svg",
//       path: "/fso"
//     },
//     {
//       name: 'Carton Activity',
//       iconSrc: "/iconImgs/carton_menu-icon.svg",
//       path: "/"
//     },
//     {
//       name: 'Lab Dip',
//       iconSrc: "/iconImgs/lab_menu-icon.svg",
//       path: "/lab-dip"
//     },
//     {
//       name: 'TOP Activity',
//       iconSrc: "/iconImgs/topActivity_menu-icon.svg",
//       path: "/pp-sample-ppc"
//     },
//     {
//       name: 'Container Booking',
//       iconSrc: "/iconImgs/container_menu-icon.svg",
//       path: "/container"
//     },
//   ];

//   // 🔥 Role-based filtering
//   let filteredMenu = fullMenu;

//   if (['ttqm', 'warehouse', 'purchase'].includes(role.toLowerCase())) {
//     filteredMenu = fullMenu.filter(
//       item => item.name === "Dashboard" || item.name === "Carton Activity"
//     );
//   }

//   return (
//     <div className="h-full bg-white flex flex-col pt-4 pl-2 border-r border-gray-100">

//       <nav className="flex-1 overflow-y-auto overflow-x-hidden">

//         <div
//           className={`px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-all duration-300 ${collapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
//             }`}
//         >
//           Menu
//         </div>

//         <ul className="space-y-1">
//           {filteredMenu.map((item, index) => (
//             <li key={index}>
//               <NavLink
//                 to={item.path}
//                 className={({ isActive }) => `
//                   group flex items-center py-3 font-medium transition-all duration-200
//                   ${collapsed ? 'justify-center px-2' : 'justify-start px-4'}
//                   ${isActive
//                     ? 'bg-[#003366] text-white shadow-md'
//                     : 'text-gray-600 hover:bg-gray-100 hover:text-[#003366]'
//                   }
//                   rounded-l-full
//                 `}
//               >
//                 {/* Mask-based Icon */}
//                 <div
//                   className="w-5 h-5 flex-shrink-0 bg-current transition-colors duration-200"
//                   style={{
//                     maskImage: `url(${item.iconSrc})`,
//                     WebkitMaskImage: `url(${item.iconSrc})`,
//                     maskSize: 'contain',
//                     WebkitMaskSize: 'contain',
//                     maskRepeat: 'no-repeat',
//                     WebkitMaskRepeat: 'no-repeat',
//                     maskPosition: 'center',
//                     WebkitMaskPosition: 'center'
//                   }}
//                 />

//                 {!collapsed && (
//                   <span className="ml-3 whitespace-nowrap overflow-hidden text-sm">
//                     {item.name}
//                   </span>
//                 )}
//               </NavLink>
//             </li>
//           ))}
//         </ul>
//       </nav>
//     </div>
//   );
// }

// export default Sidebar;
