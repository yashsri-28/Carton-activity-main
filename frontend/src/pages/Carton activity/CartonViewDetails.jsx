import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Calculator, Save, Send } from 'lucide-react';
import api from '../../api/axiosInstance';
import Form from './Form'; 
import Table from './Table'; 

const CartonViewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole'); // 'marketing' or 'tqm'

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [setsTables, setSetsTables] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);
  
  // viewState: 'initial' | 'accepted' | 'calculating'
  const [viewState, setViewState] = useState('initial');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Using the activity ID from the URL params
        const response = await api.get(`/api/carton-program/details/${id}/`);
        setFormData(response.data.carton_program || {});
        setSetsTables(response.data.subprograms || []);
        setSampleRows(response.data.samples || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleAccept = () => setViewState('accepted');
  const handleReject = () => navigate(-1);
  const handleStartCalc = () => setViewState('calculating');

  const handleUpdateCell = (groupIdx, variantIdx, field, value) => {
    if (viewState !== 'calculating') return;
    setSetsTables(prev => prev.map((group, gIdx) => 
      gIdx === groupIdx ? { ...group, [field]: value } : group
    ));
  };

  const onFinalSubmit = async (type) => {
    try {
      await api.post('/api/carton-program/tqm-submit/', {
        id,
        submission_type: type, // 'Tentative' or 'Final'
        data: setsTables
      });
      navigate(-1);
    } catch (err) {
      alert("Submission failed");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={22} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-[#0f3460]">Carton Program - tqm   : {formData.program_name || id}</h1>
          </div>

          {userRole === 'tqm' && (
            <div className="flex gap-3">
              {viewState === 'initial' && (
                <>
                  <button onClick={handleAccept} className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg font-semibold shadow-md">
                    <Check size={18} /> Accept
                  </button>
                  <button onClick={handleReject} className="flex items-center gap-2 px-5 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold">
                    <X size={18} /> Reject
                  </button>
                </>
              )}
              {viewState === 'accepted' && (
                <button onClick={handleStartCalc} className="flex items-center gap-2 px-6 py-2 bg-[#0f3460] text-white rounded-lg font-semibold shadow-lg transition-transform active:scale-95">
                  <Calculator size={18} /> Submit Calculation
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* NON-EDITABLE INFO */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
          <Form formData={formData} readOnly={true} />
        </div>

        {/* Specifications TABLE */}
        <Table
          title="Program Specifications"
          headers={[
            { label: "Program", key: "program_name" },
            { label: "Style", key: "style" },
            { label: "W-In", key: "width_in" },
            { label: "L-In", key: "length_in" },
            // These columns become editable ONLY in calculation mode
            { label: "TQM GSM", key: "tqm_gsm" },
            { label: "TQM Weight", key: "tqm_weight" },
            { label: "Remarks", key: "remarks" }
          ]}
          data={setsTables}
          onUpdateCell={handleUpdateCell}
          readOnly={viewState !== 'calculating'} 
        />

        {/* FINAL BUTTONS */}
        {viewState === 'calculating' && (
          <div className="flex justify-end gap-4 p-6 bg-white rounded-xl border-t-4 border-[#0f3460] shadow-xl">
            <button onClick={() => onFinalSubmit('Tentative')} className="px-8 py-3 border-2 border-[#0f3460] text-[#0f3460] rounded-lg font-bold hover:bg-gray-50">
              Submit Tentative
            </button>
            <button onClick={() => onFinalSubmit('Final')} className="px-10 py-3 bg-[#0f3460] text-white rounded-lg font-bold shadow-lg hover:bg-[#0a2545]">
              Submit Final
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartonViewDetails;