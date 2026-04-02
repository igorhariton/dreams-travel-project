import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { AppProvider } from "./context";

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
