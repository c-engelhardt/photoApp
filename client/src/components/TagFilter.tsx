// Simple chip-style tag selector for gallery filtering.
type TagFilterProps = {
  tags: string[];
  value: string;
  onChange: (value: string) => void;
};

const TagFilter = ({ tags, value, onChange }: TagFilterProps) => {
  // Hide the control entirely when there are no tag options.
  if (!tags.length) return null;

  return (
    <div className="tag-filter">
      <button className={value === "" ? "active" : ""} onClick={() => onChange("")}>All</button>
      {tags.map((tag) => (
        <button
          key={tag}
          className={value === tag ? "active" : ""}
          onClick={() => onChange(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

export default TagFilter;
