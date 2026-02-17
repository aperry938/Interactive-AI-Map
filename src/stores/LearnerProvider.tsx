import React from 'react';
import { LearnerContext, useLearnerReducer } from './learnerStore';

export function LearnerProvider({ children }: { children: React.ReactNode }) {
  const value = useLearnerReducer();
  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>;
}
