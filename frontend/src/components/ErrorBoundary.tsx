import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorPage error={this.state.error} />;
    }

    return this.props.children;
  }
}

export function ErrorPage({ error }: { error: Error | null }) {
  return (
    <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center p-8 text-center bg-background text-foreground">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
      </p>
      {error && (
        <pre className="text-xs text-left bg-muted p-4 rounded-md overflow-auto max-w-full text-muted-foreground w-full sm:max-w-xl mb-6">
          {error.message}
        </pre>
      )}
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md transition-colors hover:bg-primary/90"
      >
        Refresh Page
      </button>
    </div>
  );
}
