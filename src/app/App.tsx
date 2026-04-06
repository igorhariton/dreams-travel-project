import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AppProvider } from "../context";

type AppErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/90 p-6 shadow-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Application error
            </p>
            <h1 className="text-2xl font-bold text-white">The app failed to render.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {this.state.errorMessage || "An unknown error occurred while rendering the page."}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </AppErrorBoundary>
  );
}
