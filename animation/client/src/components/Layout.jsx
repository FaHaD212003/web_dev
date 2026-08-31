import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TaskForm from "./TaskForm";

export default function Layout({ user }) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Persistent Sidebar */}
      <Sidebar 
        role={user.role} 
        onOpenCreateTask={() => setIsFormOpen(true)} 
      />
      
      {/* Main Page Content */}
      <main className="ml-64 p-8 w-full">
        <Outlet /> 
      </main>

      {/* Global Task Modal */}
      {isFormOpen && (
        <TaskForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 

        />
      )}
    </div>
  );
}