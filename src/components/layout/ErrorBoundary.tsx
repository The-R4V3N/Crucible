import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Catches render errors and shows a dark-themed error screen. */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleDismiss = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-crucible-bg p-8">
          <h1 className="text-crucible-accent text-xl font-bold">Something went wrong</h1>
          <p className="text-crucible-text text-sm max-w-lg text-center">
            {this.state.error?.message ?? "Unknown error"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 text-sm bg-crucible-accent text-crucible-bg rounded hover:opacity-80 transition-opacity"
            >
              Reload
            </button>
            <button
              onClick={this.handleDismiss}
              className="px-4 py-2 text-sm border border-crucible-border text-crucible-text rounded hover:bg-crucible-hover transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
