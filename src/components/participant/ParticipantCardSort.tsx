import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Study } from '../../types';

interface ParticipantCardSortProps {
  participantStudy: Study | null;
  participantId: string;
  participantStartTime: number;
  setStudyResults: (fn: (prev: any) => any) => void;
  setStudies: (fn: (prev: Study[]) => Study[]) => void;
  setCurrentView: (view: string) => void;
}

const ParticipantCardSort: React.FC<ParticipantCardSortProps> = ({
  participantStudy,
  participantId,
  participantStartTime,
  setStudyResults,
  setStudies,
  setCurrentView
}) => {
  if (!participantStudy) return null;
  
  // Ensure we have valid cards and categories
  const studyCards = participantStudy.cards || [];
  const studyCategories = participantStudy.categories || [];
  
  if (studyCards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Study Error</p>
          <p className="text-gray-600">This study has no cards to sort. Please contact the study administrator.</p>
        </div>
      </div>
    );
  }
  
  if (studyCategories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Study Error</p>
          <p className="text-gray-600">This study has no categories. Please contact the study administrator.</p>
        </div>
      </div>
    );
  }
  
  const [unsortedCards, setUnsortedCards] = useState(studyCards);
  const [categories, setCategories] = useState<{id: number, name: string, cards: any[]}[]>(
    studyCategories.map(cat => ({ ...cat, cards: [] }))
  );
  const [draggedCard, setDraggedCard] = useState<any>(null);

  const handleDragStart = (_e: React.DragEvent, card: any) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    if (draggedCard) {
      setUnsortedCards(prev => prev.filter(card => card.id !== draggedCard.id));
      setCategories(prev => prev.map(cat => ({
        ...cat,
        cards: cat.cards.filter(card => card.id !== draggedCard.id)
      })));
      
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, cards: [...cat.cards, draggedCard] }
          : cat
      ));
      
      setDraggedCard(null);
    }
  };

  const submitStudy = () => {
    const results = {
      participantId,
      studyId: participantStudy.id,
      studyType: 'card-sorting',
      startTime: participantStartTime,
      completionTime: Date.now(),
      totalDuration: Date.now() - participantStartTime,
      cardSortResults: categories.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        cards: cat.cards.map(card => ({ id: card.id, text: card.text }))
      }))
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

  const isComplete = unsortedCards.length === 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{participantStudy.name}</h1>
              <p className="text-sm text-gray-600">Card Sorting Study</p>
            </div>
            <div className="text-sm text-gray-500 flex-shrink-0">
              Participant: <span className="font-medium">{participantId}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto py-4 sm:py-8 px-4 sm:px-6 space-y-4 sm:space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            Instructions
          </h2>
          <div className="space-y-2 text-blue-800">
            <p className="text-sm sm:text-base leading-relaxed">
              Drag the cards below into the categories where you think they belong.
            </p>
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> You can move cards between categories until you're satisfied with your groupings.
            </p>
          </div>
        </div>
        
        {unsortedCards.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Cards to Sort</h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {unsortedCards.length} remaining
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {unsortedCards.map(card => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card)}
                  className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg cursor-move hover:from-blue-100 hover:to-blue-200 hover:shadow-md transition-all duration-200 font-medium text-blue-900 text-sm sm:text-base select-none"
                  role="button"
                  tabIndex={0}
                  aria-label={`Drag card: ${card.text}`}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 flex-shrink-0"></div>
                    <span className="leading-tight">{card.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <div
              key={category.id}
              className="bg-white p-4 border-2 border-dashed border-gray-200 rounded-xl min-h-40 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category.id)}
              role="region"
              aria-label={`Category: ${category.name}`}
            >
              <h4 className="font-semibold mb-4 text-center bg-gradient-to-r from-gray-100 to-gray-200 py-3 rounded-lg text-gray-800 text-sm sm:text-base">
                {category.name}
                {category.cards.length > 0 && (
                  <span className="block text-xs text-gray-600 mt-1 font-normal">
                    {category.cards.length} card{category.cards.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h4>
              <div className="space-y-2 min-h-16">
                {category.cards.map((card) => (
                  <div key={card.id} className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-900 hover:bg-green-100 transition-colors duration-150">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></div>
                      <span className="leading-tight">{card.text}</span>
                    </div>
                  </div>
                ))}
              </div>
              {category.cards.length === 0 && (
                <div className="flex items-center justify-center h-16 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="mb-1">📤</div>
                    <div>Drop cards here</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
          {/* Progress indicator */}
          <div className="text-center sm:text-left">
            <div className="text-sm text-gray-600 mb-2">
              Progress: {studyCards.length - unsortedCards.length} of {studyCards.length} cards sorted
            </div>
            <div className="w-48 sm:w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((studyCards.length - unsortedCards.length) / studyCards.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <button 
            onClick={submitStudy}
            disabled={!isComplete}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-200 shadow-sm ${
              isComplete 
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-lg' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            aria-label={isComplete ? 'Complete the study' : `Sort ${unsortedCards.length} more cards to continue`}
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm sm:text-base">
              {isComplete ? 'Complete Study' : `Sort ${unsortedCards.length} more card${unsortedCards.length !== 1 ? 's' : ''}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantCardSort;