
import React, { useState } from 'react';

const TestPalette: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(prevState => !prevState);
  };

  const containerStyle = {
    width: isCollapsed ? '36px' : '150px',
  };

  // Changed bg to indigo
  const containerClasses = `flex items-center h-9 ${isCollapsed ? 'justify-center' : 'justify-between pl-3 pr-1'} rounded-md border border-gray-700 bg-indigo-600/80 hover:bg-indigo-500/80 backdrop-blur-sm shadow-lg overflow-hidden transition-all duration-300 ease-in-out cursor-pointer`;

  return (
    <div
      className={containerClasses}
      style={containerStyle}
      onClick={toggleCollapse}
      title={isCollapsed ? "Show Test Window" : "Collapse Test Window"}
    >
      {!isCollapsed && (
        <h3 className="text-white font-bold select-none whitespace-nowrap text-sm">
          Test Window
        </h3>
      )}
      <div className={`text-white p-0 flex-shrink-0 flex items-center justify-center ${!isCollapsed ? 'ml-auto' : ''}`}>
        {isCollapsed ? (
          // Expand icon (Pencil/Edit visual placeholder)
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        ) : (
          // Collapse icon
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        )}
      </div>
    </div>
  );
};

export default TestPalette;
