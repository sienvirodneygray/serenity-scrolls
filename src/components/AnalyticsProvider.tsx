import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

function AnalyticsInitializer() {
  useAnalytics();
  return null;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  return (
    <>
      <AnalyticsInitializer />
      {children}
    </>
  );
}
