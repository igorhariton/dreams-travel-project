import React from "react";
import AdminModuleShell from "./Components/AdminModuleShell";

export default function Employees() {
  return (
    <AdminModuleShell
      title="Employees"
      description="Employee administration entrypoint prepared inside src/admin so staff tools can grow independently without mixing them into shared pages."
    />
  );
}
