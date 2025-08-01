import { cn } from "../utils/cn";
import { Input } from "./ui/input";
//import { NumberFormat } from "./number-field";
import { NumberFormat } from "../utils/form-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Textarea } from "./ui/textarea";
import LexicalTextEditor from "./lexical-text-editor";
import FileUploader from "./file-uploader";


type Validation<T> = {
  [x in keyof T]: (value: any/*,form_state?:{[x in keyof T]:any}*/) => string | undefined;
};
type FormObject = Record<string, any>;
type ErrorObject = Record<string, string | undefined>;


interface FormFieldComponentPropsDefault<T extends FormObject, U extends ErrorObject> {
  form_object: T;
  error_object: U;
  validators: Validation<U>;
  name: keyof T & string;
  placeholder: string | undefined;
  description?: string;
  label?: string;
  className?: string;
  input_type?: 'text'|'password';
  label_classname?: string;
  icon?: React.ReactNode;
  id?: string;
  disabled?: boolean;
  contentEditable?: boolean;
  field_classnames?: string;
  suffix_icon?:React.FunctionComponent;
  icon_action?:()=>void;
  on_change?: (value: any, name: keyof T & string) => void;
  setErrorObject: React.Dispatch<React.SetStateAction<U>>;
  setFormObject: React.Dispatch<React.SetStateAction<T>>; 
}


export const FormTextFieldDefault = <T extends FormObject, U extends ErrorObject>({
  form_object,
  error_object,
  name,
  placeholder,
  label,
  description,
  className,
  field_classnames,
  input_type = "text",
  label_classname,
  icon,
  id,
  disabled,
  validators,
  contentEditable,
  suffix_icon,
  icon_action,
  on_change,
  setFormObject,
  setErrorObject,
}: FormFieldComponentPropsDefault<T, U>) => {
  // Function to update the form_object
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validate = validators[name as keyof U](value/*,form_object as {[x in keyof U]:any}*/);
    setFormObject(prev => ({ ...prev, [name as string]: value }));
    setErrorObject(prev => ({ ...prev, [name]: validate }));
    on_change?.(value, name);
  };


  const fieldValue = form_object[name as keyof T] as string | undefined;
  const error = error_object[name as keyof U] as string | undefined;

  return (
    <div className={cn(className)}>
      {label && <label htmlFor={id} className={label_classname}>{label}</label>}
      <div className="relative">
        <Input
          name={name}
          placeholder={placeholder}
          id={id}
          className={cn(field_classnames)}
          disabled={disabled}
          type={input_type}
          value={fieldValue !== undefined ? String(fieldValue) : ''}
          onChange={handleInputChange}
          contentEditable={contentEditable}
        />
        {icon}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

interface IRichText<T extends FormObject, U extends ErrorObject> extends FormFieldComponentPropsDefault<T, U> {
  ref?: React.RefObject<HTMLDivElement | null>
}


export const FormRichTextDefault = <T extends FormObject, U extends ErrorObject>({
  form_object,
  error_object,
  name,
  placeholder,
  label,
  description,
  className,
  field_classnames,
  label_classname,
  id,
  disabled,
  ref,
  validators,
  on_change,
  setFormObject,
  setErrorObject,
}: IRichText<T, U>) => {
  // Function to update the form_object
  const handleInputChange = (e: string[]) => {
    ///const value = e.target.value;
    const validate = validators[name as keyof U](e)
    setFormObject(prev => ({ ...prev, [name as string]: e }));
    setErrorObject(prev => ({ ...prev, [name]: validate }));
    on_change?.(e, name);
  };


  const fieldValue = form_object[name as keyof T];
  const error = error_object[name as keyof U];

  return (
    <div className={cn(className)}>
      {label && <label htmlFor={id} className={label_classname}>{label}</label>}
      <div className="relative">
        <LexicalTextEditor
          ref={ref}
          disable={disabled as boolean}
          name={name}
          id={id}
          fieldChange={handleInputChange}
          value={fieldValue ?? []}
          classNames={field_classnames}
          placeholder={placeholder}
        />
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

interface IFormUploadDefault<T extends FormObject, U extends ErrorObject> extends FormFieldComponentPropsDefault<T, U> {
  is_multiple: boolean;
  file_count?: number;
  size_limit?: number;
  extensions?: string[],
  ref?: React.RefObject<HTMLInputElement | null>
}

export const FormUploadDefault = <T extends FormObject, U extends ErrorObject>({
  form_object,
  error_object,
  name,
  extensions,
  label,
  description,
  className,
  size_limit,
  label_classname,
  id,
  file_count,
  validators,
  is_multiple,
  field_classnames,
  ref,
  on_change,
  setFormObject,
  setErrorObject,
}: IFormUploadDefault<T, U>) => {
  // Function to update the form_object
  const fieldChange = (e: any) => {
    const validate = validators[name as keyof U](e)
    setFormObject(prev => ({ ...prev, [name as string]: e }));
    setErrorObject(prev => ({ ...prev, [name]: validate }));
    on_change?.(e, name);
  }


  const fieldValue = form_object[name as keyof T] as string[];
  const error = error_object[name as keyof U] as string | undefined;

  return (
    <div className={cn(className)}>
      {label && <label htmlFor={id} className={label_classname}>{label}</label>}
      <div className={cn("relative", field_classnames)}>
        <FileUploader
          ref={ref}
          fieldChange={fieldChange}
          mediaUrl={fieldValue}
          size_limit={size_limit}
          extensions={extensions}
          is_multiple={is_multiple}
          file_count={file_count}
          name={name}
          id={id}
        />

      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export const FormTextareaComponentDefault = <T extends FormObject, U extends ErrorObject>({ form_object, error_object, validators, name, placeholder, field_classnames, label, description, className, label_classname, icon, id, disabled, on_change, setFormObject, setErrorObject, contentEditable }: FormFieldComponentPropsDefault<T, U>) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormObject(prev => ({ ...prev, [name]: e.target.value }));
    setErrorObject(prev => ({ ...prev, [name]: validators[name](e.target.value) }));
    on_change?.(e.target.value, name);
  }

  return (
    <div className={cn(className)}>
      {label && <label htmlFor={id} className={label_classname}>{label}</label>}
      <div className="relative">
        <Textarea
          placeholder={placeholder}
          id={id}
          name={name}
          disabled={disabled}
          className={cn(field_classnames)}
          value={form_object[name]}
          contentEditable={contentEditable}
          onChange={handleInputChange}
        />
        {icon && <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">{icon}</div>}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {error_object[name] && <p className="text-red-500 text-sm">{error_object[name]}</p>}
    </div>

  );
};

interface NumberComponentPropsDefault<T extends FormObject, U extends ErrorObject> extends FormFieldComponentPropsDefault<T, U> {
  is_integer: boolean;
  flag?: {
    allow_decimal?: boolean;
    allow_zero_start?: boolean;
    length_after_decimal?: number;
    add_if_empty?: boolean;
    total_length?: number;
    format_to_thousand?: boolean;
  },
  unformat?: boolean;
  extra_format?: {
    format: string | string[],
    space_character?: string
  }
}

export const FormNumberDefault = <T extends Record<string, any>, U extends Record<string, string | undefined>>({ name, placeholder, id, field_classnames, label, description, className, label_classname, disabled, on_change, is_integer, flag, setFormObject, form_object, error_object, setErrorObject, validators, contentEditable, unformat, extra_format,icon }: NumberComponentPropsDefault<T, U>) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validate = validators[name as keyof U](value/*,form_object as {[x in keyof U]:any}*/);
    let displayed_value = unformat ? value : is_integer ? NumberFormat.numbers_only(value, flag) : NumberFormat.thousands(value, flag);
    if (extra_format) {
      const { format, space_character } = extra_format;
      displayed_value = format_number_value(format, displayed_value, space_character);
    }
    setFormObject(prev => ({ ...prev, [name]: displayed_value }));
    setErrorObject(prev => ({ ...prev, [name]: validate }));
    on_change?.(displayed_value, name);
  }
  const fieldValue = form_object[name as keyof T] ? form_object[name as keyof T] : undefined;
  const error = error_object[name as keyof U] as string || undefined;
  return (
    <div className={cn(className)}>
      {label && <label htmlFor={id} className={label_classname}>{label}</label>}
      <div className="relative">
        <Input
          placeholder={placeholder}
          id={id}
          name={name}
          className={cn(field_classnames)}
          disabled={disabled}
          contentEditable={contentEditable}
          type={'text'}
          value={fieldValue !== undefined ? String(fieldValue) : ''}
          onChange={handleInputChange}
        />
        {icon}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

interface SelectPropsDefault<T extends FormObject, U extends ErrorObject> {
  name: keyof T & string;
  selects: { name: string, value: string }[];
  placeholder: string | undefined;
  form_object: T;
  error_object: U;
  validators: Record<keyof U, (value: any) => string>;
  set_form_object: React.Dispatch<React.SetStateAction<T>>;
  set_error_object: React.Dispatch<React.SetStateAction<U>>
  description?: string;
  label?: string;
  id?: string;
  className?: string;
  field_classnames?: string;
  on_change?: (value: any, name: keyof T & string) => void
  select_content_class_name?: string;
  label_classname?: string
}

export const FormSelectDefault = <T extends FormObject, U extends ErrorObject>({ name, id, placeholder, description, field_classnames, label, selects, className, on_change, select_content_class_name, validators, set_error_object, set_form_object, form_object, error_object, label_classname }: SelectPropsDefault<T, U>) => {


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof e == 'string' ? e : e.target.value;
    const validate = validators[name](value);
    //const displayed_value = is_integer ? NumberFormat.numbers_only(value,flag) : NumberFormat.thousands(value,flag);
    set_form_object(prev => ({ ...prev, [name]: value }));
    set_error_object(prev => ({ ...prev, [name]: validate }));
    on_change?.(value, name);
  }
  const fieldValue = form_object[name as keyof T] ? form_object[name as keyof T] : undefined;
  const error = error_object[name as keyof U] as string | undefined;


  return (
    <div className={cn(className)}>
      {label && (
        <label htmlFor={id} className={cn(label_classname)}>
          {label}
        </label>
      )}
      <div className="relative">
        <Select onValueChange={handleInputChange} name={name} value={fieldValue || ''}>
          <SelectTrigger className={cn(field_classnames)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className={cn(select_content_class_name ?? 'bg-gray-800 text-gray-100 border-amber-300/50')}>
            {selects.map((select) => (
              <SelectItem key={select.value} value={select.value}>
                {select.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

interface CheckboxProps<T extends FormObject, U extends ErrorObject> {
  name: keyof T & string;
  checks: { name: string, value: any }[];
  form_object: T;
  id?: string;
  error_object: U;
  set_form_object: React.Dispatch<React.SetStateAction<T>>;
  set_error_object: React.Dispatch<React.SetStateAction<U>>;
  description?: string;
  label?: string;
  checkbox_classnames?: string;
  checkbox_label_classnames?: string;
  validators: Validation<U>;
  className?: string;
  field_classnames?: string;
  label_classnames?: string;
  on_change?: (value: any, name: keyof T & string) => void;
}

export const FormCheckboxDefault = <T extends FormObject, U extends ErrorObject>({ form_object, error_object, name, id, description, label, label_classnames, checks, className, checkbox_classnames = 'data-[state=checked]:bg-white data-[state=checked]:text-black border-amber-300 dark:data-[state=checked]:bg-white data-[state=checked]:border-white', checkbox_label_classnames = "text-gray-100 ml-1", on_change, set_error_object, set_form_object, validators, field_classnames = "flex flex-row items-start space-x-4 space-y-4" }: CheckboxProps<T, U>) => {
  const id_value = id || name;
  const handleInputChange = (checked: boolean | CheckedState, value: any) => {
    const form = checked ? { ...form_object, [name]: [...form_object[name], value] } : { ...form_object, [name]: (form_object[name] as Array<any>).filter(e => e !== value) };
    set_form_object(form);
    set_error_object(prev => ({ ...prev, [name]: validators[name](form[name]) }));
    on_change?.(form_object[name], name);
  }
  return (
    <div className={cn(className)}>
      {label && (
        <label htmlFor={id_value} className={cn(label_classnames)}>
          {label}
        </label>
      )}
      <div className={cn(field_classnames)}>

        {checks.map((item) => {
          return (
            <label key={item.value} htmlFor={item.name} className="flex items-center cursor-pointer">
              <Checkbox
                name={name}
                key={item.value}
                id={item.name}
                className={cn(checkbox_classnames)}
                checked={(form_object[name] as Array<any>)?.includes(item.value)}
                onCheckedChange={(checked) => {
                  handleInputChange(checked, item.value);
                }}
              />
              <span className={cn(checkbox_label_classnames)}>{item.name}</span>
            </label>

          )
        })}

      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {error_object[name] && <p className="text-red-500 text-sm mt-2">{error_object[name]}</p>}
    </div>
  );
};

export const format_number_value = (format: string[] | string, number: string, space_character?: string) => {
  if (typeof format === 'string')
    format = format.split('');
  let returned: string = '';
  for (const element of format) {
    if (number.length < 1)
      break;
    const num = Number(element);
    if (Number.isInteger(num)) {
      returned += number.slice(0, num);
      number = number.slice(num);
    } else {
      returned += element;
    }
  }
  return space_character ? returned.replaceAll(space_character, ' ') : returned;
}