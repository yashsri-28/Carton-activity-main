// src/pages/PP_Sample/PP_SampleTOP.jsx
import React, { useState, useEffect } from "react";
import { ChevronRight, Eye, X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../api/axiosInstance"; // Adjust path as needed

function PPSampleTOP() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state for viewing details
  const [selectedSample, setSelectedSample] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Fetch list of PP samples
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/api/pp-sample/top_required_pp_samples/");
        const data = response.data || [];

        // Map backend response to table-friendly structure
        const mapped = data.map((item) => ({
          id: item.pp_sample_id,
          sampleSaleOrderNo: item.sample_sale_order_no || "-",
          existingCustomer: "-", // Not in response → placeholder
          customerName: item.customer_name || "-",
          brandName: item.brand_name || "-",
          saleOrderNo: item.sample_sale_order_no || "-",
          noOfSampleSKU: item.no_of_samples?.toString() || "0",
          remarks: "-", // Not in response → placeholder
          topRequired: item.top_required ?? false,
          testingRequired: item.testing_required ?? false,
          status: item.status || "Pending",
          createdOn: item.created_on || "-",
        }));

        setSamples(mapped);
      } catch (err) {
        console.error("Failed to load PP samples:", err);
        const msg =
          err.response?.data?.detail || err.message || "Failed to load data";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, []);

  // Fetch single sample details for View modal
  const handleAccept = async (sample) => {
    try {
      //   setViewLoading(true);
      //   setSelectedSample(null);

      const response = await api.post("/api/pp-sample/complete_pp_sample/", {
        pp_sample_id: sample.id,
      });

      const details = response.data;

      //   setSelectedSample({
      //     ...sample,
      //     ...details, // merge extra details from response
      //   });
    } catch (err) {
      console.error("Failed to fetch sample details:", err);
      toast.error("Failed to load sample details");
    } finally {
      setViewLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return "bg-green-100 text-green-700 border border-green-200";
      case "approved":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-700 border border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "completed":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };
  const closeModal = () => {
    setSelectedSample(null);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#003366]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        {error}
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto max-w-screen-2xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500">
          <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
          <ChevronRight size={16} className="mx-2" />
          <span className="font-semibold text-[#003366] border-b border-[#003366]">
            PP Sample
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">PP Sample TOP</h1>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#001f3f] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Sample Sale Or. No
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Existing Customer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Brand Name
                </th>
                {/* <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  MAT Code / SO Code
                </th> */}
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                  No of Samples
                </th>
                {/* <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                  Total Quantity
                </th> */}
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {samples.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No PP samples found
                  </td>
                </tr>
              ) : (
                samples.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.sampleSaleOrderNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.existingCustomer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.brandName}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap font-medium">{item.saleOrderNo}</td> */}
                    <td className="px-6 py-4 text-center">
                      {item.noOfSampleSKU}
                    </td>
                    {/* <td className="px-6 py-4 text-center">-</td> */}
                    <td className="px-6 py-4 text-center">{item.remarks}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${getStatusStyles(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleAccept(item)}
                        className="px-4 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-sm rounded-md flex items-center gap-2 mx-auto transition"
                      >
                        Accept
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {selectedSample && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">
                PP Sample Details - {selectedSample.sampleSaleOrderNo}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {viewLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-[#003366]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Sample Sale Order No
                    </label>
                    <p className="mt-1 text-gray-900">
                      {selectedSample.sampleSaleOrderNo}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Customer Name
                    </label>
                    <p className="mt-1 text-gray-900">
                      {selectedSample.customerName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Brand Name
                    </label>
                    <p className="mt-1 text-gray-900">
                      {selectedSample.brandName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      No of Samples
                    </label>
                    <p className="mt-1 text-gray-900">
                      {selectedSample.noOfSampleSKU}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      TOP Required
                    </label>
                    <p className="mt-1">
                      {selectedSample.topRequired ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Testing Required
                    </label>
                    <p className="mt-1">
                      {selectedSample.testingRequired ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600">
                      Status
                    </label>
                    <p className="mt-1">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          selectedSample.status === "Submitted"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedSample.status}
                      </span>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600">
                      Created On
                    </label>
                    <p className="mt-1 text-gray-900">
                      {selectedSample.createdOn}
                    </p>
                  </div>

                  {/* Add more fields from details response if available */}
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PPSampleTOP;

// // src/pages/PP_Sample/PP_SampleTOP.jsx
// import React, { useState } from 'react';
// import { ChevronRight, Eye, MoreVertical, Check, Loader2 } from 'lucide-react';
// import { toast } from 'react-toastify';

// function PPSampleTOP() {
//     // Sample data (replace with real API fetch later)
//     const [samples, setSamples] = useState([
//         {
//             id: 1,
//             sampleSaleOrderNo: 'Enquiry',
//             existingCustomer: 'Aarman',
//             customerName: 'Alfaiz',
//             saleOrderNo: '12345d3d',
//             noOfSampleSKU: '20',
//             remarks: 'Remark',
//             topRequired: true,
//             testingRequired: false,
//             submitting: false,       // new: per-row loading state
//             submitted: false,        // new: per-row success state
//         },
//         {
//             id: 2,
//             sampleSaleOrderNo: 'Enquiry',
//             existingCustomer: 'Vajdan',
//             customerName: 'Alfaiz',
//             saleOrderNo: '12345d3d',
//             noOfSampleSKU: '20',
//             remarks: 'Remark',
//             topRequired: false,
//             testingRequired: true,
//             submitting: false,
//             submitted: false,
//         },
//         {
//             id: 3,
//             sampleSaleOrderNo: 'Enquiry',
//             existingCustomer: 'Ashwini',
//             customerName: 'Alfaiz',
//             saleOrderNo: '12345d3d',
//             noOfSampleSKU: '20',
//             remarks: 'Remark',
//             topRequired: false,
//             testingRequired: false,
//             submitting: false,
//             submitted: false,
//         },
//         // Add more rows as needed
//     ]);

//     const handleCheckboxChange = (id, field) => {
//         setSamples(prev =>
//             prev.map(item =>
//                 item.id === id ? { ...item, [field]: !item[field] } : item
//             )
//         );
//     };

//     const handleRowSubmit = async (id) => {
//         setSamples(prev =>
//             prev.map(item =>
//                 item.id === id ? { ...item, submitting: true, submitted: false } : item
//             )
//         );

//         // Simulate API delay
//         await new Promise(resolve => setTimeout(resolve, 800));

//         const rowToSubmit = samples.find(item => item.id === id);
//         console.log(`Submitting row ${id}:`, rowToSubmit);

//         // Here you would normally do:
//         // await api.post(`/api/pp-sample-ppc/update/${id}`, rowToSubmit);

//         toast.success(`Row ${rowToSubmit.saleOrderNo} submitted successfully!`);

//         setSamples(prev =>
//             prev.map(item =>
//                 item.id === id
//                     ? { ...item, submitting: false, submitted: true }
//                     : item
//             )
//         );

//         // Optional: reset submitted state after 3 seconds
//         setTimeout(() => {
//             setSamples(prev =>
//                 prev.map(item =>
//                     item.id === id ? { ...item, submitted: false } : item
//                 )
//             );
//         }, 3000);
//     };

//     return (
//         <div className="p-4 md:p-6 lg:p-8 mx-auto max-w-screen-2xl">
//             {/* Breadcrumb */}
//             <div className="mb-6">
//                 <h1 className="text-2xl font-bold text-gray-900 mt-2">PP Sample</h1>
//                 <div className="flex items-center text-sm text-gray-500">
//                     <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
//                     <ChevronRight size={16} className="mx-2" />
//                     <span className="font-semibold text-[#003366] border-b border-[#003366]">
//                         PP Sample
//                     </span>
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-[#001f3f] text-white">
//                             <tr>
//                                 <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
//                                     Sample Sale Or. No
//                                 </th>
//                                 <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
//                                     Existing Customer
//                                 </th>
//                                 <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
//                                     Customer Name
//                                 </th>
//                                 <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
//                                     MAT Code
//                                 </th>
//                                 <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
//                                     SO Code
//                                 </th>
//                                 <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
//                                     No of Samples
//                                 </th>
//                                 <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
//                                     Total Quantity
//                                 </th>
//                                 <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
//                                     Remarks
//                                 </th>
//                                 <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
//                                     Action
//                                 </th>
//                             </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
//                             {samples.map((item) => (
//                                 <tr key={item.id} className="hover:bg-gray-50">
//                                     <td className="px-6 py-4 whitespace-nowrap">{item.sampleSaleOrderNo}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap">{item.existingCustomer}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap">{item.customerName}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap font-medium">{item.saleOrderNo}</td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-center">{item.saleOrderNo}</td>
//                                     <td className="px-6 py-4">{item.noOfSampleSKU}</td>
//                                     <td className="px-5 py-3 text-center">50</td>
//                                     <td className="px-5 py-3">{item.remarks}</td>
//                                     {/* Per-row Submit + Action */}
//                                     <td className="px-6 py-4 text-center">
//                                         <div className="flex items-center justify-center gap-3">
//                                             <button
//                                                 //   onClick={() => handleView(row)}
//                                                 className="px-3 py-1.5 bg-[#003366] text-white text-sm rounded-md flex items-center gap-2 hover:bg-[#002244] cursor-pointer"
//                                             >
//                                                 <Eye size={14} />
//                                                 View
//                                             </button>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//         </div>
//     );
// }

// export default PPSampleTOP;
