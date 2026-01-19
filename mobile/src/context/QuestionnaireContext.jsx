import React, { createContext, useContext, useState } from 'react';

const QuestionnaireContext = createContext();

export const useQuestionnaire = () => {
  const context = useContext(QuestionnaireContext);
  if (!context) {
    throw new Error('useQuestionnaire must be used within QuestionnaireProvider');
  }
  return context;
};

export const QuestionnaireProvider = ({ children }) => {
  const [answers, setAnswers] = useState({
    // Section 1
    age: '',
    gender: '',
    dependents: {
      child: 0,
      parent: 0,
      pet: 0,
      spouse: 0
    },
    // Section 2 - add as you build more screens
    goals: [],
    // Section 3
    income: {},
    expenses: {},
    // Add more sections as needed
  });

  const updateAnswer = (key, value) => {
    setAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedAnswer = (parentKey, childKey, value) => {
    setAnswers(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  const resetAnswers = () => {
    setAnswers({
      age: '',
      gender: '',
      dependents: {
        child: 0,
        parent: 0,
        pet: 0,
        spouse: 0
      },
      goals: [],
      income: {},
      expenses: {},
    });
  };

  return (
    <QuestionnaireContext.Provider 
      value={{ 
        answers, 
        updateAnswer, 
        updateNestedAnswer,
        resetAnswers 
      }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
};