import React, { useState, useEffect } from 'react';
import { Package, Box, Container, Ruler, Maximize2 } from 'lucide-react';
import api from '../../api/axiosInstance';

const AICalculationsDisplay = ({ programId, apiInstance }) => {
  const [calculations, setCalculations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (programId) {
      fetchCalculations();
    }
  }, [programId]);

  const fetchCalculations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/api/carton-program/calculations-ai/', {
        program_id: programId
      });
      setCalculations(response.data);
    } catch (err) {
      console.error('Error fetching AI calculations:', err);
      setError('Failed to load AI calculations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border mb-8 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366]"></div>
          <span className="ml-3 text-gray-600">Loading AI calculations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-lg border mb-8 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!calculations || !calculations.results || calculations.results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border mb-8">
      {/* Header */}
      <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center">
              <Box size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Carton & Container Calculations</h2>
              <p className="text-sm text-gray-600">Program: {calculations.program_name}</p>
            </div>
          </div>
          <button 
            onClick={fetchCalculations}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="p-6">
        <div className="space-y-6">
          {calculations.results.map((result, index) => (
            <SubprogramCalculation key={result.subprogram_id} result={result} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

const SubprogramCalculation = ({ result, index }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Subprogram Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 bg-[#003366] text-white text-sm font-bold rounded-full">
              {index + 1}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900">{result.program_name}</h3>
              <p className="text-xs text-gray-500">Subprogram ID: {result.subprogram_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
            <span>Fold: {result.fold}</span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Dimensions */}
          <div className="space-y-4">
            {/* Folded Dimensions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Maximize2 size={18} className="text-amber-600" />
                <h4 className="font-semibold text-amber-900">Folded Dimensions</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DimensionCard 
                  label="Length" 
                  value={result.folded_length} 
                  unit="cm"
                  bgColor="bg-amber-100"
                  textColor="text-amber-900"
                />
                <DimensionCard 
                  label="Width" 
                  value={result.folded_width} 
                  unit="cm"
                  bgColor="bg-amber-100"
                  textColor="text-amber-900"
                />
              </div>
            </div>

            {/* Carton Dimensions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package size={18} className="text-blue-600" />
                <h4 className="font-semibold text-blue-900">Carton Specifications</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DimensionCard 
                  label="Length" 
                  value={result.carton.length} 
                  unit="cm"
                  bgColor="bg-blue-100"
                  textColor="text-blue-900"
                />
                <DimensionCard 
                  label="Width" 
                  value={result.carton.width} 
                  unit="cm"
                  bgColor="bg-blue-100"
                  textColor="text-blue-900"
                />
                <DimensionCard 
                  label="Height" 
                  value={result.carton.height} 
                  unit="cm"
                  bgColor="bg-blue-100"
                  textColor="text-blue-900"
                />
                <DimensionCard 
                  label="CBM" 
                  value={result.carton.cbm} 
                  unit="m³"
                  bgColor="bg-blue-100"
                  textColor="text-blue-900"
                  precision={6}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Container Loading */}
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Container size={18} className="text-green-600" />
                <h4 className="font-semibold text-green-900">Container Loading Capacity</h4>
              </div>
              <div className="space-y-3">
                {result.container['20FT'] && (
                  <ContainerCard 
                    type="20FT Container" 
                    quantity={result.container['20FT']}
                    icon="🚛"
                    color="green"
                  />
                )}
                {result.container['40FT'] && (
                  <ContainerCard 
                    type="40FT Container" 
                    quantity={result.container['40FT']}
                    icon="🚚"
                    color="blue"
                  />
                )}
                {result.container['40HC'] && (
                  <ContainerCard 
                    type="40HC Container" 
                    quantity={result.container['40HC']}
                    icon="🚛"
                    color="purple"
                  />
                )}
              </div>
            </div>

            {/* Visual Representation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3 text-sm">Carton Visualization</h4>
              <CartonVisual dimensions={result.carton} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DimensionCard = ({ label, value, unit, bgColor, textColor, precision = 2 }) => {
  const displayValue = typeof value === 'number' 
    ? value.toFixed(precision) 
    : value || '-';
    
  return (
    <div className={`${bgColor} rounded-lg p-3`}>
      <p className={`text-xs ${textColor} opacity-70 font-semibold uppercase tracking-wide mb-1`}>
        {label}
      </p>
      <p className={`text-lg font-bold ${textColor} font-mono`}>
        {displayValue} <span className="text-sm font-normal">{unit}</span>
      </p>
    </div>
  );
};

const ContainerCard = ({ type, quantity, icon, color }) => {
  const colorClasses = {
    green: 'bg-green-100 border-green-300 text-green-900',
    blue: 'bg-blue-100 border-blue-300 text-blue-900',
    purple: 'bg-purple-100 border-purple-300 text-purple-900'
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-3 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-semibold text-sm">{type}</p>
          <p className="text-xs opacity-70">Container capacity</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold font-mono">{quantity}</p>
        <p className="text-xs opacity-70">cartons</p>
      </div>
    </div>
  );
};

const CartonVisual = ({ dimensions }) => {
  // Safely parse numbers, fallback to 0
  const length = Number(dimensions?.length) || 0;
  const width = Number(dimensions?.width) || 0;
  const height = Number(dimensions?.height) || 0;
  const cbm = Number(dimensions?.cbm) || 0;

  const maxDim = Math.max(length, width, height, 1); // avoid divide by 0
  const scale = 120 / maxDim;

  const scaledL = length * scale;
  const scaledW = width * scale;
  const scaledH = height * scale;

  return (
    <div className="relative bg-white rounded-lg p-4 flex items-center justify-center" style={{ minHeight: '160px' }}>
      <svg width="200" height="140" viewBox="0 0 200 140" className="mx-auto">
        <rect
          x={50}
          y={70 - scaledH}
          width={scaledL}
          height={scaledH}
          fill="#E3F2FD"
          stroke="#1976D2"
          strokeWidth="2"
        />

        <path
          d={`M ${50} ${70 - scaledH} L ${50 + scaledW * 0.5} ${60 - scaledH} L ${50 + scaledL + scaledW * 0.5} ${60 - scaledH} L ${50 + scaledL} ${70 - scaledH} Z`}
          fill="#BBDEFB"
          stroke="#1976D2"
          strokeWidth="2"
        />

        <path
          d={`M ${50 + scaledL} ${70 - scaledH} L ${50 + scaledL + scaledW * 0.5} ${60 - scaledH} L ${50 + scaledL + scaledW * 0.5} ${60} L ${50 + scaledL} ${70} Z`}
          fill="#90CAF9"
          stroke="#1976D2"
          strokeWidth="2"
        />

        <text x={50 + scaledL / 2} y={85} textAnchor="middle" fontSize="10" fill="#666" fontFamily="monospace">
          L: {length} cm
        </text>
        <text x={50 + scaledL + scaledW * 0.5 + 15} y={65} fontSize="10" fill="#666" fontFamily="monospace">
          W: {width} cm
        </text>
        <text x={35} y={70 - scaledH / 2} fontSize="10" fill="#666" fontFamily="monospace">
          H: {height} cm
        </text>
      </svg>

      <div className="absolute bottom-2 right-2 text-xs text-gray-400 font-mono">
        CBM: {cbm.toFixed(6)} m³
      </div>
    </div>
  );
};

export default AICalculationsDisplay;