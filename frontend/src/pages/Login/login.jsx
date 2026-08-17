import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [samlLoading, setSamlLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  // ─── Handle SAML redirect-back with tokens in URL params ───────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get('token');
    const role = params.get('role');

    console.log(params, "params --");
    console.log(window.location.search, "window.location.search --");
    console.log(access, " - access");
    console.log(role, " - role");

    if (access && role) {
      try {
        // ✅ create user manually
        const user = { role };

        localStorage.setItem('access_token', access);
        localStorage.setItem('user', JSON.stringify(user));

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Navigate first
        navigate("/", { replace: true });

        // Then update state
        onLogin(role);

      } catch (err) {
        console.error(err);
        setError('AD login failed. Please try again.');
      }
    }

    if (params.get('saml_error')) {
      setError('AD Authentication failed.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ─── Regular email/password login ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed');

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── AD / SAML login ───────────────────────────────────────────────────────
  const handleADLogin = () => {
    setSamlLoading(true);
    // Full-page redirect — the SAML dance happens server-side
    window.location.href = `${API_BASE_URL}/api/saml/login/`;
  };

  return (
    <div className="min-h-[128vh] w-full flex flex-col font-sans text-slate-800 bg-[url('./images/bgimg.png')] bg-cover bg-center bg-no-repeat">

      {/* Header */}
      <header className="p-6 md:px-8 bg-white h-12 sm:h-14 flex items-center shadow-lg">
        <img src="./images/blue-logo.svg" alt="Welspun Logo" />
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-6xl flex flex-col md:flex-row items-center gap-6 px-6">

          {/* Left Illustration */}
          <div className="hidden md:flex md:w-5/12 items-center justify-center relative">
            <div className="absolute w-[320px] h-[320px] bg-blue-100/50 rounded-full blur-3xl -z-10" />
            <img
              src="./images/login.svg"
              alt="Login Illustration"
              className="w-[320px] lg:w-[380px] max-w-full"
            />
          </div>

          {/* Login Form */}
          <div className="w-full max-w-md space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Log In</h1>
              <p className="text-slate-500 text-sm">
                Please Enter Your Login Credential <br /> To Continue
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>

              {/* Error */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-slate-600 ml-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="johnwelles@gmail.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-[#003566] focus:ring-2 focus:ring-[#003566] outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-slate-600 ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="******"
                    className="w-full px-4 py-3.5 rounded-xl border border-[#003566]/10 focus:ring-2 focus:ring-[#003566] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading || samlLoading}
                className="w-full cursor-pointer md:w-40 bg-[#003566] text-white font-semibold py-3.5 rounded-lg shadow-lg disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* AD Login Button */}
            <button
              type="button"
              onClick={handleADLogin}
              disabled={loading || samlLoading}
              className="w-full flex items-center justify-center gap-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-lg shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              {/* Microsoft "four squares" logo */}
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
                <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              {samlLoading ? 'Redirecting to AD...' : 'Sign in with Microsoft AD'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default LoginPage;

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Eye, EyeOff } from 'lucide-react';

// const LoginPage = ({ onLogin }) => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const navigate = useNavigate();
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           email,
//           password,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.detail || 'Login failed');
//       }

//       // 🔐 Store tokens
//       localStorage.setItem('access_token', data.access);
//       localStorage.setItem('refresh_token', data.refresh);
//       localStorage.setItem('user', JSON.stringify(data.user));

//       // ✅ Notify App.jsx
//       onLogin(data.user.role);

//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-[128vh] w-full flex flex-col font-sans text-slate-800 bg-[url('./images/bgimg.png')] bg-cover bg-center bg-no-repeat">
      
//       {/* Header */}
//       <header className="p-6 md:px-8 bg-white h-12 sm:h-14 flex items-center shadow-lg">
//         <img src="./images/blue-logo.svg" alt="Welspun Logo" />
//       </header>

//       {/* <main className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-10 lg:px-16 pb-12 gap-12"> */}
//     <main className="flex-1 flex items-center justify-center">
//   <div className="w-full max-w-6xl flex flex-col md:flex-row items-center gap-6 px-6">

//         {/* Left Illustration */}
// <div className="hidden md:flex md:w-5/12 items-center justify-center relative">
//           <div className="absolute w-[320px] h-[320px] bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
// <img 
//   src="./images/login.svg" 
//   alt="Login Illustration"
//   className="w-[320px] lg:w-[380px] max-w-full"
// />
//         </div>

//         {/* Login Form */}
//         <div className="w-full max-w-md space-y-6">
//           <div>
//             <h1 className="text-4xl font-bold text-slate-900 mb-2">Log In</h1>
//             <p className="text-slate-500 text-sm">
//               Please Enter Your Login Credential <br /> To Continue
//             </p>
//           </div>

//           <form className="space-y-6" onSubmit={handleSubmit}>
            
//             {/* Error */}
//             {error && (
//               <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
//                 {error}
//               </div>
//             )}

//             {/* Email */}
//             <div>
//               <label className="text-sm font-medium text-slate-600 ml-1">
//                 Email address
//               </label>
//               <input
//                 type="email"
//                 required
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="johnwelles@gmail.com"
//                 className="w-full px-4 py-3.5 rounded-xl border border-[#003566] focus:ring-2 focus:ring-[#003566] outline-none"
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label className="text-sm font-medium text-slate-600 ml-1">
//                 Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="******"
//                   className="w-full px-4 py-3.5 rounded-xl border border-[#003566]/10 focus:ring-2 focus:ring-[#003566] outline-none"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
//                 >
//                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               </div>
//             </div>

//             {/* Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full cursor-pointer md:w-40 bg-[#003566] text-white font-semibold py-3.5 rounded-lg shadow-lg disabled:opacity-60"
//             >
//               {loading ? 'Logging in...' : 'Login'}
//             </button>
//           </form>
//         </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default LoginPage;



// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Eye, EyeOff } from 'lucide-react';

// const LoginPage = ({ onLogin }) => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const navigate = useNavigate();
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           email,
//           password,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.detail || 'Login failed');
//       }

//       // 🔐 Store tokens
//       localStorage.setItem('access_token', data.access);
//       localStorage.setItem('refresh_token', data.refresh);
//       localStorage.setItem('user', JSON.stringify(data.user));

//       // ✅ Notify App.jsx
//       onLogin(data.user.role);

//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-[128vh] w-full flex flex-col font-sans text-slate-800 bg-[url('./images/bgimg.png')] bg-cover bg-center bg-no-repeat">
      
//       {/* Header */}
//       <header className="p-6 md:px-8 bg-white h-12 sm:h-14 flex items-center shadow-lg">
//         <img src="./images/blue-logo.svg" alt="Welspun Logo" />
//       </header>

//       {/* <main className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-10 lg:px-16 pb-12 gap-12"> */}
//     <main className="flex-1 flex items-center justify-center">
//   <div className="w-full max-w-6xl flex flex-col md:flex-row items-center gap-6 px-6">

//         {/* Left Illustration */}
// <div className="hidden md:flex md:w-5/12 items-center justify-center relative">
//           <div className="absolute w-[320px] h-[320px] bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
// <img 
//   src="./images/login.svg" 
//   alt="Login Illustration"
//   className="w-[320px] lg:w-[380px] max-w-full"
// />
//         </div>

//         {/* Login Form */}
//         <div className="w-full max-w-md space-y-6">
//           <div>
//             <h1 className="text-4xl font-bold text-slate-900 mb-2">Log In</h1>
//             <p className="text-slate-500 text-sm">
//               Please Enter Your Login Credential <br /> To Continue
//             </p>
//           </div>

//           <form className="space-y-6" onSubmit={handleSubmit}>
            
//             {/* Error */}
//             {error && (
//               <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
//                 {error}
//               </div>
//             )}

//             {/* Email */}
//             <div>
//               <label className="text-sm font-medium text-slate-600 ml-1">
//                 Email address
//               </label>
//               <input
//                 type="email"
//                 required
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="johnwelles@gmail.com"
//                 className="w-full px-4 py-3.5 rounded-xl border border-[#003566] focus:ring-2 focus:ring-[#003566] outline-none"
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label className="text-sm font-medium text-slate-600 ml-1">
//                 Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="******"
//                   className="w-full px-4 py-3.5 rounded-xl border border-[#003566]/10 focus:ring-2 focus:ring-[#003566] outline-none"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
//                 >
//                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               </div>
//             </div>

//             {/* Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full cursor-pointer md:w-40 bg-[#003566] text-white font-semibold py-3.5 rounded-lg shadow-lg disabled:opacity-60"
//             >
//               {loading ? 'Logging in...' : 'Login'}
//             </button>
//           </form>
//         </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default LoginPage;


// // import React, { useState } from 'react';
// // import { Eye, EyeOff } from 'lucide-react';

// // // Accept onLogin as a prop from App.jsx
// // const LoginPage = ({ onLogin }) => {
// //   const [showPassword, setShowPassword] = useState(false);

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     // You can add your authentication logic here (e.g., calling an API)
// //     // For now, it just triggers the login state in App.jsx
// //     onLogin();
// //   };

// //   return (
// //     <div className="min-h-[128vh] w-full flex flex-col font-sans text-slate-800 bg-[url('./images/bgimg.png')] bg-cover bg-center bg-no-repeat">
// //       {/* Header Section */}
// //       <header className="p-6 md:px-8 bg-white h-12 sm:h-14 flex items-center shadow-lg">
// //         <img src="./images/blue-logo.svg" alt="Welspun Logo" />
// //       </header>

// //       {/* Main Content */}
// //       <main className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-12 lg:px-24 pb-12 gap-12">
        
// //         {/* Left Side: 3D Illustration Section */}
// //         <div className="hidden md:flex flex-1 relative items-center justify-center">
// //           <div className="absolute w-[400px] h-[400px] bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
// //           <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
// //             <img src="./images/login.svg" alt="Login Illustration" />
// //           </div>
// //         </div>

// //         {/* Right Side: Login Form Section */}
// //         <div className="w-full max-w-md space-y-8">
// //           <div className="space-y-2">
// //             <h1 className="text-4xl font-bold text-slate-900">Log In</h1>
// //             <p className="text-slate-500 text-sm">
// //               Please Enter Your Login Credential <br /> To Continue
// //             </p>
// //           </div>

// //           <form className="space-y-6" onSubmit={handleSubmit}>
// //             {/* Email Field */}
// //             <div className="space-y-2">
// //               <label className="text-sm font-medium text-slate-600 ml-1">Email address</label>
// //               <input 
// //                 type="email" 
// //                 required
// //                 placeholder="johnwelles@gmail.com"
// //                 className="w-full px-4 py-3.5 rounded-xl border border-[#003566] bg-white focus:ring-2 focus:ring-[#003566] focus:border-transparent outline-none transition-all placeholder:text-slate-400"
// //               />
// //             </div>

// //             {/* Password Field */}
// //             <div className="space-y-2">
// //               <label className="text-sm font-medium text-slate-600 ml-1">Password</label>
// //               <div className="relative">
// //                 <input 
// //                   type={showPassword ? "text" : "password"} 
// //                   required
// //                   placeholder="******"
// //                   className="w-full px-4 py-3.5 rounded-xl border border-[#003566]/10 bg-white focus:ring-2 focus:ring-[#003566] focus:border-transparent outline-none transition-all"
// //                 />
// //                 <button 
// //                   type="button"
// //                   onClick={() => setShowPassword(!showPassword)}
// //                   className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
// //                 >
// //                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
// //                 </button>
// //               </div>
// //             </div>

// //             {/* Login Button */}
// //             <button 
// //               type="submit"
// //               className="w-full md:w-40 bg-[#003566] hover:bg-[#001D3D] text-white font-semibold py-3.5 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95 cursor-pointer"
// //             >
// //               Login
// //             </button>
// //           </form>
// //         </div>
// //       </main>
// //     </div>
// //   );
// // };

// // export default LoginPage;