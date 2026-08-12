
import React, { useState } from 'react';

import Form from './Form';

import Table from './Table'; // Ensure this path is correct in your project



function FormMain({ onBack }) {

  // 1. Centralized State for form data

  const [formData, setFormData] = useState({

    customerName: '',

    programName: '',

    customerProtocol: '',

    newOrShifted: '',

    originalTowel: '',

    polybagManualAuto: '',

    polybagType: '',

    palletRequirement: '',

    specialCarton: '',

    sampleCarton: '',

    singleOrMonsterPDQ: '',

    pdqLayers: '',

    commonPDQ: '',

    smallPDQRequirement: '',

    smallPDQQuantity: '',

    warehouseHandling: '',

    towelFoldCondition: '',

    separatorRequired: '',

    ribbonPacking: '',

    bellyBandPacking: ''

  });



  // 2. State for the File Upload

  const [selectedFile, setSelectedFile] = useState(null);



  // Handle Text Changes

  const handleInputChange = (e) => {

    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

  };



  // Handle File Selection

  const handleFileChange = (e) => {

    if (e.target.files && e.target.files[0]) {

      setSelectedFile(e.target.files[0]);

    }

  };



  // Handle File Removal

  const handleRemoveFile = (e) => {

    e.stopPropagation();

    setSelectedFile(null);

  };



  // Handle Submit

  const handleSubmit = () => {

    const submissionData = {

      ...formData,

      attachment: selectedFile

    };

    console.log("Submitting Data:", submissionData);

    // Add your API logic here

  };



  // Table Config (Static)

  const productHeaders = ["Program", "Style", "W-In", "L-In", "Wt/Unit", "GSM", "Unit/Carton", "Inner Pack Unit Quantity", "Fold", "Actions"];

  const table1Data = [{ id: 1, col1: "Threshold Fashion Yd DOBBY", col2: "Bath", col3: "30", col4: "54", col5: "585", col6: "560", col7: "4 Sets Per Carton", col8: "1 Set Per Polybag", col9: "As Per Floor Ready" }];

  const sampleHeaders = ["Sample", "Size", "Program", "Quality", "LBS/DZ", "GSM", "Shade", "W-IN", "L-IN", "Actions"];

  const sampleData = [

    { id: 1, col1: "AT30328", col2: "Bath", col3: "Target THD Checker Board", col4: "2/20 RK YD", col5: "15.4", col6: "560", col7: "Ebony/Fawash", col8: "76", col9: "137" },

    { id: 2, col1: "AT30329", col2: "Hand", col3: "Target THD Checker Board", col4: "2/20 RK YD", col5: "4.3", col6: "560", col7: "Ebony/Fawash", col8: "41", col9: "71" },

  ];



  return (

    <div className="min-h-screen bg-gray-50 p-4 font-sans text-sm">

      {/* Header */}

      <div className="mb-4 flex items-center gap-4">

        <button onClick={onBack} className="p-2 bg-white shadow cursor-pointer hover:bg-gray-100 rounded-full transition-colors group">

          <svg className="w-5 h-5 text-gray-500 group-hover:text-[#0f3460]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>

        </button>

        <h1 className="text-xl font-bold text-gray-800">Fill The Below Form Details</h1>

      </div>



      {/* Main Form */}

      <Form

        formData={formData}

        onInputChange={handleInputChange}

        selectedFile={selectedFile}

        onFileChange={handleFileChange}

        onRemoveFile={handleRemoveFile}

      />



      {/* Tables Section */}

      <div className="space-y-8">

        <Table title="Program Specifications (Sets)" headers={productHeaders} data={table1Data} />

        <Table title="Program Specifications (Units)" headers={productHeaders} data={table1Data} />

        <Table title="Sample Specifications" headers={sampleHeaders} data={sampleData} />

      </div>



      {/* Footer / Submit */}

      <div className="bg-white p-6 mt-8 rounded-lg shadow-sm border border-gray-100 flex justify-between items-end">

        <div className="w-72">

          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Request Sent To</label>

          <div className="relative">

            <select className="appearance-none w-full border border-gray-300 rounded-md p-3 bg-white text-gray-700 focus:outline-none focus:border-[#0f3460]">

                <option>John</option>

                <option>Logistics Team</option>

            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">

                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>

            </div>

          </div>

        </div>

       

        <button

          onClick={handleSubmit}

          className="bg-[#0f3460] hover:bg-[#0a2545] text-white px-10 py-3 rounded-md font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95"

        >

          Submit

        </button>

      </div>

    </div>

  )

}



export default FormMain;

