import React from "react";
import Attachment from "./Attachment";

// Reusable Components
const InputField = ({
  label,
  placeholder,
  name,
  value,
  onChange,
  type = "text",
}) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
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
  <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-6">{children}</div>
);

// ────────────────────────────────────────────────
// MAIN COMPONENT - BathTerryForm (Terry Towel)
// ────────────────────────────────────────────────
function BathTerryForm({
  formData,
  onInputChange,
  selectedFile,
  onFileChange,
  onRemoveFile,
  loading,
  hideAttachment = false,
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-wrap -mx-4">
        {/* Common Fields (shared with other categories) */}
        <FormItem>
          <InputField
            label="Activity Name"
            name="activityName"
            placeholder="Enter activity name"
            value={formData.activityName || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Customer Name"
            name="customerName"
            placeholder="Enter customer name"
            value={formData.customerName || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Program Name"
            name="programName"
            placeholder="Enter program name"
            value={formData.programName || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Customer Protocol"
            name="customerProtocol"
            placeholder="Enter customer protocol"
            value={formData.customerProtocol || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Confirm New or Shifted From Vapi"
            name="newOrShifted"
            placeholder="New / Shifted from Vapi"
            value={formData.newOrShifted || ""}
            onChange={onInputChange}
          />
        </FormItem>

        {/* Terry Towel Specific Fields */}
        <FormItem>
          <InputField
            label="Original Towel"
            name="original_towel"
            placeholder="Enter original towel reference"
            value={formData.original_towel || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Towel Sizes"
            name="towelSizes"
            placeholder="e.g. Bath, Hand, Washcloth, Bath Sheet, Mat"
            value={formData.towelSizes || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Towel Dimensions"
            name="towelDimensions"
            placeholder="e.g. 70x140 cm, size-wise"
            value={formData.towelDimensions || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Towel Weight per Piece (g)"
            name="towelWeightPerPiece"
            placeholder="Enter weight in grams"
            type="number"
            value={formData.towelWeightPerPiece || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Folding Details"
            name="terryFoldingDetails"
            placeholder="Describe folding method (size-wise)"
            value={formData.terryFoldingDetails || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Required Pieces per Polybag"
            name="terryPcsPerPolybag"
            placeholder="Number of pieces per polybag"
            type="number"
            value={formData.terryPcsPerPolybag || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Required Pieces per Carton (size-wise)"
            name="requiredPcsCartonSize"
            placeholder="Pieces per carton - size wise"
            value={formData.requiredPcsCartonSize || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Required Polybags per Carton (size-wise)"
            name="requiredPolybagsCartonSize"
            placeholder="Polybags per carton - size wise"
            value={formData.requiredPolybagsCartonSize || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Special Carton / PDQ / CDU Details"
            name="terrySpecialCartonDetails"
            placeholder="Details if special packaging required"
            value={formData.terrySpecialCartonDetails || ""}
            onChange={onInputChange}
          />
        </FormItem>

        {/* Common Packaging & Logistics Fields */}
        <FormItem>
          <InputField
            label="Polybag Manual / Automatic"
            name="polybagManualAuto"
            placeholder="Manual or Automatic"
            value={formData.polybagManualAuto || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Polybag Type"
            name="polybag_type"
            placeholder="LDPE, PP, PVC, etc."
            value={formData.polybag_type || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <RadioField
            label="Pallet / Slip Sheet Requirement"
            name="palletRequirement"
            value={formData.palletRequirement}
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

        <FormItem>
          <RadioField
            label="Sample Carton Arranged"
            name="sampleCarton"
            value={formData.sampleCarton}
            onChange={onInputChange}
          />
        </FormItem>

        {/* PDQ & Warehouse Fields */}
        <FormItem>
          <InputField
            label="Single PDQ or Monster PDQ"
            name="singleOrMonsterPDQ"
            placeholder="Single / Monster"
            value={formData.singleOrMonsterPDQ || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="PDQ Layers / Stacking Details"
            name="pdqLayers"
            placeholder="Number of layers or stacking info"
            value={formData.pdqLayers || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Common PDQ for All Sizes"
            name="commonPDQ"
            placeholder="Yes / No"
            value={formData.commonPDQ || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Small PDQ Requirement"
            name="smallPDQRequirement"
            placeholder="Details of small PDQ requirement"
            value={formData.smallPDQRequirement || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Small PDQ Quantity per Pallet"
            name="smallPDQQuantity"
            placeholder="Quantity"
            value={formData.smallPDQQuantity || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Warehouse / Store Handling Method"
            name="warehouse_store_handling_method"
            placeholder="Describe handling process"
            value={formData.warehouse_store_handling_method || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Towel Folded & Poly Packed Before Carton"
            name="towel_folded_and_poly_packed_before_carton"
            placeholder="Condition before carton packing"
            value={formData.towel_folded_and_poly_packed_before_carton || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Separator / Protector Required"
            name="separatorRequired"
            placeholder="Yes/No + details"
            value={formData.separatorRequired || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Ribbon Packing Required"
            name="ribbonPacking"
            placeholder="Yes/No + sample arrangement"
            value={formData.ribbonPacking || ""}
            onChange={onInputChange}
          />
        </FormItem>

        <FormItem>
          <InputField
            label="Belly Band Packing Required"
            name="bellyBandPacking"
            placeholder="Yes/No + sample arrangement"
            value={formData.bellyBandPacking || ""}
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

export default BathTerryForm;