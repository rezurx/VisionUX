import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Study } from '../../types';

interface ParticipantTreeTestProps {
  participantStudy: Study | null;
  participantId: string;
  participantStartTime: number;
  setStudyResults: (fn: (prev: any) => any) => void;
  setStudies: (fn: (prev: Study[]) => Study[]) => void;
  setCurrentView: (view: string) => void;
}

const ParticipantTreeTest: React.FC<ParticipantTreeTestProps> = ({
  participantStudy,
  participantId,
  participantStartTime,
  setStudyResults,
  setStudies,
  setCurrentView
}) => {
  if (!participantStudy) return null;
  
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  
  const selectNode = (nodeName: string) => {
    setSelectedPath([...selectedPath, nodeName]);
    setCurrentLevel(currentLevel + 1);
  };

  const submitStudy = () => {
    const results = {
      participantId,
      studyId: participantStudy.id,
      studyType: 'tree-testing',
      startTime: participantStartTime,
      completionTime: Date.now(),
      totalDuration: Date.now() - participantStartTime,
      treeTestResults: {
        task: participantStudy.task,
        path: selectedPath,
        success: selectedPath.includes('Returns') || selectedPath.includes('Policy'),
        clicks: selectedPath.length
      }
    };
    
    setStudyResults((prev: any) => ({
      ...prev,
      [results.participantId]: results
    }));
    
    // Update participant count
    setStudies(prev => prev.map(study => 
      study.id === participantStudy.id 
        ? { ...study, participants: study.participants + 1 }
        : study
    ));
    
    setCurrentView('participant-complete');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{participantStudy.name}</h1>
            <p className="text-sm text-gray-600">Tree Testing Study</p>
          </div>
          <div className="text-sm text-gray-500">
            Participant: {participantId}
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Your Task</h2>
          <p className="text-blue-800 font-medium">
            {participantStudy.task || 'Navigate the website structure to find the information.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="font-medium mb-4">Website Structure</h3>
            <div className="space-y-2">
              <div className="cursor-pointer hover:bg-gray-50 p-3 rounded border" onClick={() => selectNode('Home')}>
                📄 Home
              </div>
              <div className="cursor-pointer hover:bg-gray-50 p-3 rounded border" onClick={() => selectNode('Products')}>
                📦 Products
              </div>
              <div className="cursor-pointer hover:bg-gray-50 p-3 rounded border" onClick={() => selectNode('Customer Service')}>
                🎧 Customer Service
                <div className="ml-4 mt-2 space-y-1">
                  <div className="cursor-pointer hover:bg-gray-50 p-2 rounded border text-sm" onClick={() => selectNode('Returns & Exchanges')}>
                    🔄 Returns & Exchanges
                  </div>
                  <div className="cursor-pointer hover:bg-gray-50 p-2 rounded border text-sm" onClick={() => selectNode('Contact Us')}>
                    📞 Contact Us
                  </div>
                  <div className="cursor-pointer hover:bg-gray-50 p-2 rounded border text-sm" onClick={() => selectNode('FAQ')}>
                    ❓ FAQ
                  </div>
                </div>
              </div>
              <div className="cursor-pointer hover:bg-gray-50 p-3 rounded border" onClick={() => selectNode('Account')}>
                👤 Account
              </div>
              <div className="cursor-pointer hover:bg-gray-50 p-3 rounded border" onClick={() => selectNode('About')}>
                ℹ️ About Us
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="font-medium mb-4">Your Navigation Path</h3>
            {selectedPath.length > 0 ? (
              <div className="space-y-3">
                {selectedPath.map((node, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm">{node}</span>
                  </div>
                ))}
                <div className="mt-6">
                  <button 
                    onClick={submitStudy}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>I Found It!</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic text-center py-8">
                Click on items in the website structure to navigate...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantTreeTest;