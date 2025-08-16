'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface AuthProvidersProps {
  children: React.ReactNode;
}

const AuthProviders: React.FC<AuthProvidersProps> = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default AuthProviders;