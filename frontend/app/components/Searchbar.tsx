import { FC } from "react";

interface SearchbarProps {
    value: string;
    onChange: (value: string) => void;
}

const Searchbar: FC<SearchbarProps> = ({ value, onChange }) => {
    return (
        <div className="flex items-center space-x-2 mb-4">
            <input
                type="text"
                placeholder="Name eines Audits"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="p-5 border border-gray-300 dark:bg-gray-900 rounded-md"
            />
        </div>
    );
};

export default Searchbar;