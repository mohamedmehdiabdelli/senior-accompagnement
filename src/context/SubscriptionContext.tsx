import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getSubscriptionStatus, setSubscriptionStatus } from '../lib/db';

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsSubscribed(getSubscriptionStatus());
  }, []);

  const subscribe = () => {
    setIsSubscribed(true);
    setSubscriptionStatus(true);
  };

  const unsubscribe = () => {
    setIsSubscribed(false);
    setSubscriptionStatus(false);
  };

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, subscribe, unsubscribe }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
