import React from "react";

const InputField = ({ label, placeholder, name, value, onChange, type = "text" }) => (
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

const FormItem = ({ children }) => (
  <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-6">{children}</div>
);

// Fields that exist ONLY in the Terry Towel workflow — merged into the
// default Towel form so a separate "Terry Towel" category is not needed.
function TerrySpecificFields({ formData, onInputChange }) {
  return (
    <>
      <FormItem>
        <InputField
          label="Towel Sizes"
          name="towelSizes"
          value={formData.towelSizes}
          onChange={onInputChange}
          placeholder="e.g. Bath, Hand, Washcloth, Bath Sheet, Mat"
        />
      </FormItem>
      <FormItem>
        <InputField
          label="Towel Dimensions"
          name="towelDimensions"
          value={formData.towelDimensions}
          onChange={onInputChange}
          placeholder="e.g. 70x140 cm, size-wise"
        />
      </FormItem>
      <FormItem>
        <InputField
          label="Towel Weight per Piece (g)"
          name="towelWeightPerPiece"
          value={formData.towelWeightPerPiece}
          onChange={onInputChange}
          placeholder="Enter weight in grams"
          type="number"
        />
      </FormItem>
      <FormItem>
        <InputField
          label="Folding Details"
          name="terryFoldingDetails"
          value={formData.terryFoldingDetails}
          onChange={onInputChange}
          placeholder="Describe folding method (size-wise)"
        />
      </FormItem>
      <FormItem>
        <InputField
          label="Required Pieces per Polybag"
          name="terryPcsPerPolybag"
          value={formData.terryPcsPerPolybag}
          onChange={onInputChange}
          placeholder="Number of pieces per polybag"
          type="number"
        />
      </FormItem>
      <FormItem>
        <InputField
          label="Required Pieces per Carton (size-wise)"
          name="requiredPcsCartonSize"
          value={formData.requiredPcsCartonSize}
          onChange={onInputChange}
          placeholder="Pieces per carton - size wise"
        />
      </FormItem>
      <FormItem>
        <InputField
          label="Required Polybags per Carton (size-wise)"
          name="requiredPolybagsCartonSize"
          value={formData.requiredPolybagsCartonSize}
          onChange={onInputChange}
          placeholder="Polybags per carton - size wise"
        />
      </FormItem>
      <FormItem>
        <InputField
          label="Special Carton/PDQ/CDU Details"
          name="terrySpecialCartonDetails"
          value={formData.terrySpecialCartonDetails}
          onChange={onInputChange}
          placeholder="Details if special packaging required"
        />
      </FormItem>
    </>
  );
}

export default TerrySpecificFields;