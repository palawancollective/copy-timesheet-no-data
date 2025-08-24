
import React, { useState } from 'react';
import { TimeTrackingApp } from '@/components/TimeTrackingApp';
import { PasskeyAccess } from '@/components/PasskeyAccess';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <PasskeyAccess onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return <TimeTrackingApp />;
};

export default Index;
