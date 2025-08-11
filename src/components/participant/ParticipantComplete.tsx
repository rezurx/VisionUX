import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Study } from '../../types';

interface ParticipantCompleteProps {
  participantStudy: Study | null;
  participantId: string;
  participantStartTime: number;
  setParticipantMode: (mode: boolean) => void;
  setCurrentView: (view: string) => void;
  setParticipantStudy: (study: Study | null) => void;
  setParticipantId: (id: string) => void;
  setParticipantStartTime: (time: number) => void;
}

const ParticipantComplete: React.FC<ParticipantCompleteProps> = ({
  participantStudy,
  participantId,
  participantStartTime,
  setParticipantMode,
  setCurrentView,
  setParticipantStudy,
  setParticipantId,
  setParticipantStartTime
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
        <p className="text-gray-600 mb-6">
          Your participation has been successfully recorded. Your responses will help improve the user experience.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-600">
            <div>Study: {participantStudy?.name}</div>
            <div>Participant ID: {participantId}</div>
            <div>Duration: {Math.round((Date.now() - participantStartTime) / 1000)}s</div>
          </div>
        </div>
        
        <button 
          onClick={() => {
            // Try to close the window (works for popups)
            try {
              window.close();
              // If window.close() doesn't work, reset to landing after a brief delay
              setTimeout(() => {
                setParticipantMode(true);
                setCurrentView('participant-landing');
                setParticipantStudy(null);
                setParticipantId('');
                setParticipantStartTime(0);
              }, 100);
            } catch (error) {
              // Fallback: reset to landing page
              setParticipantMode(true);
              setCurrentView('participant-landing');
              setParticipantStudy(null);
              setParticipantId('');
              setParticipantStartTime(0);
            }
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Close Window
        </button>
      </div>
    </div>
  );
};

export default ParticipantComplete;