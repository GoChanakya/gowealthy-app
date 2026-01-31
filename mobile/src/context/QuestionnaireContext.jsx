// import React, { createContext, useContext, useState } from 'react';

// const QuestionnaireContext = createContext();

// export const useQuestionnaire = () => {
//   const context = useContext(QuestionnaireContext);
//   if (!context) {
//     throw new Error('useQuestionnaire must be used within QuestionnaireProvider');
//   }
//   return context;
// };

// export const QuestionnaireProvider = ({ children }) => {
//   const [answers, setAnswers] = useState({
//     // Section 1
//     age: '',
//     gender: '',
//     dependents: {
//       child: 0,
//       parent: 0,
//       pet: 0,
//       spouse: 0
//     },
//     // Section 2 - add as you build more screens
//     goals: [],
//     // Section 3
//     income: {},
//     expenses: {},
//     // Add more sections as needed
//   });

//   const updateAnswer = (key, value) => {
//     setAnswers(prev => ({
//       ...prev,
//       [key]: value
//     }));
//   };

//   const updateNestedAnswer = (parentKey, childKey, value) => {
//     setAnswers(prev => ({
//       ...prev,
//       [parentKey]: {
//         ...prev[parentKey],
//         [childKey]: value
//       }
//     }));
//   };

//   const resetAnswers = () => {
//     setAnswers({
//       age: '',
//       gender: '',
//       dependents: {
//         child: 0,
//         parent: 0,
//         pet: 0,
//         spouse: 0
//       },
//       goals: [],
//       income: {},
//       expenses: {},
//     });
//   };

//   return (
//     <QuestionnaireContext.Provider 
//       value={{ 
//         answers, 
//         updateAnswer, 
//         updateNestedAnswer,
//         resetAnswers 
//       }}
//     >
//       {children}
//     </QuestionnaireContext.Provider>
//   );
// };

import React, { createContext, useContext, useState } from "react";

const QuestionnaireContext = createContext();

export const useQuestionnaire = () => {
  const context = useContext(QuestionnaireContext);
  if (!context) {
    throw new Error("useQuestionnaire must be used within QuestionnaireProvider");
  }
  return context;
};

/* ---------------- FULL DATA STATE ---------------- */

const initialState = {
  basic: { age: "", gender: "", work_setup: "", expense_tracking: "" },

  dependents: { child: 0, parent: 0, pet: 0, spouse: 0 },

  income_data: {
    salary_business: { has: false, amount: "" },
    rental: { has: false, amount: "" },
    other: { has: false, amount: "" },
    spouse: { has: false, amount: "" }
  },

  loan_data: {
    home: { has: false, emi: "" },
    commercial: { has: false, emi: "" },
    car: { has: false, emi: "" },
    education: { has: false, emi: "" },
    personal: { has: false, emi: "" }
  },

  house_expenses: {
    rent_maintenance: "",
    groceries: "",
    help_salaries: "",
    shopping_dining_entertainment: ""
  },

  child_expenses: {
    education: "",
    classes: "",
    clothes_toys_other: "",
    child_monthly_expense: 0
  },

  dependent_expenses: { spouse: "", parent: "", pet: "" },

  emergency_funds: {
    approach: "",
    selected_layer: null,
    foundation_layer: { selected: false },
    intermediate_layer: { selected: false },
    fortress_layer: { selected: false },
    user_interaction_data: {
      layers_viewed: [],
      layer_selection_timestamp: null,
      visualization_completed: false
    }
  },

  insurance_data: {
    life: { has: false, premium: "", sum_insured: "" },
    health: { has: false, premium: "", sum_insured: "" },
    motor: { has: false, premium: "" }
  },

  psychology: {
    gadget_purchase_approach: {},
    travel_behavior: {},
    restaurant_behavior: {}
  },

  user_data: { fullName: "", email: "", phoneNumber: "", verifiedAt: null },

  top_goals: [],

  payment: {
    selected_payment_plan: null,
    payment_plan_details: {},
    payment_completed: false,
    payment_timestamp: null,
    razorpay_payment_id: ""
  },

  goal_planning: {
    goal_allocations: {},
    customAllocations: {},
    timePeriod: 5,
    savings: 30000,
    goal_modification_count: 0
  }
};

/* ---------------- PROVIDER ---------------- */

export const QuestionnaireProvider = ({ children }) => {
  const [answers, setAnswers] = useState(initialState);

  /* 🔥 UNIVERSAL DEEP UPDATER */
  const updateField = (path, value) => {
    setAnswers(prev => {
      const keys = path.split(".");
      const updated = { ...prev };
      let obj = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }

      obj[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  /* ✅ OLD FUNCTION — STILL WORKS */
  const updateAnswer = (key, value) => {
    // Map old flat keys to new structure
    const keyMap = {
      age: "basic.age",
      gender: "basic.gender",
      work_setup: "basic.work_setup",
      expense_tracking: "basic.expense_tracking",
      goals: "top_goals"
    };

    updateField(keyMap[key] || key, value);
  };

  /* ✅ OLD NESTED FUNCTION — STILL WORKS */
  const updateNestedAnswer = (parentKey, childKey, value) => {
    const parentMap = {
      income: "income_data",
      loans: "loan_data",
      insurance: "insurance_data"
    };

    const mappedParent = parentMap[parentKey] || parentKey;
    updateField(`${mappedParent}.${childKey}`, value);
  };

  const resetAnswers = () => setAnswers(initialState);

  return (
    <QuestionnaireContext.Provider
      value={{
        answers,
        updateAnswer,
        updateNestedAnswer,
        updateField, // new superpower
        resetAnswers
      }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
};
