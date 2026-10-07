type Props = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  label: string;
  className?: string;
};

export function SearchField({
  id,
  name,
  defaultValue = "",
  placeholder,
  label,
  className,
}: Props) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={className ? `ui-search-field ${className}` : "ui-search-field"}
      />
    </>
  );
}
