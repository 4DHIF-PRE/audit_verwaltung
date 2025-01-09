import { useState, useEffect } from "react";

interface SearchbarProps {
    value: string;
    onChange: (value: string) => void;
}
const Searchbar: React.FC<SearchbarProps> = ({ value, onChange }:SearchbarProps) => {
    return (
        <div className="flex items-center space-x-2 mb-4">
            <input
                type="text"
                placeholder="ID/Name eines Audits"
                value={value}
                onChange={(e) => onChange(e.target.value)} // Richtiges Event-Binding
                className="flex-1 p-2 border border-gray-300 dark:bg-gray-900 rounded-md"
            />
            <button className="p-2 bg-gray-100 dark:bg-gray-900 rounded-md" onClick={() => onChange(value)}>
          <span role="img" aria-label="search">
            🔍
          </span>
            </button>
        </div>
    );
};

export default Searchbar;