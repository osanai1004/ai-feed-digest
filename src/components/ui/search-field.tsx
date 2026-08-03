type Props = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  label: string;
};

export function SearchField({
  id,
  name,
  defaultValue = "",
  placeholder,
  label,
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
        className="ui-search-field"
      />
    </>
  );
}
