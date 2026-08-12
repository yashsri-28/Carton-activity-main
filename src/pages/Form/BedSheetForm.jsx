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
        <label className="text-sm font-semibold text-gray-700">
            {label}
        </label>

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
    <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-6">
        {children}
    </div>
);

// MAIN COMPONENT

function BedSheetForm({
    formData,
    onInputChange,
    selectedFile,
    onFileChange,
    onRemoveFile,
    loading,
    hideAttachment = false
}) {

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-wrap -mx-4">

                <FormItem>
                    <InputField
                        label="Activity Name"
                        name="activityName"
                        placeholder="Enter activity name"
                        value={formData.activityName}
                        onChange={onInputChange}
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
                        label="Confirm New / Shifted From Vapi"
                        name="newOrShifted"
                        placeholder="New / Shifted from Vapi"
                        value={formData.newOrShifted}
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

                <FormItem>
                    <InputField
                        label="Required Pcs / Polybag"
                        name="required_pcs_per_polybag"
                        placeholder="Enter pieces per polybag"
                        value={formData.required_pcs_per_polybag}
                        onChange={onInputChange}
                        type="number"
                    />
                </FormItem>

                <FormItem>
                    <InputField
                        label="Polybag Manual / Automatic"
                        name="polybagManualAuto"
                        placeholder="Manual / Automatic"
                        value={formData.polybagManualAuto}
                        onChange={onInputChange}
                    />
                </FormItem>

                <FormItem>
                    <InputField
                        label="Polybag Size (Twin / Full / Queen / King)"
                        name="polybagSize"
                        placeholder="Enter Size"
                        value={formData.polybagSize}
                        onChange={onInputChange}
                    />
                </FormItem>

                <FormItem>
                    <InputField
                        label="Product Type"
                        name="productType"
                        placeholder="Sheet Set / Duvet Set / Mattress Pad / Comforter"
                        value={formData.productType}
                        onChange={onInputChange}
                    />
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

                <FormItem>
                    <InputField
                        label="Product Dimension"
                        name="ProductDimension"
                        placeholder="Size Wise / Cut Plan"
                        value={formData.ProductDimension}
                        onChange={onInputChange}
                    />
                </FormItem>

                <FormItem>
                    <InputField
                        label="Fold Size"
                        name="FoldSize"
                        placeholder="Size Wise / Cut Plan"
                        value={formData.FoldSize}
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
                    <InputField
                        label="If Blister Packing Required"
                        name="BlisterRequired"
                        placeholder="sets / Blister"
                        value={formData.BlisterRequired}
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
                    <InputField
                        label="Bag Type"
                        name="Bagtype"
                        placeholder="LD Polybag / PP Polybag / PVC Bag / Self Bag / Metal Wire Bag"
                        value={formData.Bagtype}
                        onChange={onInputChange}
                    />
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
                        label="Required Pcs (sets / Carton)"
                        name="required_sets_per_carton"
                        placeholder="sizewise"
                        value={formData.required_sets_per_carton}
                        onChange={onInputChange}
                        type="number"
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
                        label="PolyFold Condition"
                        name="PolyFoldCondition"
                        placeholder="Enter folding condition"
                        value={formData.PolyFoldCondition}
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

export default BedSheetForm;
