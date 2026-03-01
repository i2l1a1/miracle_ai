import type {ChangeEvent} from "react";

export default function SingleLineInputField({
                                                 label = "",
                                                 type = "text",
                                                 name,
                                                 placeholder,
                                                 value,
                                                 onChange,
                                                 disabled,
                                             }: {
    label?: string;
    type?: string;
    name: string;
    placeholder: string;
    value?: string;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}) {
    return (
        <label className="flex flex-col">
            {label !== "" && <p className="mb-3">{label}</p>}
            <input
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={"w-full p-4 rounded-[12px] border border-input-stroke focus:outline-none focus:ring-0 focus:shadow-none placeholder:text-gray-text"}
            />
        </label>
    );
}