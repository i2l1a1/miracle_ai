import type {ChangeEvent} from "react";

export default function SingleLineInputField({label = "", type = "text", name, placeholder, onChange}: {
    label?: string,
    type?: string,
    name: string,
    placeholder: string,
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void,
}) {
    return (
        <label className="flex flex-col">
            {label !== "" && <p className="mb-3">{label}</p>}
            <input
                name={name}
                type={type}
                placeholder={placeholder}
                onChange={onChange}
                className="px-4 py-4 rounded-xl border border-input-stroke focus:outline-none focus:ring-0 focus:shadow-none placeholder:text-gray-text"
            />
        </label>
    );
}