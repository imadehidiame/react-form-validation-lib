import { cn } from "../utils/cn";
import { NumberFormat } from "../utils/form-api";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";

interface NumberFieldProps {
    is_integer: boolean;
    disabled?: boolean;
    on_change: (value: string) => void;
    value: string;
    field_class?: string; 
    placeholder?: string;
    flag?: {
        length_after_decimal?: number;
        allow_decimal?: boolean;
        add_if_empty?: boolean;
        allow_zero_start?: boolean;
        total_length?: number;
        format_to_thousand?: boolean;
        allow_negative_prefix?:boolean;
        extra_format?: {
            format: string | string[],
            space_character?: string
        }
    },
    extra_format?: {
        format: string | string[],
        space_character?: string
    }
}
export const NumberField: React.FC<NumberFieldProps> = ({ flag, is_integer, on_change, value, field_class, placeholder, disabled }) => {
    const [field_value, set_field_value] = useState(value);
    useEffect(() => {
        if (value && value.length > 0) {
            const formted_value = is_integer ? NumberFormat.numbers_only(value, flag) : NumberFormat.thousands(value, flag);
            set_field_value(formted_value);
        } else {
            set_field_value('');
        }
    }, [value]);

    return <Input onChange={(e) => {
        const value = is_integer ? NumberFormat.numbers_only(e.target.value, flag) : NumberFormat.thousands(e.target.value, flag)
        on_change(value);
    }} value={field_value} disabled={disabled} type="text" className={cn(field_class)} placeholder={placeholder} />
}



export default NumberField;