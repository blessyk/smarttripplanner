import React from "react";

const Input = React.forwardRef(
  ({ label, type = "text", placeholder, error, ...rest }, ref) => {
    return (
      <div className="mb-4">
        {label && <label className="block mb-1 text-black">{label}</label>}

        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          {...rest}
          className={`w-full px-4 py-2 rounded-lg border 
          bg-transparent text-black placeholder-black
          focus:outline-none focus:ring-2 focus:ring-[#0A3D62]
          ${error ? "border-red-500" : "border-gray-300"}`}
        />

        {error && <span className="text-red-500 text-sm">{error}</span>}
      </div>
    );
  }
);

export default Input;