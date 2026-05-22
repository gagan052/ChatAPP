import './SearchBar.css';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
}: SearchBarProps) => {

  return (
    <div className="w-full p-2 border-b border-blue-500">

      <input
        type="text"

        value={value}

        onChange={(e) =>
          onChange(e.target.value)
        }

        placeholder={placeholder}

        className="searchbar"
      />
    </div>
  );
};

export default SearchBar;