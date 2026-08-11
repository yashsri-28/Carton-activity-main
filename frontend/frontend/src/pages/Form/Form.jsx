import React, { useRef } from 'react';
import BathRobeForm from "./BathRobeForm";
import BathTerryForm from "./BathTerryForm";
import BedsheetForm from "./BedSheetForm"



// Reusable Input Component
const InputField = ({
  label,
  placeholder,
  name,
  value,
  onChange,
  type = "text",
  isTextarea = false,   // 👈 new prop
  rows = 3              // 👈 default rows
}) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-sm font-semibold text-gray-700">
      {label}
    </label>

    {isTextarea ? (
      <textarea
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm resize-none"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
      />
    )}
  </div>
);

const RadioField = ({ label, name, value, onChange }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-sm font-semibold text-gray-700">
      {label}
    </label>
    <div className="flex gap-6">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name={name}
          value="True"
          checked={value === "True"}
          onChange={onChange}
          className="accent-[#0f3460]"
        />
        <span className="text-sm text-gray-700">Yes</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name={name}
          value="False"
          checked={value === "False"}
          onChange={onChange}
          className="accent-[#0f3460]"
        />
        <span className="text-sm text-gray-700">No</span>
      </label>
    </div>
  </div>
);


// Wrapper
const FormItem = ({ children }) => (
  <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-6">
    {children}
  </div>
);

function Form({
  formData,
  onInputChange,
  companies,
  onCompanyChange,
  selectedFile,
  onFileChange,
  onRemoveFile,
  loading,
  hideAttachment = false
}) {
  const fileInputRef = useRef(null);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="w-full px-0 mb-6">


        {/* Product Category */}
        <div className="w-full md:w-1/1 lg:w-1/3 px-0 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Category
          </label>

          <select
            name="productCategory"
            value={formData.productCategory || ""}
            onChange={onInputChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 
               text-gray-700 bg-white 
               focus:outline-none focus:ring-2 focus:ring-[#0f3460] 
               focus:border-[#0f3460] 
               transition-all duration-200 shadow-sm"
          >
            <option value="">Towel</option>
            <option value="Bedsheet">Bedsheet</option>
            <option value="Bath Robe">Bath Robe</option>
            <option value="Terry Towel">Terry Towel</option>
          </select>
        </div>




        {/* Bath Robe Form */}
        {formData.productCategory === "Bath Robe" && (
          <BathRobeForm
            formData={formData}
            onInputChange={onInputChange}
          />
        )}


        {/* Bath Terry Form */}
        {formData.productCategory === "Terry Towel" && (
          <BathTerryForm
            formData={formData}
            onInputChange={onInputChange}
          />
        )}


        {/* Bedsheet Form */}
        {formData.productCategory === "Bedsheet" && (
          <BedsheetForm
            formData={formData}
            onInputChange={onInputChange}
          />
        )}


      </div>
      {formData.productCategory === "" && (

        <div className="flex flex-wrap items-end -mx-4">
          {/* Row 1: Activity Name + Customer Name + Program Name */}
          <FormItem>
            <InputField
              label="Activity Name "
              name="activityName"
              value={formData.activityName}
              onChange={onInputChange}
              placeholder="Select Activity Name"
              required
            />
          </FormItem>


          <FormItem>
            {/* Header row */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Customer Name <span className="text-red-500 ml-1"> *</span>
              </label>

              {/* Old/New Slider */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Old</span>

                <button
                  type="button"
                  onClick={() =>
                    onInputChange({
                      target: {
                        name: "customerType",
                        value: formData.customerType === "new" ? "old" : "new"
                      }
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200
          ${formData.customerType === "new"
                      ? "bg-[#0f3460]"
                      : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
            ${formData.customerType === "new"
                        ? "translate-x-6"
                        : "translate-x-0"
                      }`}
                  />
                </button>

                <span className="text-xs text-gray-600">New</span>
              </div>
            </div>

            {/* Input */}
            <InputField
              name="customerName"
              value={formData.customerName}
              onChange={onInputChange}
              placeholder="Enter Customer Name"
            // required
            />
          </FormItem>


          <FormItem>
            <InputField
              label="Program Name "
              name="programName"
              value={formData.programName}
              onChange={onInputChange}
              placeholder="Enter Program Name"
              required
            />
          </FormItem>

          {/* Row 2 */}
          <FormItem>
            <InputField
              label="Customer Protocol"
              name="customerProtocol"
              value={formData.customerProtocol}
              onChange={onInputChange}
              placeholder="Customer Protocol"
              sublabel="(Min & Max Dimensions)"
            />
          </FormItem>
          <FormItem>
            <InputField
              label="Confirm New Program Or Shifted From Vapi"
              name="newOrShifted"
              value={formData.newOrShifted}
              onChange={onInputChange}
              placeholder="New or Shifted from Vapi"
            />
          </FormItem>
          <FormItem>
            <InputField
              label="Original Towel"
              name="original_towel"
              value={formData.original_towel}
              onChange={onInputChange}
              placeholder="Enter Original Towel"
            />
          </FormItem>

          {/* Row 3 */}
          <FormItem>
            <InputField
              label="Polybag Manual / Automatic"
              name="polybagManualAuto"
              value={formData.polybagManualAuto}
              onChange={onInputChange}
              placeholder="Manual / Automatic"
            />
          </FormItem>
          <FormItem>
            <InputField
              label="Polybag Type"
              name="polybag_type"
              value={formData.polybag_type}
              onChange={onInputChange}
              placeholder="Enter Polybag Type"
            />
          </FormItem>
          <FormItem>
            <RadioField
              label="Pallet / Slip Sheet Requirement"
              name="palletRequirement"
              value={formData.palletRequirement}
              onChange={onInputChange}
            // placeholder="Yes/No + Details" 
            />
          </FormItem>

          {/* Row 4 */}
          {/* <FormItem>
          <InputField 
            label="Special Carton/PDQ/CDU Required" 
            name="specialCarton" 
            value={formData.specialCarton} 
            onChange={onInputChange} 
            placeholder="Yes/No + Details" 
          />
        </FormItem>
        <FormItem>
          <InputField 
            label="Sample Carton/PDQ/CDU Arranged" 
            name="sampleCarton" 
            value={formData.sampleCarton} 
            onChange={onInputChange} 
            placeholder="Yes/No + Details" 
          />
        </FormItem> */}
          {/* Special Required Section */}
          <FormItem>
            <RadioField
              label="Special Carton Required"
              name="specialCarton"
              value={formData.specialCarton}
              onChange={onInputChange}
            />
          </FormItem>

          <FormItem>
            <RadioField
              label="Special PDQ Required"
              name="specialPDQ"
              value={formData.specialPDQ}
              onChange={onInputChange}
            />
          </FormItem>

          <FormItem>
            <RadioField
              label="Special CDU Required"
              name="specialCDU"
              value={formData.specialCDU}
              onChange={onInputChange}
            />
          </FormItem>

          {/* Sample Section */}

          <FormItem>
            <RadioField
              label="Sample PDQ Arranged"
              name="samplePDQ"
              value={formData.samplePDQ}
              onChange={onInputChange}
            />
          </FormItem>

          <FormItem>
            <RadioField
              label="Sample CDU Arranged"
              name="sampleCDU"
              value={formData.sampleCDU}
              onChange={onInputChange}
            />
          </FormItem>

          <FormItem>
            <InputField
              label="Single PDQ or Monster PDQ"
              name="singleOrMonsterPDQ"
              value={formData.singleOrMonsterPDQ}
              onChange={onInputChange}
              placeholder="Single / Monster"
            />
          </FormItem>

          {/* Row 5 */}
          <FormItem>
            <InputField
              label="PDQ Layers Stacking"
              name="pdqLayers"
              value={formData.pdqLayers}
              onChange={onInputChange}
              placeholder="How many layers"
            />
          </FormItem>
          <FormItem>
            <InputField
              label="Common PDQ for All Sizes"
              name="commonPDQ"
              value={formData.commonPDQ}
              onChange={onInputChange}
              placeholder="Yes/No"
            />
          </FormItem>
          <FormItem>
            <InputField
              label="Small PDQ on Pallet Requirement"
              name="smallPDQRequirement"
              value={formData.smallPDQRequirement}
              onChange={onInputChange}
              placeholder="Yes/No"
            />
          </FormItem>

          {/* Row 6 */}
          <FormItem>
            <InputField
              label="Small PDQ Quantity per Pallet"
              name="small_pdq_count_on_pallet_or_slipsheet"
              value={formData.small_pdq_count_on_pallet_or_slipsheet}
              onChange={onInputChange}
              placeholder="Enter quantity"
            />
          </FormItem>
          <FormItem>
            <InputField
              label="Warehouse/Store Handling"
              name="warehouse_store_handling_method"
              value={formData.warehouse_store_handling_method}
              onChange={onInputChange}
              placeholder="Handling process"
            />
          </FormItem>
          <FormItem>
            <InputField
              label="Towel Fold Condition"
              name="towel_folded_and_poly_packed_before_carton"
              value={formData.towel_folded_and_poly_packed_before_carton}
              onChange={onInputChange}
              placeholder="Before carton working"
            />
          </FormItem>

          {/* Row 7 */}
          <FormItem>
            <InputField
              label="Separator/Protector Required"
              name="separatorRequired"
              value={formData.separatorRequired}
              onChange={onInputChange}
              placeholder="Yes/No + Details"
            />
          </FormItem>
          <FormItem>
            <InputField
              label="Ribbon Packing"
              name="ribbonPacking"
              value={formData.ribbonPacking}
              onChange={onInputChange}
              placeholder="Yes/No + Arrange samples"
            />
          </FormItem>
          <FormItem>
            <InputField
              label="Belly Band Packing"
              name="bellyBandPacking"
              value={formData.bellyBandPacking}
              onChange={onInputChange}
              placeholder="Yes/No + Arrange samples"
            />
          </FormItem>

          <FormItem>
            <InputField
              label="Remark"
              name="remark"
              value={formData.remark}
              onChange={onInputChange}
              placeholder="Enter Remark"
              isTextarea={true}     // 👈 makes it big
              rows={4}              // 👈 control height
            />
          </FormItem>

          {/* Attachment (Full Width) */}
          {!hideAttachment && (
            <div className="w-full md:w-2/3 lg:w-1/3 px-4 mb-6">
              <div className="flex flex-col gap-2 w-full h-full justify-end formAtachmnt">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.png,.doc,.docx"
                  disabled={loading}
                />
                <div
                  onClick={triggerFileUpload}
                  className={`
                flex items-center cursor-pointer 
                border-2 border-dashed border-[#0f3460]/30 rounded-xl p-4 h-[76px] mt-auto
                transition-all duration-200 group relative bg-[#f8f9fc] hover:bg-[#f0f4ff]
                ${selectedFile ? 'border-green-500 bg-green-50' : ''}
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                >
                  {selectedFile ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-gray-800 truncate">{selectedFile.name}</span>
                        <span className="text-[10px] text-green-600">Attached Successfully</span>
                      </div>
                      <button
                        onClick={onRemoveFile}
                        disabled={loading}
                        className="ml-auto p-1 bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm border border-gray-100 flex-shrink-0 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-1 w-full">
                      <div className="p-2 bg-[#eef2f7] rounded-lg group-hover:bg-[#dce7f5] transition-colors flex-shrink-0">
                        <svg className="w-5 h-5 text-[#0f3460]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">Attachments</span>
                        <span className="text-[10px] text-gray-500 leading-tight">Please Attach File (PDF)...</span>
                      </div>
                    </div>
                  )}



                </div>
              </div>
            </div>
          )}
        </div>)}



    </div>
  );
}

export default Form;