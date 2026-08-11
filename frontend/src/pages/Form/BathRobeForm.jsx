import React from "react";
import Attachment from "./Attachment";

// Reusable Components

const InputField = ({
  label,
  placeholder,
  name,
  value,
  onChange,
  type = "text"   // 👈 default text
}) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-sm font-semibold text-gray-700">
      {label}
    </label>

    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
    />
  </div>
);

const RadioField = ({ label, name, value, onChange }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
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
        <span>Yes</span>
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
        <span>No</span>
      </label>
    </div>
  </div>
);

const FormItem = ({ children }) => (

  <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-6">
    {children}
  </div>

);

// MAIN COMPONENT

function BathRobeForm({ formData,
  onInputChange,
  selectedFile,
  onFileChange,
  onRemoveFile,
  loading,
  hideAttachment = false }) {

  return (

    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">

      <div className="flex flex-wrap -mx-4">



        <FormItem>
          <InputField
            label="Activity Name"
            name="activityName"
            value={formData.activityName}
            onChange={onInputChange}
            placeholder="Enter activity name"
          />
        </FormItem>


        <FormItem>
          <InputField
            label="Customer Name"
            name="customerName"
            placeholder="Enter customer name"
            value={formData.customerName}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Program Name"
            name="programName"
            placeholder="Enter program name"
            value={formData.programName}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Customer Protocol"
            name="customerProtocol"
            placeholder="Enter protocol details"
            value={formData.customerProtocol}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Confirm New Program Or Shifted From Vapi"
            name="newOrShifted"
            placeholder="New / Shifted from Vapi"
            value={formData.newOrShifted}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Original Bath Robe"
            name="originalBathRobe"           // ← fixed
            placeholder="Enter original bath robe details"
            value={formData.originalBathRobe}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Bath Robe Sizes"
            name="bathRobeSizes"              // ← fixed
            placeholder="Enter sizes (S, M, L, XL)"
            value={formData.bathRobeSizes}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Bath Robe Dimensions"
            name="bathRobeDimensions"         // ← fixed
            placeholder="Enter dimensions"
            value={formData.bathRobeDimensions}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Bath Robe Weight"
            name="bathRobeWeight"             // ← fixed
            placeholder="Enter weight in grams"
            value={formData.bathRobeWeight}
            onChange={onInputChange}
            type="number"
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Folding Details"
            name="bathRobeFoldingDetails"     // ← fixed
            placeholder="Enter folding method"
            value={formData.bathRobeFoldingDetails}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Required Pcs / Polybag"
            name="bathRobePcsPerPolybag"      // ← fixed
            placeholder="Enter pieces per polybag"
            value={formData.bathRobePcsPerPolybag}
            onChange={onInputChange}
            type="number"
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Required Pcs / Carton"
            name="bathRobePcsPerCarton"       // ← fixed
            placeholder="Enter pieces per Carton"
            value={formData.bathRobePcsPerCarton}
            onChange={onInputChange}
            type="number"
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Polybag Type"
            name="bathRobePolybagType"        // ← fixed
            placeholder="LD Polybag / PP Polybag / PVC Bag"
            value={formData.bathRobePolybagType}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Polybag Size Carton (Size Wise)"
            name="bathRobePolybagSizeCarton"  // ← fixed
            placeholder="Enter Size"
            value={formData.bathRobePolybagSizeCarton}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <RadioField
            label="Pallet Requirement"
            name="pallet"
            value={formData.pallet}
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
            label="Special Carton Required"
            name="specialCarton"
            value={formData.specialCarton}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <RadioField
            label="Any Blister Packing Required"
            name="BlisterPacking"
            value={formData.BlisterPacking}
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

        <FormItem>
          <RadioField
            label="Sample Carton Arranged"
            name="sampleCarton"
            value={formData.sampleCarton}
            onChange={onInputChange}
          />
        </FormItem>


        <FormItem>
          <InputField
            label="Single PDQ or Monster PDQ"
            name="pdqType"
            placeholder="Single PDQ / Monster PDQ"
            value={formData.pdqType}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="PDQ Layers"
            name="pdqLayers"
            placeholder="Enter number of layers"
            value={formData.pdqLayers}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Common PDQ"
            name="commonPDQ"
            placeholder="Yes / No"
            value={formData.commonPDQ}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Small PDQ Requirement"
            name="smallPDQRequirement"
            placeholder="Enter requirement details"
            value={formData.smallPDQRequirement}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Small PDQ Quantity"
            name="smallPDQQuantity"
            placeholder="Enter quantity per pallet"
            value={formData.smallPDQQuantity}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Warehouse Handling"
            name="warehouse"
            placeholder="Enter handling process"
            value={formData.warehouse}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Towel Fold Condition"
            name="towelFoldCondition"
            placeholder="Enter folding condition"
            value={formData.towelFoldCondition}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Separator Required"
            name="separatorRequired"
            placeholder="Yes / No / Details"
            value={formData.separatorRequired}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Ribbon Packing"
            name="ribbonPacking"
            placeholder="Yes / No / Sample"
            value={formData.ribbonPacking}
            onChange={onInputChange}
          />
        </FormItem>



        <FormItem>
          <InputField
            label="Belly Band Packing"
            name="bellyBandPacking"
            placeholder="Yes / No / Sample"
            value={formData.bellyBandPacking}
            onChange={onInputChange}
          />
        </FormItem>
        {/* Attachment */}
        <Attachment
          selectedFile={selectedFile}
          onFileChange={onFileChange}
          onRemoveFile={onRemoveFile}
          loading={loading}
          hideAttachment={hideAttachment}
        />




      </div>

    </div>

  );

}
export default BathRobeForm;
