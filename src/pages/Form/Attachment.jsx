import React, { useRef } from "react";

function Attachment({
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

    if (hideAttachment) return null;


    return (

        <div className="w-full md:w-2/3 lg:w-1/3 px-4 mb-6">

            <div className="flex flex-col gap-2 w-full h-full justify-end formAtachmnt">

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.png,.doc,.docx"
                    disabled={loading}
                />


                {/* Upload Box */}
                <div
                    onClick={triggerFileUpload}
                    className={`
            flex items-center cursor-pointer 
            border-2 border-dashed border-[#0f3460]/30 rounded-xl p-4 h-[76px] mt-auto
            transition-all duration-200 group relative bg-[#f8f9fc] hover:bg-[#f0f4ff]
            ${selectedFile ? "border-green-500 bg-green-50" : ""}
            ${loading ? "opacity-50 cursor-not-allowed" : ""}
          `}
                >


                    {/* When File Selected */}
                    {selectedFile ? (

                        <div className="flex items-center gap-3 w-full">

                            {/* Success Icon */}
                            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                <svg
                                    className="w-5 h-5 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>


                            {/* File Name */}
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-gray-800 truncate">
                                    {selectedFile.name}
                                </span>
                                <span className="text-[10px] text-green-600">
                                    Attached Successfully
                                </span>
                            </div>


                            {/* Remove Button */}
                            <button
                                onClick={onRemoveFile}
                                disabled={loading}
                                className="ml-auto p-1 bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm border border-gray-100 flex-shrink-0 disabled:opacity-50"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>

                        </div>

                    ) : (

                        /* When No File Selected */
                        <div className="flex items-center gap-3 px-1 w-full">

                            {/* Attach Icon */}
                            <div className="p-2 bg-[#eef2f7] rounded-lg group-hover:bg-[#dce7f5] transition-colors flex-shrink-0">
                                <svg
                                    className="w-5 h-5 text-[#0f3460]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                    />
                                </svg>
                            </div>


                            {/* Text */}
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-800">
                                    Attachments
                                </span>
                                <span className="text-[10px] text-gray-500 leading-tight">
                                    Please Attach File (PDF)...
                                </span>
                            </div>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

}

export default Attachment;
