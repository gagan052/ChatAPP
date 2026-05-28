// import './SearchBar.css';
import '../../pages/chat/chat.css';

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
    <div className="searchbar-container">
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