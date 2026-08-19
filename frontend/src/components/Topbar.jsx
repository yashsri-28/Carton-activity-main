// import React, { useState, useRef, useEffect } from 'react';
// import { Menu, ChevronDown, LogOut } from 'lucide-react';


// function Topbar({ toggleSidebar }) {
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   // Get logged-in user from localStorage
//   const user = JSON.parse(localStorage.getItem('user'));
//   const userName = user?.username || 'User';

//   // Generate initials from name
//   const getInitials = (name) => {
//     if (!name) return 'U';
//     return name
//       .split(' ')
//       .map(word => word[0])
//       .join('')
//       .toUpperCase();
//   };

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsDropdownOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Logout handler
//   const handleLogout = () => {
//     localStorage.clear();
//     window.location.href = '/login';
//   };

//   return (
//     <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between pr-6 shadow-sm z-50 sticky top-0">

//       {/* Left Section: Logo + Toggle */}
//       <div className="flex items-center h-full">
//         {/* Logo */}
//         <div className="w-44 sm:w-64 h-full bg-[#003366] flex items-center justify-center flex-shrink-0">
//           <img
//             src="/images/white-logo.svg"
//             alt="Logo"
//             className="w-[90%]"
//           />
//         </div>

//         {/* Sidebar Toggle */}
//         <button
//           onClick={toggleSidebar}
//           className="ml-4 w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
//         >
//           <Menu size={20} />
//         </button>
//       </div>

//       {/* Right Section: User Dropdown */}
//       <div className="relative" ref={dropdownRef}>
//         <button
//           onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//           className="flex items-center gap-3 p-1 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
//         >
//           {/* Initials Avatar */}
//           <div className="w-9 h-9 rounded-full bg-[#003366] flex items-center justify-center text-white font-semibold text-sm">
//             {getInitials(userName)}
//           </div>

//           {/* Username */}
//           <div className="flex items-center gap-1">
//             <span className="text-sm font-medium text-gray-800">
//               {userName}
//             </span>
//             <ChevronDown
//               size={16}
//               className={`text-gray-500 transition-transform duration-200 ${
//                 isDropdownOpen ? 'rotate-180' : ''
//               }`}
//             />
//           </div>
//         </button>

//         {/* Dropdown Menu */}
//         {isDropdownOpen && (
//           <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
//             <button
//               onClick={handleLogout}
//               className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
//             >
//               <LogOut size={16} className="mr-2" />
//               Log Out
//             </button>
//           </div>
//         )}
//       </div>
//     </header>
//   );
// }

// export default Topbar;



import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, LogOut } from 'lucide-react';
import ArtworkNotificationBell from './ArtworkNotificationBell';

function Topbar({ toggleSidebar }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const userName = user?.username || 'User';

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between pr-6 shadow-sm z-50 sticky top-0">

      {/* Left Section: Logo + Toggle */}
      <div className="flex items-center h-full">
        {/* Logo */}
        <div className="w-44 sm:w-64 h-full bg-[#003366] flex items-center justify-center flex-shrink-0">
          <img
            src="/images/white-logo.svg"
            alt="Logo"
            className="w-[90%]"
          />
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="ml-4 w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right Section: Notifications + User Dropdown */}
      <div className="flex items-center gap-3">
        <ArtworkNotificationBell />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {/* Initials Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#003366] flex items-center justify-center text-white font-semibold text-sm">
              {getInitials(userName)}
            </div>

            {/* Username */}
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-800">
                {userName}
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut size={16} className="mr-2" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;