import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
}

interface RouterContextType {
  currentPath: string;
  navigate: (to: string) => void;
  params: Record<string, string>;
  searchParams: URLSearchParams;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function getCleanHash(): string {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === '') return '/';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentHash, setCurrentHash] = useState<string>(getCleanHash());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(getCleanHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (to: string) => {
    const target = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : `/${to}`}`;
    if (window.location.hash === target) {
      setCurrentHash(getCleanHash());
    } else {
      window.location.hash = target;
    }
  };

  const { path, searchParams } = useMemo(() => {
    const [pathPart, queryPart] = currentHash.split('?');
    return {
      path: pathPart || '/',
      searchParams: new URLSearchParams(queryPart || '')
    };
  }, [currentHash]);

  // Extract common route params
  const params = useMemo(() => {
    const p: Record<string, string> = {};
    const parts = path.split('/').filter(Boolean);
    // Pattern: /audits/:auditId/overview or /audits/:auditId/investigate
    if (parts[0] === 'audits' && parts[1] && parts[1] !== 'new') {
      p.auditId = parts[1];
      if (parts[2]) p.subView = parts[2];
      if (parts[3]) p.claimId = parts[3];
    }
    return p;
  }, [path]);

  return (
    <RouterContext.Provider value={{ currentPath: path, navigate, params, searchParams }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return ctx;
};
