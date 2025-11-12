'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface VehicleSelectorProps {
  disabled?: boolean;
  onVehicleChange?: (vehicle: string, model: string) => void;
}

export const VehicleSelector = ({ disabled = false, onVehicleChange }: VehicleSelectorProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const vehicles = [
    { name: 'Honda', models: ['Civic', 'Jazz'] },
    { name: 'Maruti', models: ['Ertiga', 'Baleno'] },
  ];

  const selectedVehicleData = vehicles.find(v => v.name === selectedVehicle);
  const availableModels = selectedVehicleData ? selectedVehicleData.models : [];

  const handleVehicleChange = (vehicle: string) => {
    setSelectedVehicle(vehicle);
    setSelectedModel(''); // Reset model when vehicle changes
    setIsVehicleDropdownOpen(false);
    
    // Call the callback with empty model since we reset it
    if (onVehicleChange) {
      onVehicleChange(vehicle, '');
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setIsModelDropdownOpen(false);
    
    // Call the callback with both vehicle and model
    if (onVehicleChange) {
      onVehicleChange(selectedVehicle, model);
    }
  };

  return (
    <div className="flex gap-4">
      {/* Vehicle Selector */}
      <div className="relative flex-1">
        <button
          onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-white/20 bg-white/10 px-4 py-4 text-left font-medium text-gray-200 shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-white/15"
          disabled={disabled}
        >
          {selectedVehicle || 'Select Vehicle'}
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${
              isVehicleDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isVehicleDropdownOpen && (
          <div className="absolute top-full right-0 left-0 z-20 mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.name}
                onClick={() => handleVehicleChange(vehicle.name)}
                className="w-full px-4 py-3 text-left text-gray-600 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50"
              >
                {vehicle.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Model Selector */}
      <div className="relative flex-1">
        <button
          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          className={`flex w-full items-center justify-between rounded-lg border border-white/20 px-4 py-4 text-left font-medium shadow-lg backdrop-blur-md transition-all duration-200 ${
            selectedVehicle && availableModels.length > 0
              ? 'bg-white/10 text-gray-200 hover:bg-white/15'
              : 'bg-white/5 text-gray-400 cursor-not-allowed'
          }`}
          disabled={disabled || !selectedVehicle || availableModels.length === 0}
        >
          {selectedModel || (selectedVehicle ? 'Select Model' : 'Select Vehicle First')}
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${
              isModelDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isModelDropdownOpen && availableModels.length > 0 && (
          <div className="absolute top-full right-0 left-0 z-20 mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {availableModels.map((model) => (
              <button
                key={model}
                onClick={() => handleModelChange(model)}
                className="w-full px-4 py-3 text-left text-gray-600 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50"
              >
                {model}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};