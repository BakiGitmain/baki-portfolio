"use client";

import {
  Component,
  type ReactNode,
} from "react";

type SplineErrorBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type SplineErrorBoundaryState = {
  hasError: boolean;
};

export default class SplineErrorBoundary extends Component<
  SplineErrorBoundaryProps,
  SplineErrorBoundaryState
> {
  state: SplineErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): SplineErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}
