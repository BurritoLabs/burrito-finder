import { Component, ErrorInfo, ReactNode } from "react";
import { reportClientError } from "../reportError";

const OOPS = "Oops! Something went wrong.";

type Props = { fallback?: ReactNode; children?: ReactNode };
class ErrorBoundary extends Component<Props> {
  state = { hasError: null };
  static getDerivedStateFromError = () => ({ hasError: true });

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError("react", error, {
      componentStack: info.componentStack ?? undefined
    });
  }

  render() {
    const { fallback = OOPS, children } = this.props;
    const { hasError } = this.state;
    return hasError ? fallback : children;
  }
}

export default ErrorBoundary;
