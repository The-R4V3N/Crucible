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
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-warp-bg p-8">
          <h1 className="text-warp-accent text-xl font-bold">Something went wrong</h1>
          <p className="text-warp-text text-sm max-w-lg text-center">
            {this.state.error?.message ?? "Unknown error"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 text-sm bg-warp-accent text-warp-bg rounded hover:opacity-80 transition-opacity"
            >
              Reload
            </button>
            <button
              onClick={this.handleDismiss}
              className="px-4 py-2 text-sm border border-warp-border text-warp-text rounded hover:bg-warp-hover transition-colors"
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
