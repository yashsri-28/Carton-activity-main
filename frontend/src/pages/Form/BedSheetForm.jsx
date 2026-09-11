// import React from "react";
// import Attachment from "./Attachment";

// const InputField = ({
//     label,
//     placeholder,
//     name,
//     value,
//     onChange,
//     type = "text",
//     isTextarea = false,   // 👈 new prop
//     rows = 3              // 👈 default rows
// }) => (
//     <div className="flex flex-col gap-2 w-full">
//         <label className="text-sm font-semibold text-gray-700">
//             {label}
//         </label>

//         {isTextarea ? (
//             <textarea
//                 name={name}
//                 value={value || ""}
//                 onChange={onChange}
//                 placeholder={placeholder}
//                 rows={rows}
//                 className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm resize-none"
//             />
//         ) : (
//             <input
//                 type={type}
//                 name={name}
//                 value={value || ""}
//                 onChange={onChange}
//                 placeholder={placeholder}
//                 className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
//             />
//         )}
//     </div>
// );

// const RadioField = ({ label, name, value, onChange }) => (
//     <div className="flex flex-col gap-2 w-full">
//         <label className="text-sm font-semibold text-gray-700">{label}</label>
//         <div className="flex gap-6">
//             <label className="flex items-center gap-2">
//                 <input
//                     type="radio"
//                     name={name}
//                     value="Yes"
//                     checked={value === "Yes"}
//                     onChange={onChange}
//                     className="accent-[#0f3460]"
//                 />
//                 Yes
//             </label>
//             <label className="flex items-center gap-2">
//                 <input
//                     type="radio"
//                     name={name}
//                     value="No"
//                     checked={value === "No"}
//                     onChange={onChange}
//                     className="accent-[#0f3460]"
//                 />
//                 No
//             </label>
//         </div>
//     </div>
// );

// const FormItem = ({ children }) => (
//     <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-6">{children}</div>
// );

// function BedSheetForm({
//     formData,
//     onInputChange,
//     selectedFile,
//     onFileChange,
//     onRemoveFile,
//     loading,
//     hideAttachment = false,
//     onGussetSubmit,
// }) {
//     return (
//         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
//             <div className="flex flex-wrap -mx-4">
//                 {/* ==================== MODE TOGGLE (Bedsheet vs Gusset) ==================== */}
//                 <div className="w-full px-4 mb-8">
//                     <label className="text-sm font-semibold text-gray-700 block mb-3">
//                         Form Type
//                     </label>
//                     <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">


//                         {/* <button
//                             type="button"
//                             onClick={() => onInputChange({ target: { name: "formMode", value: "gusset" } })}
//                             className={`px-6 py-2 rounded-md font-medium transition-all ${formData.formMode === "gusset"
//                                 ? "bg-[#0f3460] text-white shadow"
//                                 : "text-gray-600 hover:bg-white"
//                                 }`}
//                         >
//                             Gusset Finalization
//                         </button>
//                         <button
//                             type="button"
//                             onClick={() => onInputChange({ target: { name: "formMode", value: "bedsheet" } })}
//                             className={`px-6 py-2 rounded-md font-medium transition-all ${formData.formMode === "bedsheet"
//                                 ? "bg-[#0f3460] text-white shadow"
//                                 : "text-gray-600 hover:bg-white bg-gray-200"
//                                 }`}
//                         >
//                             Standard Bedsheet
//                         </button> */}
//                         <button
//                             type="button"
//                             onClick={() => onInputChange({ target: { name: "formMode", value: "gusset" } })}
//                             className={`px-6 py-2 rounded-md font-medium transition-all ${(formData.formMode ?? "gusset") === "gusset"
//                                 ? "bg-[#0f3460] text-white shadow"
//                                 : "text-gray-600 hover:bg-white bg-gray-200"
//                                 }`}
//                         >
//                             Gusset Finalization
//                         </button>
//                         <button
//                             type="button"
//                             onClick={() => onInputChange({ target: { name: "formMode", value: "bedsheet" } })}
//                             className={`px-6 py-2 rounded-md font-medium transition-all ${(formData.formMode ?? "gusset") === "bedsheet"
//                                 ? "bg-[#0f3460] text-white shadow"
//                                 : "text-gray-600 hover:bg-white"
//                                 }`}
//                         >
//                             Standard Bedsheet
//                         </button>

//                     </div>
//                 </div>

//                 {/* ==================== STANDARD BEDSHEET FIELDS ==================== */}
//                 {/* {(formData.formMode ?? "bedsheet") === "bedsheet" && ( */}
//                 {(formData.formMode ?? "gusset") === "bedsheet" && (
//                     <>
//                         <FormItem>
//                             <InputField
//                                 label="Activity Name"
//                                 name="activityName"
//                                 placeholder="Enter activity name"
//                                 value={formData.activityName}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Customer Name"
//                                 name="customerName"
//                                 placeholder="Enter customer name"
//                                 value={formData.customerName}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Program Name"
//                                 name="programName"
//                                 placeholder="Enter program name"
//                                 value={formData.programName}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Customer Protocol"
//                                 name="customerProtocol"
//                                 placeholder="Enter protocol details"
//                                 value={formData.customerProtocol}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         {/* <FormItem>
//                             <InputField
//                                 label="Confirm New / Shifted From Vapi"
//                                 name="newOrShifted"
//                                 placeholder="New / Shifted from Vapi"
//                                 value={formData.newOrShifted}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem> */}

//                         <FormItem>
//                             <InputField
//                                 label="Fabric TC"
//                                 name="fabric"
//                                 placeholder="Enter fabric TC value"
//                                 value={formData.fabric}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Folding Details"
//                                 name="folding"
//                                 placeholder="Enter folding method"
//                                 value={formData.folding}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Required Pcs / Polybag"
//                                 name="required_pcs_per_polybag"
//                                 placeholder="Enter pieces per polybag"
//                                 value={formData.required_pcs_per_polybag}
//                                 onChange={onInputChange}
//                                 type="number"
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Polybag Manual / Automatic"
//                                 name="polybagManualAuto"
//                                 placeholder="Manual / Automatic"
//                                 value={formData.polybagManualAuto}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Polybag Size (Twin / Full / Queen / King)"
//                                 name="polybagSize"
//                                 placeholder="Enter Size"
//                                 value={formData.polybagSize}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Product Type"
//                                 name="productType"
//                                 placeholder="Sheet Set / Duvet Set / Mattress Pad / Comforter"
//                                 value={formData.productType}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Special Product Requirement"
//                                 name="productRequirements"
//                                 placeholder="Enter product requirements"
//                                 value={formData.productRequirements}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Special Packing Requirement"
//                                 name="packingRequirements"
//                                 placeholder="Inner Carton / Master Carton"
//                                 value={formData.packingRequirements}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Packing Type"
//                                 name="PackingType"
//                                 placeholder="Open Stock Packing / Set Packing"
//                                 value={formData.PackingType}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Product Dimension"
//                                 name="ProductDimension"
//                                 placeholder="Size Wise / Cut Plan"
//                                 value={formData.ProductDimension}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <label className="text-sm font-semibold text-gray-700 mb-2 block">
//                                 Fold Length x Fold Width
//                             </label>
//                             <div className="flex items-center gap-2">
//                                 <input
//                                     type="number"
//                                     name="foldLength"
//                                     value={formData.foldLength || ""}
//                                     onChange={onInputChange}
//                                     placeholder="Fold Length"
//                                     className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
//                                 />
//                                 <span className="text-gray-500 font-semibold">x</span>
//                                 <input
//                                     type="number"
//                                     name="foldWidth"
//                                     value={formData.foldWidth || ""}
//                                     onChange={onInputChange}
//                                     placeholder="Fold Width"
//                                     className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
//                                 />
//                             </div>
//                         </FormItem>

//                         <FormItem>
//                             <RadioField
//                                 label="Pallet Requirement"
//                                 name="palletRequirement"
//                                 value={formData.palletRequirement}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <RadioField
//                                 label="Special PDQ Required"
//                                 name="specialPDQ"
//                                 value={formData.specialPDQ}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <RadioField
//                                 label="Sample PDQ Arranged"
//                                 name="samplePDQ"
//                                 value={formData.samplePDQ}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <RadioField
//                                 label="Special Carton Required"
//                                 name="specialCarton"
//                                 value={formData.specialCarton}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <RadioField
//                                 label="Any Blister Packing Required"
//                                 name="BlisterPacking"
//                                 value={formData.BlisterPacking}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>
//                         <FormItem>
//                             <RadioField
//                                 label="Elastic Required"
//                                 name="elasticRequired"
//                                 value={formData.elasticRequired}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <RadioField
//                                 label="Special CDU Required"
//                                 name="specialCDU"
//                                 value={formData.specialCDU}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         {/* <FormItem>
//                             <RadioField
//                                 label="Sample Carton Arranged"
//                                 name="sampleCarton"
//                                 value={formData.sampleCarton}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem> */}

//                         <FormItem>
//                             <InputField
//                                 label="If Blister Packing Required"
//                                 name="BlisterRequired"
//                                 placeholder="sets / Blister"
//                                 value={formData.BlisterRequired}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Single / Monster PDQ"
//                                 name="singleOrMonsterPDQ"
//                                 placeholder="Single PDQ / Monster PDQ"
//                                 value={formData.singleOrMonsterPDQ}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Special Packing Requirements"
//                                 name="packingRequirements"
//                                 placeholder="(Inner Carton / Master Carton)"
//                                 value={formData.packingRequirements}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="PDQ Layers"
//                                 name="pdqLayers"
//                                 placeholder="Enter number of layers"
//                                 value={formData.pdqLayers}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Bag Type"
//                                 name="Bagtype"
//                                 placeholder="LD Polybag / PP Polybag / PVC Bag / Self Bag / Metal Wire Bag"
//                                 value={formData.Bagtype}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Special Box Required"
//                                 name="BoxRequired"
//                                 placeholder="Inner Box / Capa Box"
//                                 value={formData.BoxRequired}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Common PDQ"
//                                 name="commonPDQ"
//                                 placeholder="Yes / No"
//                                 value={formData.commonPDQ}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Small PDQ Requirement"
//                                 name="smallPDQRequirement"
//                                 placeholder="Enter requirement details"
//                                 value={formData.smallPDQRequirement}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Required Pcs (sets / Carton)"
//                                 name="required_sets_per_carton"
//                                 placeholder="sizewise"
//                                 value={formData.required_sets_per_carton}
//                                 onChange={onInputChange}
//                                 type="number"
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Small PDQ Quantity"
//                                 name="smallPDQQuantity"
//                                 placeholder="Enter quantity per pallet"
//                                 value={formData.smallPDQQuantity}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Warehouse Handling"
//                                 name="warehouse"
//                                 placeholder="Enter handling process"
//                                 value={formData.warehouse}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="PolyFold Condition"
//                                 name="PolyFoldCondition"
//                                 placeholder="Enter folding condition"
//                                 value={formData.PolyFoldCondition}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Separator Required"
//                                 name="separatorRequired"
//                                 placeholder="Yes / No / Details"
//                                 value={formData.separatorRequired}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Ribbon Packing"
//                                 name="ribbonPacking"
//                                 placeholder="Yes / No / Sample"
//                                 value={formData.ribbonPacking}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Belly Band Packing"
//                                 name="bellyBandPacking"
//                                 placeholder="Yes / No / Sample"
//                                 value={formData.bellyBandPacking}
//                                 onChange={onInputChange}
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Filled Product GSM"
//                                 name="filled_product_gsm"
//                                 placeholder="GSM / Required"
//                                 value={formData.filled_product_gsm}
//                                 onChange={onInputChange}
//                                 type="number"
//                             />
//                         </FormItem>

//                         <FormItem>
//                             <InputField
//                                 label="Remark"
//                                 name="remark"
//                                 value={formData.remark}
//                                 onChange={onInputChange}
//                                 placeholder="Enter Remark"
//                                 isTextarea={true}     // 👈 makes it big
//                                 rows={4}              // 👈 control height
//                             />
//                         </FormItem>
//                     </>
//                 )}

//                 {/* ==================== GUSSET FINALIZATION (only when selected) ==================== */}
//                 {/* {formData.formMode === "gusset" && ( */}
//                 {(formData.formMode ?? "gusset") === "gusset" && (
//                     <div className="w-full col-span-full my-4 p-6 border border-gray-200 rounded-xl bg-gray-50">
//                         <h3 className="text-lg font-bold text-[#0f3460] mb-6 flex items-center gap-3">
//                             GUSSET FINALIZATION
//                         </h3>

//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
//                             {/* PRODUCT COLUMN */}
//                             <div className="space-y-6">
//                                 <InputField
//                                     label="Activity Name"
//                                     name="activityName"
//                                     placeholder="Enter activity name"
//                                     value={formData.activityName}
//                                     onChange={onInputChange}
//                                 />
//                                 <InputField
//                                     label="Program Name"
//                                     name="programName"
//                                     placeholder="Enter program name"
//                                     value={formData.programName}
//                                     onChange={onInputChange}
//                                 />
//                                 <InputField
//                                     label="Customer Name"
//                                     name="customerName"
//                                     placeholder="Enter customer name"
//                                     value={formData.customerName}
//                                     onChange={onInputChange}
//                                 />
//                                 <InputField label="Weave" name="gussetWeave" value={formData.gussetWeave} onChange={onInputChange} placeholder="Enter weave" />
//                                 <InputField label="Product Group" name="gussetProductGroup" value={formData.gussetProductGroup} onChange={onInputChange} placeholder="Enter product group" />

//                                 <div>
//                                     <label className="text-sm font-semibold text-gray-700 block mb-1">Size</label>
//                                     <select
//                                         name="gussetSize"
//                                         value={formData.gussetSize || ""}
//                                         onChange={onInputChange}
//                                         className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                                     >
//                                         <option value="">Select Size</option>
//                                         <option value="Twin">Twin</option>
//                                         <option value="Full">Full</option>
//                                         <option value="Queen">Queen</option>
//                                         <option value="King">King</option>
//                                         <option value="Other">Other</option>
//                                     </select>
//                                 </div>

//                                 {formData.gussetSize === "Other" && (
//                                     <InputField label="(Other - not mentioned in drop down)" name="gussetOtherSize" value={formData.gussetOtherSize} onChange={onInputChange} />
//                                 )}

//                                 <InputField label="Value addition Flat sheet" name="gussetValueAdditionFlatSheet" value={formData.gussetValueAdditionFlatSheet} onChange={onInputChange} />
//                                 <InputField label="Value addition duvet cover" name="gussetValueAdditionDuvetCover" value={formData.gussetValueAdditionDuvetCover} onChange={onInputChange} />
//                                 <InputField label="Value addition Fitted sheet" name="gussetValueAdditionFittedSheet" value={formData.gussetValueAdditionFittedSheet} onChange={onInputChange} />
//                                 <InputField label="Value addition Pillowcase" name="gussetValueAdditionPillowcase" value={formData.gussetValueAdditionPillowcase} onChange={onInputChange} />
//                                 {/* <InputField label="Fold Size in Inches" name="gussetFoldSizeInInches" value={formData.gussetFoldSizeInInches} onChange={onInputChange} type="number" /> */}
//                                 <div>
//                                     <label className="text-sm font-semibold text-gray-700 mb-2 block">
//                                         Fold Length x Fold Width (Inches)
//                                     </label>
//                                     <div className="flex items-center gap-2">
//                                         <input
//                                             type="number"
//                                             name="gussetFoldLength"
//                                             value={formData.gussetFoldLength || ""}
//                                             onChange={onInputChange}
//                                             placeholder="Fold Length"
//                                             className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
//                                         />
//                                         <span className="text-gray-500 font-semibold">x</span>
//                                         <input
//                                             type="number"
//                                             name="gussetFoldWidth"
//                                             value={formData.gussetFoldWidth || ""}
//                                             onChange={onInputChange}
//                                             placeholder="Fold Width"
//                                             className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
//                                         />
//                                     </div>
//                                 </div>

//                             </div>

//                             {/* CARDBOARD STIFFENER */}
//                             <div className="space-y-6">
//                                 <RadioField label="Cardboard Stiffener Required" name="cardboardRequired" value={formData.cardboardRequired} onChange={onInputChange} />
//                                 {formData.cardboardRequired === "Yes" && (
//                                     <>
//                                         <InputField label="Stiffener Fold Type" name="cardboardFoldType" value={formData.cardboardFoldType} onChange={onInputChange} />
//                                         <InputField label="Stiffener Ply" name="cardboardPly" value={formData.cardboardPly} onChange={onInputChange} />
//                                         <InputField label="Stiffener Fold on side" name="cardboardFoldOnSide" value={formData.cardboardFoldOnSide} onChange={onInputChange} />
//                                     </>
//                                 )}
//                             </div>

//                             {/* POLYBAG */}
//                             <div className="space-y-6">
//                                 <RadioField label="Polybag Required" name="polybagRequired" value={formData.polybagRequired} onChange={onInputChange} />
//                                 {formData.polybagRequired === "Yes" && (
//                                     <>
//                                         <InputField label="Material Type" name="polybagMaterialType" value={formData.polybagMaterialType} onChange={onInputChange} />
//                                         <InputField label="Opening Type" name="polybagOpeningType" value={formData.polybagOpeningType} onChange={onInputChange} />
//                                         <InputField label="Opening on side" name="polybagOpeningOnSide" value={formData.polybagOpeningOnSide} onChange={onInputChange} />
//                                         <InputField label="Inlay or Belly band" name="polybagInlayOrBellyBand" value={formData.polybagInlayOrBellyBand} onChange={onInputChange} />
//                                         <InputField label="Type" name="polybagType" value={formData.polybagType} onChange={onInputChange} />
//                                     </>
//                                 )}
//                             </div>
//                         </div>

//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
//                             <InputField label="Reference Program :" name="referenceProgram" value={formData.referenceProgram} onChange={onInputChange} />
//                             <InputField label="Comments :" name="comments" value={formData.comments} onChange={onInputChange} />

//                             {/* 👇 NEW: Gusset Bank + Submit */}
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
//                                 <InputField
//                                     label="Gusset Bank"
//                                     name="gussetBank"
//                                     value={formData.gussetBank}
//                                     onChange={onInputChange}
//                                     placeholder="Enter gusset bank details"
//                                 />
//                             </div>

//                             <div className="w-full flex justify-end mt-6">
//                                 <button
//                                     type="button"
//                                     onClick={onGussetSubmit}
//                                     disabled={loading}
//                                     className={`px-10 py-3 rounded-md font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95 text-white ${loading ? 'bg-gray-400 cursor-not-allowed opacity-70' : 'bg-[#0f3460] hover:bg-[#0a2545] cursor-pointer'
//                                         }`}
//                                 >
//                                     {loading ? 'Submitting...' : 'Submit Gusset'}
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Attachment - always visible */}
//                 <Attachment
//                     selectedFile={selectedFile}
//                     onFileChange={onFileChange}
//                     onRemoveFile={onRemoveFile}
//                     loading={loading}
//                     hideAttachment={hideAttachment}
//                 />
//             </div>
//         </div>
//     );
// }

// export default BedSheetForm;



import React, { useState } from "react";
import Attachment from "./Attachment";
import Table from "./Table";
import FreezingNoteTable from "./FreezingNoteTable";

const InputField = ({
    label,
    placeholder,
    name,
    value,
    onChange,
    type = "text",
    isTextarea = false,
    rows = 3
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
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <div className="flex gap-6">
            <label className="flex items-center gap-2">
                <input
                    type="radio"
                    name={name}
                    value="Yes"
                    checked={value === "Yes"}
                    onChange={onChange}
                    className="accent-[#0f3460]"
                />
                Yes
            </label>
            <label className="flex items-center gap-2">
                <input
                    type="radio"
                    name={name}
                    value="No"
                    checked={value === "No"}
                    onChange={onChange}
                    className="accent-[#0f3460]"
                />
                No
            </label>
        </div>
    </div>
);

const FormItem = ({ children }) => (
    <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-6">{children}</div>
);

// Simple accordion toggle header — no submit logic here, just show/hide
const SectionToggle = ({ label, isOpen, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center justify-between px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer ${
            isOpen
                ? "bg-[#0f3460] text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
    >
        <span>{label}</span>
        <span className="text-sm">{isOpen ? "▲ Hide" : "▼ Fill Form"}</span>
    </button>
);

function BedSheetForm({
    formData,
    onInputChange,
    onGussetSizeToggle,
    selectedFile,
    onFileChange,
    onRemoveFile,
    loading,
    hideAttachment = false,
    gussetSpecRows,
    onAddGussetSpecRow,
    onDeleteGussetSpecRow,
    onGussetSpecCellChange,
    freezingNoteRows,
    onAddFreezingNoteRow,
    onDeleteFreezingNoteRow,
    onFreezingNoteCellChange,
}) {
    // Open/close state lives in formData (via onInputChange) so the parent
    // (FormMain) can read which section(s) are open when the single main
    // "Submit" button at the bottom of the page is clicked.
    const isGussetOpen = formData.gussetSectionOpen === true;
    const isBedsheetOpen = formData.bedsheetSectionOpen === true;

    const toggleGusset = () =>
        onInputChange({ target: { name: "gussetSectionOpen", value: !isGussetOpen } });

    const toggleBedsheet = () =>
        onInputChange({ target: { name: "bedsheetSectionOpen", value: !isBedsheetOpen } });

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-wrap -mx-4">

                {/* ==================== GUSSET FINALIZATION TOGGLE + FORM ==================== */}
                <div className="w-full px-4 mb-6">
                    <SectionToggle
                        label="Gusset Finalization"
                        isOpen={isGussetOpen}
                        onClick={toggleGusset}
                    />

                    {isGussetOpen && (
                        <div className="w-full mt-4 p-6 border border-gray-200 rounded-xl bg-gray-50">
                            <h3 className="text-lg font-bold text-[#0f3460] mb-6">
                                GUSSET FINALIZATION
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
                                {/* PRODUCT COLUMN */}
                                <div className="space-y-6">
                                    <InputField
                                        label="Program Name"
                                        name="gussetProgramName"
                                        placeholder="Enter program name"
                                        value={formData.gussetProgramName}
                                        onChange={onInputChange}
                                    />
                                    <InputField
                                        label="Customer Name"
                                        name="gussetCustomerName"
                                        placeholder="Enter customer name"
                                        value={formData.gussetCustomerName}
                                        onChange={onInputChange}
                                    />
                                    <InputField label="Weave" name="gussetWeave" value={formData.gussetWeave} onChange={onInputChange} placeholder="Enter weave" />
                                    <InputField label="Product Group" name="gussetProductGroup" value={formData.gussetProductGroup} onChange={onInputChange} placeholder="Enter product group" />

                                                                   <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-2">Size (select one or more)</label>
                                    <div className="flex flex-wrap gap-4">
                                        {["Twin", "Full", "Queen", "King", "Other"].map((sizeOption) => (
                                            <label key={sizeOption} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.gussetSizes || []).includes(sizeOption)}
                                                    onChange={() => onGussetSizeToggle(sizeOption)}
                                                    className="accent-[#0f3460] w-4 h-4"
                                                />
                                                <span className="text-sm text-gray-700">{sizeOption}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {(formData.gussetSizes || []).includes("Other") && (
                                    <InputField
                                        label="(Other - not mentioned above)"
                                        name="gussetOtherSizeText"
                                        value={formData.gussetOtherSizeText}
                                        onChange={onInputChange}
                                    />
                                )}

                                    <InputField label="Value addition Flat sheet" name="gussetValueAdditionFlatSheet" value={formData.gussetValueAdditionFlatSheet} onChange={onInputChange} />
                                    <InputField label="Value addition duvet cover" name="gussetValueAdditionDuvetCover" value={formData.gussetValueAdditionDuvetCover} onChange={onInputChange} />
                                    <InputField label="Value addition Fitted sheet" name="gussetValueAdditionFittedSheet" value={formData.gussetValueAdditionFittedSheet} onChange={onInputChange} />
                                    <InputField label="Value addition Pillowcase" name="gussetValueAdditionPillowcase" value={formData.gussetValueAdditionPillowcase} onChange={onInputChange} />

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                            Fold Length x Fold Width (Inches)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                name="gussetFoldLength"
                                                value={formData.gussetFoldLength || ""}
                                                onChange={onInputChange}
                                                placeholder="Fold Length"
                                                className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                            />
                                            <span className="text-gray-500 font-semibold">x</span>
                                            <input
                                                type="number"
                                                name="gussetFoldWidth"
                                                value={formData.gussetFoldWidth || ""}
                                                onChange={onInputChange}
                                                placeholder="Fold Width"
                                                className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* CARDBOARD STIFFENER */}
                                <div className="space-y-6">
                                    <RadioField label="Cardboard Stiffener Required" name="cardboardRequired" value={formData.cardboardRequired} onChange={onInputChange} />
                                    {formData.cardboardRequired === "Yes" && (
                                        <>
                                            <InputField label="Stiffener Fold Type" name="cardboardFoldType" value={formData.cardboardFoldType} onChange={onInputChange} />
                                            <InputField label="Stiffener Ply" name="cardboardPly" value={formData.cardboardPly} onChange={onInputChange} />
                                            <InputField label="Stiffener Fold on side" name="cardboardFoldOnSide" value={formData.cardboardFoldOnSide} onChange={onInputChange} />
                                        </>
                                    )}
                                </div>

                                {/* POLYBAG */}
                                <div className="space-y-6">
                                    <RadioField label="Polybag Required" name="polybagRequired" value={formData.polybagRequired} onChange={onInputChange} />
                                    {formData.polybagRequired === "Yes" && (
                                        <>
                                            <InputField label="Material Type" name="polybagMaterialType" value={formData.polybagMaterialType} onChange={onInputChange} />
                                            <InputField label="Opening Type" name="polybagOpeningType" value={formData.polybagOpeningType} onChange={onInputChange} />
                                            <InputField label="Opening on side" name="polybagOpeningOnSide" value={formData.polybagOpeningOnSide} onChange={onInputChange} />
                                            <InputField label="Inlay or Belly band" name="polybagInlayOrBellyBand" value={formData.polybagInlayOrBellyBand} onChange={onInputChange} />
                                            <InputField label="Type" name="polybagType" value={formData.polybagType} onChange={onInputChange} />
                                        </>
                                    )}
                                </div>
                            </div>

                                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                <InputField label="Reference Program :" name="referenceProgram" value={formData.referenceProgram} onChange={onInputChange} />
                                <InputField label="Comments :" name="comments" value={formData.comments} onChange={onInputChange} />

                                {/* <InputField
                                    label="Gusset Bank"
                                    name="gussetBank"
                                    value={formData.gussetBank}
                                    onChange={onInputChange}
                                    placeholder="Enter gusset bank details"
                                /> */}
                            </div>

                            {/* Gusset Specifications table — lives inside the Gusset
                                Finalization section, right below its own fields. */}
                            <div className="mt-8">
                                <Table
                                    title="Gusset Specifications"
                                    headers={[
                                        { label: "Size", key: "size" },
                                        { label: "Fold Length", key: "foldLength" },
                                        { label: "Fold Width", key: "foldWidth" },
                                        { label: "Gusset Name (TQM fills later)", key: "gussetName" },
                                        { label: "WT", key: "wt" },
                                        { label: "GSM", key: "gsm" },
                                        { label: "", key: "actions", hasAddBtn: true },
                                    ]}
                                    data={gussetSpecRows}
                                    type="flat"
                                    onAddRow={onAddGussetSpecRow}
                                    onDeleteRow={onDeleteGussetSpecRow}
                                    onUpdateCell={(idx, _, key, value) => {
                                        if (key === 'gussetName') return;
                                        onGussetSpecCellChange(idx, key, value);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ==================== STANDARD BEDSHEET TOGGLE + FORM ==================== */}
                <div className="w-full px-4 mb-6">
                    <SectionToggle
                        label="Carton Working"
                        isOpen={isBedsheetOpen}
                        onClick={toggleBedsheet}
                    />
                </div>

                {isBedsheetOpen && (
                    <div className="w-full px-4 mt-2">
                        <div className="flex flex-wrap -mx-4 p-6 border border-gray-200 rounded-xl bg-gray-50">
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
                                    label="Fabric TC"
                                    name="fabric"
                                    placeholder="Enter fabric TC value"
                                    value={formData.fabric}
                                    onChange={onInputChange}
                                />
                            </FormItem>

                            <FormItem>
                                <InputField
                                    label="Folding Details"
                                    name="folding"
                                    placeholder="Enter folding method"
                                    value={formData.folding}
                                    onChange={onInputChange}
                                />
                            </FormItem>

                            {/* <FormItem>
                                <InputField
                                    label="Required Pcs / Polybag"
                                    name="required_pcs_per_polybag"
                                    placeholder="Enter pieces per polybag"
                                    value={formData.required_pcs_per_polybag}
                                    onChange={onInputChange}
                                    type="number"
                                />
                            </FormItem> */}

                            <FormItem>
                                <InputField
                                    label="Polybag Manual / Automatic"
                                    name="polybagManualAuto"
                                    placeholder="Manual / Automatic"
                                    value={formData.polybagManualAuto}
                                    onChange={onInputChange}
                                />
                            </FormItem>

                            {/* <FormItem>
                                <InputField
                                    label="Polybag Size (Twin / Full / Queen / King)"
                                    name="polybagSize"
                                    placeholder="Enter Size"
                                    value={formData.polybagSize}
                                    onChange={onInputChange}
                                />
                            </FormItem> */}

                            <FormItem>
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Product Type</label>
                                <select
                                    name="productType"
                                    value={formData.productType || ""}
                                    onChange={onInputChange}
                                    className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Select Product Type</option>
                                    <option value="Sheet Set">Sheet Set</option>
                                    <option value="Duvet Set">Duvet Set</option>
                                    <option value="Mattress Pad">Mattress Pad</option>
                                    <option value="Comforter">Comforter</option>
                                </select>
                            </FormItem>

                            <FormItem>
                                <InputField
                                    label="Special Product Requirement"
                                    name="productRequirements"
                                    placeholder="Enter product requirements"
                                    value={formData.productRequirements}
                                    onChange={onInputChange}
                                />
                            </FormItem>

                            <FormItem>
                                <InputField
                                    label="Special Packing Requirement"
                                    name="packingRequirements"
                                    placeholder="Inner Carton / Master Carton"
                                    value={formData.packingRequirements}
                                    onChange={onInputChange}
                                />
                            </FormItem>

                            <FormItem>
                                <InputField
                                    label="Packing Type"
                                    name="PackingType"
                                    placeholder="Open Stock Packing / Set Packing"
                                    value={formData.PackingType}
                                    onChange={onInputChange}
                                />
                            </FormItem>
{/* 
                            <FormItem>
                                <InputField
                                    label="Product Dimension"
                                    name="ProductDimension"
                                    placeholder="Size Wise / Cut Plan"
                                    value={formData.ProductDimension}
                                    onChange={onInputChange}
                                />
                            </FormItem> */}

                            <FormItem>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Fold Length x Fold Width <span className="text-xs font-normal text-gray-400">(from Gusset Finalization)</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={formData.gussetFoldLength || ""}
                                        readOnly
                                        placeholder="Fold Length"
                                        className="w-full border border-gray-200 rounded-md p-3 text-gray-500 bg-gray-50 cursor-not-allowed"
                                    />
                                    <span className="text-gray-500 font-semibold">x</span>
                                    <input
                                        type="text"
                                        value={formData.gussetFoldWidth || ""}
                                        readOnly
                                        placeholder="Fold Width"
                                        className="w-full border border-gray-200 rounded-md p-3 text-gray-500 bg-gray-50 cursor-not-allowed"
                                    />
                                </div>
                            </FormItem>

                            <FormItem>
                                <RadioField
                                    label="Pallet Requirement"
                                    name="palletRequirement"
                                    value={formData.palletRequirement}
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
                                    label="Sample PDQ Arranged"
                                    name="samplePDQ"
                                    value={formData.samplePDQ}
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
                                    label="Elastic Required"
                                    name="elasticRequired"
                                    value={formData.elasticRequired}
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
                                <InputField
                                    label="If Blister Packing Required"
                                    name="BlisterRequired"
                                    placeholder="sets / Blister"
                                    value={formData.BlisterRequired}
                                    onChange={onInputChange}
                                />
                            </FormItem>

                            <FormItem>
                                <InputField
                                    label="Single / Monster PDQ"
                                    name="singleOrMonsterPDQ"
                                    placeholder="Single PDQ / Monster PDQ"
                                    value={formData.singleOrMonsterPDQ}
                                    onChange={onInputChange}
                                />
                            </FormItem>

                            <FormItem>
                                <InputField
                                    label="Special Packing Requirements"
                                    name="packingRequirements"
                                    placeholder="(Inner Carton / Master Carton)"
                                    value={formData.packingRequirements}
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
                                <label className="text-sm font-semibold text-gray-700 block mb-1">Bag Type</label>
                                <select
                                    name="Bagtype"
                                    value={formData.Bagtype || ""}
                                    onChange={onInputChange}
                                    className="w-full border border-gray-200 rounded-md p-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Select Bag Type</option>
                                    <option value="LD Polybag">LD Polybag</option>
                                    <option value="PP Polybag">PP Polybag</option>
                                    <option value="PVC Bag">PVC Bag</option>
                                    <option value="Self Bag">Self Bag</option>
                                    <option value="Metal Wire Bag">Metal Wire Bag</option>
                                </select>
                            </FormItem>

                            <FormItem>
                                <InputField
                                    label="Special Box Required"
                                    name="BoxRequired"
                                    placeholder="Inner Box / Capa Box"
                                    value={formData.BoxRequired}
                                    onChange={onInputChange}
                                />
                            </FormItem>

                            <FormItem>
                                <RadioField
                                    label="Common PDQ"
                                    name="commonPDQ"
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

                            {/* <FormItem>
                                <InputField
                                    label="Required Pcs (sets / Carton)"
                                    name="required_sets_per_carton"
                                    placeholder="sizewise"
                                    value={formData.required_sets_per_carton}
                                    onChange={onInputChange}
                                    type="number"
                                />
                            </FormItem> */}

                            <FormItem>
                                <InputField
                                    label="Small PDQ Quantity"
                                    name="smallPDQQuantity"
                                    placeholder="Enter quantity per pallet"
                                    value={formData.smallPDQQuantity}
                                    onChange={onInputChange}
                                />
                            </FormItem>

                            {/* <FormItem>
                                <InputField
                                    label="Warehouse Handling"
                                    name="warehouse"
                                    placeholder="Enter handling process"
                                    value={formData.warehouse}
                                    onChange={onInputChange}
                                />
                            </FormItem> */}

                            <FormItem>
                                <InputField
                                    label="PolyFold Condition"
                                    name="PolyFoldCondition"
                                    placeholder="Enter folding condition"
                                    value={formData.PolyFoldCondition}
                                    onChange={onInputChange}
                                />
                            </FormItem>

                            <FormItem>
                                <RadioField
                                    label="Separator Required"
                                    name="separatorRequired"
                                    value={formData.separatorRequired}
                                    onChange={onInputChange}
                                />
                                {formData.separatorRequired === "Yes" && (
                                    <div className="mt-3">
                                        <InputField
                                            label="Separator Details"
                                            name="separatorRequiredDetails"
                                            value={formData.separatorRequiredDetails}
                                            onChange={onInputChange}
                                            placeholder="Enter details"
                                        />
                                    </div>
                                )}
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

                            <FormItem>
                                <InputField
                                    label="Filled Product GSM"
                                    name="filled_product_gsm"
                                    placeholder="GSM / Required"
                                    value={formData.filled_product_gsm}
                                    onChange={onInputChange}
                                    type="number"
                                />
                            </FormItem>

                            <FormItem>
                                <InputField
                                    label="Remark"
                                    name="remark"
                                    value={formData.remark}
                                    onChange={onInputChange}
                                    placeholder="Enter Remark"
                                    isTextarea={true}
                                    rows={4}
                                />
                            </FormItem>

                            {/* Freezing Note table — lives inside the Carton Working
                                (Standard Bedsheet) section, right after its own fields. */}
                            <div className="w-full mt-8">
                                <FreezingNoteTable
                                    rows={freezingNoteRows}
                                    onAddRow={onAddFreezingNoteRow}
                                    onCellChange={onFreezingNoteCellChange}
                                    onDeleteRow={onDeleteFreezingNoteRow}
                                    hideTqmOnlyFields={true}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Attachment - always visible */}
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

export default BedSheetForm;