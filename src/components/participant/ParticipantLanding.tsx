import React, { useState, useEffect } from 'react';
import { TreePine } from 'lucide-react';
import { Study } from '../../types';

interface ParticipantLandingProps {
  studies: Study[];
  studyId: string | null;
  participantStudy: Study | null;
  setParticipantStudy: (study: Study | null) => void;
  setParticipantId: (id: string) => void;
  setParticipantStartTime: (time: number) => void;
  setCurrentView: (view: string) => void;
}

const ParticipantLanding: React.FC<ParticipantLandingProps> = ({
  studies,
  studyId,
  participantStudy,
  setParticipantStudy,
  setParticipantId,
  setParticipantStartTime,
  setCurrentView
}) => {
  const [accessCode, setAccessCode] = useState('');
  
  const joinStudy = () => {
    const study = studies.find(s => s.id.toString() === accessCode && s.status === 'active');
    
    if (study) {
      setParticipantStudy(study);
      setParticipantId('P' + Date.now());
      setParticipantStartTime(Date.now());
      setCurrentView('participant-study');
    } else {
      // Check if study exists but isn't active
      const studyExists = studies.find(s => s.id.toString() === accessCode);
      if (studyExists) {
        alert(`Study found but status is "${studyExists.status}". Only "active" studies can be accessed.`);
      } else {
        alert('Invalid access code. Please check the code and try again.');
      }
    }
  };

  const useDirectLink = () => {
    if (studyId) {
      const study = studies.find(s => s.id.toString() === studyId && s.status === 'active');
      
      if (study) {
        setParticipantStudy(study);
        setParticipantId('P' + Date.now());
        setParticipantStartTime(Date.now());
        setCurrentView('participant-study');
      } else {
        // Check if study exists but isn't active
        const studyExists = studies.find(s => s.id.toString() === studyId);
        if (studyExists) {
          alert(`Study found but status is "${studyExists.status}". Only "active" studies can be accessed.`);
        } else {
          alert('This study is not available.');
        }
      }
    }
  };

  // Auto-join if study ID is in URL
  useEffect(() => {
    if (studyId && !participantStudy) {
      useDirectLink();
    }
  }, [studyId, participantStudy]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <TreePine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Research Study</h1>
          <p className="text-gray-600">Enter your access code to participate</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Access Code</label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter study access code"
            />
          </div>
          
          <button
            onClick={joinStudy}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Join Study
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact the study administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParticipantLanding;