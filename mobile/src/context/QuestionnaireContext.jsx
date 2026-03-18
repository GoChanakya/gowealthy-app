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
  // Flatten basic fields
  age: 50,
  gender: "male",
  work_setup: "salaried",
  expense_tracking: "app",
  
  // Keep dependents as-is
  dependents: {
    child: 1,
    parent: 1,
    pet: 1,
    spouse: 1
  },
  
  // Keep income_data as-is
  income_data: {
    salary_business: { has: true, amount: "100" },
    rental: { has: false, amount: "" },
    other: { has: false, amount: "" },
    spouse: { has: false, amount: "" }
  },
  
  // Keep loan_data as-is
  loan_data: {
    home: { has: true, emi: "10" },
    commercial: { has: false, emi: "" },
    car: { has: false, emi: "" },
    education: { has: false, emi: "" },
    personal: { has: false, emi: "" }
  },
  
  // Keep house_expenses as-is
  house_expenses: {
    rent_maintenance: 20,
    groceries: "",
    help_salaries: "",
    shopping_dining_entertainment: 25
  },
  
  // Flatten child_expenses - remove nested object
  child_monthly_expense: 5,
  
  // Keep dependent_expenses as-is
  dependent_expenses: {
    spouse: "10",
    parent: "",
    pet: ""
  },
  
  // Keep emergency_funds as-is
  emergency_funds: {
    amount: 520000,
    months_covered: 62,
    approach: "fortress",
    selected_layer: "fortress",
    foundation_layer: {
      selected: false,
      amount: 90000,
      medical: 40000,
      emi: 20000,
      work_security: 20000,
      house: 0,
      vehicle: 10000,
      access_time: "0-24 hours"
    },
    intermediate_layer: {
      selected: false,
      amount: 180000,
      medical: 60000,
      emi: 40000,
      work_security: 50000,
      house: 10000,
      vehicle: 20000,
      access_time: "24-72 hours"
    },
    fortress_layer: {
      selected: true,
      amount: 250000,
      medical: 70000,
      emi: 60000,
      work_security: 70000,
      house: 20000,
      vehicle: 30000,
      access_time: "72+ hours"
    },
    total_emergency_fund: 520000,
    user_interaction_data: {
      layers_viewed: ["fortress"],
      layer_selection_timestamp: "2026-02-01T07:51:58.817Z",
      visualization_completed: true
    }
  },
  
  // Keep insurance_data as-is
  insurance_data: {
    life: {
      has: true,
      premium: "24",
      sum_insured: "8000",
      targetCoverage: 180
    },
    health: {
      has: true,
      premium: "18",
      sum_insured: "200",
      targetCoverage: 10
    },
    motor: {
      has: false,
      premium: "",
      targetCoverage: 0
    }
  },
  
  // Keep psychology_responses as-is
  psychology_responses: {
    restaurant_choice: { value: "trending", score: 3 },
    laptop_choice: { value: "dell", score: 1 },
    phone_vacation: { value: "vacation_emi", score: 2 },
    insurance_choice: { value: "plan_a", score: 2 }
  },
  
  // Keep psychology_scores as-is
  psychology_scores: {
    restaurant_choice: 3,
    laptop_choice: 1,
    phone_vacation: 2,
    insurance_choice: 2
  },
  
  total_psychology_score: 8,
  
  // Keep risk_assessment as-is
  risk_assessment: {
    riskCapacity: 58,
    riskCategory: "Emotionally Influenced",
    keywords: "Reactive, Intuitive, Social",
    description: "Market news, global stories, and your own feelings about money naturally influence you. You may make quick decisions based on recent events, and sometimes second-guess your choices. You prefer having guardrails and automated systems to keep you on track.",
    dimensions: {
      SI: 73,
      FO: 63,
      LS: 27,
      CO: 70,
      AT: 57
    }
  },
  
  // Keep top_goals as-is
  top_goals: [
    "international_travel",
    "higher_course",
    "domestic_vacation"
  ],
  
  // Flatten user fields
  fullName: "",
  email: "",
  phoneNumber: "",
  verifiedAt: null,
  
  // Payment info (flatten)
  selected_payment_plan: null,
  payment_plan_details: {},
  payment_completed: false,
  payment_timestamp: null,
  razorpay_payment_id: "",
  subscription_type: "free",
  subscription_status: "skip",
  
  // Goal allocations - FLATTEN to array
  goal_allocations: [
    {
      name: "International Travel",
      targetAmount: 400000,
      inflation: 8,
      growth: 12,
      adhoc: 7,
      timePeriod: 7,
      customAllocation: 15000,
      stepValue: 1500,
      calculatedAmount: 2456000
    },
    {
      name: "Post Graduate Course",
      targetAmount: 500000,
      inflation: 5,
      growth: 12,
      adhoc: 7,
      timePeriod: 7,
      customAllocation: 9000,
      stepValue: 500,
      calculatedAmount: 1341000
    },
    {
      name: "Domestic Vacation",
      targetAmount: 200000,
      inflation: 0,
      growth: 10,
      adhoc: 7,
      timePeriod: 7,
      customAllocation: 6000,
      stepValue: 500,
      calculatedAmount: 726000
    }
  ],
  
  savings: 30000,
  
  // Keep monthly_breakdown as-is
  monthly_breakdown: {
    total_income: 100,
    total_emi: 10,
    house_expenses: 45,
    child_expenses: 5,
    dependent_expenses: 10,
    remaining_amount: 30
  },
  
  analysis_complete: true
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

 
  const updateAnswer = (key, value) => {
  // NO MAPPING - direct update now
  setAnswers(prev => ({
    ...prev,
    [key]: value
  }));
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
