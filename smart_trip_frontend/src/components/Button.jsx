import React from "react";

const Button = ({ children, onClick, type = "button", className = "" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        bg-[#1E3A8A] 
        text-white 
        py-2 px-4 
        rounded-lg 
        hover:bg-[#162e6a] 
        transition 
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;