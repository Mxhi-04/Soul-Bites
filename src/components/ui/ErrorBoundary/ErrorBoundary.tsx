import React, { Component, ErrorInfo } from "react";

export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unable to render application", error, info.componentStack);
  }
  render() {
    if (this.state.hasError)
      return (
        <main
          className="container"
          style={{ paddingBlock: "var(--space-2xl)" }}
        >
          <h1>We couldn’t load this page</h1>
          <p>Please reload to try again.</p>
          <button
            className="recovery-button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </main>
      );
    return this.props.children;
  }
}
