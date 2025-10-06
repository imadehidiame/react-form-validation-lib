import { forwardRef, useEffect,useState,type ReactNode } from "react";
import { FormProvider, useForm, type FieldValues, type Path } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCheckboxComponent, FormFieldComponent, FormFileUploadComponent, FormNumberComponent, FormRichTextComponent, FormSelectComponent, FormTextareaComponent } from "./form-components";
import { useFormState,useSetCurrentFormState,useSetActionData } from './form-context';
import { fetch_request } from "../utils/form-api";


export interface FormActionData {
  error?: string;
  errors?: Record<string, string[] | string>;
  data?: unknown;
  message?: string;
}

export type FormType = 'text' | 'select' | 'textarea' | 'file' | 'multiple_file' | 'checkbox' | 'component' | 'rich_text' | 'float' | 'integer' | 'password';

export interface FormElement<T extends FieldValues> {
type: FormType;
name?: keyof T | number | string | symbol;
value?: string | number | File | any[] | null | undefined;
class_names?: string;
description?:string;
description_class_names?:string;
error_field_class_names?:string;
disabled?: boolean;
show_password_icon?:boolean;
field_class_names?: string;
label_class_names?: string;
label?: string;
form_state?:T;
set_form_state?:React.Dispatch<React.SetStateAction<T>>;
id?: string;
validation?: z.ZodType;
placeholder?: string;
size_limit?: number;
file_count?: number;
extensions?:string[];
selects?: { name: string; value: string }[];
checks?: { name: string; value: string }[];
component?: React.ReactNode;
refine?: (value: any) => boolean | { valid: boolean; error: string; path?: string };
insertion?:string;
flag?: {
  allow_decimal?: boolean;
  allow_zero_start?: boolean;
  length_after_decimal?: number;
  add_if_empty?: boolean;
  total_length?: number;
  format_to_thousand?: boolean;
  allow_negative_prefix?: boolean;
  extra_format?:{
    format:string|string[],
    space_character?:string
  }
};
}


interface CustomFormProps<T extends FieldValues> {
validate_values?: string[];
action:string;
method:'POST'|'PATCH';
is_json?:true;
is_clear_form?:boolean;
notify?: (error: string) => void;
pre_submit_action?: (values: z.infer<z.ZodObject<T>>) => Promise<z.infer<z.ZodObject<T>>|any> | z.infer<z.ZodObject<T>|any>;
load_animation?: () => void;
hide_animation?: () => void;
after_submit_action?: (message: string | any, data: any) => void;
class_names?: string;
redefine?:(value:z.infer<z.ZodObject<T>>) => {valid: boolean; error: string; path?: string};
children?: ReactNode;
validation_mode?:'onChange'|'onBlur'|'onTouched'|'onSubmit'|'all';
form_components: FormElement<T>[];
set_form_elements ?: React.Dispatch<React.SetStateAction<T[]>>;
on_change?: (name: keyof T | string, value: any) => void;
fetch_options?:Partial<{
  cache?:'default'|'force-cache'|'no-cache'|'no-store'|'only-if-cached'|'reload'
  credentials?:'include'|'omit'|'same-origin',
  integrity?:string,
  keepalive?:boolean,
  cors?:'cors'|'navigate'|'no-cors'|'same-origin',
  priority?:'auto'|'high'|'low',
  redirect?:'error'|'follow'|'manual',
  referrer?:string,
  referrerPolicy?:'no-referrer'|'no-referrer-when-downgrade'|'origin'|'origin-when-cross-origin'
  |'same-origin'|'strict-origin'|'strict-origin-when-cross-origin'|'unsafe-url',
  signal?:AbortSignal|null,
  window?:null
}>;
request_headers?:Record<string,string>;
}

export const FormWrapper = forwardRef<HTMLFormElement, CustomFormProps<any>>(
(
  {
    validate_values,
    notify, 
    action,
    method,
    is_json,
    is_clear_form,
    //submitForm,
    pre_submit_action,
    load_animation,
    hide_animation,
    set_form_elements,
    after_submit_action,
    on_change,
   // refine,
    redefine,
    form_components,
    validation_mode='onBlur',
    class_names,
    children,
    fetch_options,
    request_headers,
    ...formProps
  },
  ref
) => {
  const form_components_mod = form_components.filter(e => e && e.validation && e.validation !== undefined);
  const [schema, set_schema] = useState(() => {
    const baseSchema = z.object(form_components_mod.reduce((acc, { name, validation }) => ({ ...acc, [name!]: validation }), {}));
    const f_values = form_components_mod.reduce(
      (acc, { name, value }) => ({ ...acc, [name!]: value !== undefined ? value : '' }),
      {}
    );
    let result = redefine?.(f_values);
    
    return redefine 
      ? baseSchema.refine((data) => {
        let res = redefine(data)

          return res.valid
          
        },
        {message:redefine?.(f_values).error,path:[result?.path as string]}
      )
      : baseSchema;
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode:validation_mode,
    defaultValues: form_components_mod.reduce(
      (acc, { name, value }) => ({ ...acc, [name!]: value !== undefined ? value : '' }),
      {}
    ),
  });

  

  useEffect(() => {
    const form_components_mod = form_components.filter(e => e && e.validation && e.validation !== undefined);
    const new_schema = z.object(form_components_mod.reduce((acc, { name, validation }) => ({ ...acc, [name!]: validation }), {}));
    const f_values = form_components_mod.reduce((prev,{name,value})=>({...prev,[name!]:value !== undefined ? value : ''}),{});
    const res = redefine?.(f_values);
    
    const refined_schema = redefine 
      ? new_schema.refine((data) => {
          const {valid,error} = redefine?.(data);
          return valid;
          
        },{message:redefine?.(f_values).error,path:[res?.path as string]})
      : new_schema;
    set_schema(refined_schema);
    form.reset(
      f_values,
      { keepDirty: true, keepErrors: true, keepIsSubmitted: true, keepTouched: true }
    );
    form.control._options.resolver = zodResolver(refined_schema);
    
  }, [form_components, redefine, form]);

  function pick(elements: FormElement<FieldValues>[]) {
    let obj = {};
    elements.forEach(element => {
      const { name, validation } = element;
      if (name)
        obj = Object.assign({}, obj, { [name]: validation });
    });
    return obj;
  }

  function strip_field_props<T, U>(field_errors: T): Partial<Record<keyof T, U>> {
    const ret: Partial<Record<keyof T, U>> = {};
    const keys = Object.keys(field_errors ?? {}) as (keyof T)[];
    for (const key of keys) {
      const errors = field_errors[key] as U | undefined;
      if (errors)
        ret[key as keyof T] = errors;
    }
    return ret;
  }

  const navigation = useFormState();
  const setNavigation = useSetCurrentFormState();
  const setActionData = useSetActionData();
  
  // Handle navigation state
  useEffect(() => {
    if (navigation === "submit") {
      load_animation?.();
    } else {
      hide_animation?.();
    }
  }, [navigation, load_animation, hide_animation]);

  useEffect(() => {
    const errors = form.formState.errors;
    if (errors.root?.message && errors.root?.refinePath) {
      form.setError(errors.root.refinePath as any, { message: errors.root.message });
    }
  }, [form.formState.errors, form]);

  //Clear form
  function clear_form_data(){
    if(is_clear_form){
    set_form_elements?.((form)=>{
      return form.map(e=>(e.type === 'checkbox' || e.type === 'multiple_file' || e.type === 'file') ? {...e,value:[]} : (e.type === 'float' || e.type === 'integer' || e.type === 'text' || e.type === 'password' || e.type === 'select' || e.type === 'textarea' ) ? {...e,value:''} : (e.type === 'rich_text') ? {...e,insertion:''} : e );
    })
    }
  }

  // Handle form submission
  const handleFormSubmission = async (values: z.infer<typeof schema>) => {
    if(pre_submit_action){
      values = pre_submit_action(values);
      if(values instanceof Promise)
        values = await values;
    }
    setNavigation?.('submit');
    let submit_data:FormData|string;
    if(is_json){
      submit_data = JSON.stringify(values);
    }else{
      submit_data = new FormData();
      for (const key in values) {
        if (Object.prototype.hasOwnProperty.call(values, key)) {
          const element = values[key as keyof typeof values];
          submit_data.append(key,typeof element === 'string' ? element : JSON.stringify(element));
        }
      }
    }
    try {
      const {status,is_error,data} = await fetch_request<FormActionData>(method,action,submit_data
        ,is_json,undefined,undefined,fetch_options,request_headers);
      setNavigation?.('idle');
      if(is_error){
        if(status === 500){
          throw {message:data??'An error occured on the server',invalid:true};
        }
        else if(status === 404){
          throw {message:data??'Resource could not be found',invalid:true};
          
        }
        else{
          throw {message:data,invalid:true};
        }
        
      }else{
        
        let type_data = typeof data;
        const is_primitive_data = type_data === 'boolean' || type_data === 'string' || type_data === 'number';
        if(is_primitive_data){
          if(type_data === 'boolean' || type_data === 'number'){
            if(Boolean(data)){
              throw {message:'Form has been successfully submitted',data:true};
            }else{
              throw {message:'Some errors were encountered during form submission',invalid:true};
            }
          }else{
            throw {message: (data as string).trim().length > 1 ? data : 'Form has been successfully submitted',data:true};
          }
        }else{
          let dataa = data as FormActionData;
          const { errors, error, data:served_data, message } = dataa;  
          if(data === undefined && errors === undefined && error === undefined &&  message === undefined ){
            throw {message:'An invalid response was sent from the server',invalid:true};
          }else{

            if ((!errors && !error)) {
              //after_submit_action?.(message, data); 
              throw {message: message ? message : 'Form has been successfully submitted',data: data ? data : true};
            } else {
              if (errors) {
                if(validate_values && validate_values.length > 0){
                  const form_values = form.getValues();
                  Object.keys(form_values).forEach((key) => {
                  if (errors[key] && validate_values.includes(key)) {
                    form.setError(key as any, { message: typeof errors[key] === 'string' ? errors[key] : errors[key][0] });
                  }
                });
                }else{
                  const form_values = form.getValues();
                  Object.keys(form_values).forEach((key) => {
                  if (errors[key]) {
                    form.setError(key as any, { message: typeof errors[key] === 'string' ? errors[key] : errors[key][0] });
                  }
                });
                }
                
              }
              if (error) {
                throw {message: error,invalid:true};
              }
            }
            
          }       
        }

      }
    } catch (error) {
      setNavigation?.('idle');
      if(error instanceof Error){
        setActionData?.({
          error:'An error occured on the client'
        });
        setNavigation?.('idle');
      }else{
        const {message,invalid,data} = error as {message:string,data?:any,invalid?:boolean};
        if(invalid){
          notify?.(message);
          setActionData?.({
            error:message
          });
        }else{
          setActionData?.({
            data,
            message
          });
          after_submit_action?.(message,data);
          clear_form_data();
        }
      }
      
    }
  };
  return (
    
    <FormProvider {...form}>
      <form
        ref={ref}
        {...formProps}
        onSubmit={form.handleSubmit(handleFormSubmission)}
        className={class_names}
      >
        {form_components.map(({ id, name, placeholder, type, label, class_names, size_limit, file_count, extensions, selects, checks, component, field_class_names, label_class_names, flag, disabled,insertion,show_password_icon,description,description_class_names,error_field_class_names }) => {
          let ret_value;
          if (type === 'text' || type === 'password')
            ret_value = (
              <FormFieldComponent
                key={name as string}
                form={form}
                description={description}
                description_class_names={description_class_names}
                error_field_class_names={error_field_class_names}
                field_class_names={field_class_names}
                label={label}
                label_class_names={label_class_names}
                set_form_state={set_form_elements}
                disabled={disabled}
                class_names={class_names}
                name={name as Path<z.infer<typeof schema>>}
                input_type={type}
                is_password={type === 'password'}
                show_password_icon={show_password_icon}
                placeholder={placeholder}
                id={id ? id : name as string}
                on_change={(value) => {
                  on_change?.(name! as string, value);
                }}
              />
            );
          else if (type === 'textarea')
            ret_value = (
              <FormTextareaComponent
                key={name as string}
                form={form}
                field_class_names={field_class_names}
                class_names={class_names}
                description={description}
                description_class_names={description_class_names}
                error_field_class_names={error_field_class_names}
                disabled={disabled}
                label={label}
                label_class_names={label_class_names}
                set_form_state={set_form_elements}
                name={name as Path<z.infer<typeof schema>>}
                placeholder={placeholder}
                id={id ? id : name as string}
                on_change={(value) => {
                  on_change?.(name! as string, value);
                }}
              />
            );
          else if (type === 'component')
            ret_value = (<span key={name as string}>{component}</span>);
          else if (type === 'multiple_file')
            ret_value = (
              <FormFileUploadComponent
                key={name as string}
                form={form}
                set_form_state={set_form_elements}
                label_class_names={label_class_names}
                description={description}
                description_class_names={description_class_names}
                error_field_class_names={error_field_class_names}
                class_names={class_names}
                disabled={disabled}
                field_class_names={field_class_names}
                name={name as Path<z.infer<typeof schema>>}
                placeholder={placeholder}
                id={id ? id : name as string}
                label={label}
                extensions={extensions}
                size_limit={size_limit}
                file_count={file_count}
                is_multiple={true}
                on_change={(value) => {
                  on_change?.(name! as string, value);
                }}
              />
            );
          else if (type === 'rich_text')
            ret_value = (
              <FormRichTextComponent
                key={name as string}
                form={form}
                set_form_state={set_form_elements}
                disabled={disabled}
                class_names={class_names}
                field_class_names={field_class_names}
                insertion={insertion}
                description={description}
                description_class_names={description_class_names}
                error_field_class_names={error_field_class_names}
                name={name as Path<z.infer<typeof schema>>}
                placeholder={placeholder}
                label={label}
                label_class_names={label_class_names}
                on_change={(value) => {
                  on_change?.(name! as string, value);
                }}
              />
            );
          else if (type === 'float')
            ret_value = (
              <FormNumberComponent
                is_integer={false}
                set_form_state={set_form_elements}
                key={name as string}
                form={form}
                description={description}
                description_class_names={description_class_names}
                error_field_class_names={error_field_class_names}
                disabled={disabled}
                class_names={class_names}
                flag={flag}
                field_class_names={field_class_names}
                name={name as Path<z.infer<typeof schema>>}
                placeholder={placeholder}
                label={label}
                label_class_names={label_class_names}
                on_change={(value) => {
                  on_change?.(name! as string, value);
                }}
              />
            );
          else if (type === 'integer')
            ret_value = (
              <FormNumberComponent
                is_integer={true}
                flag={flag}
                set_form_state={set_form_elements}
                key={name as string}
                form={form}
                disabled={disabled}
                description={description}
                description_class_names={description_class_names}
                error_field_class_names={error_field_class_names}
                class_names={class_names}
                field_class_names={field_class_names}
                name={name as Path<z.infer<typeof schema>>}
                placeholder={placeholder}
                label={label}
                label_class_names={label_class_names}
                on_change={(value) => {
                  on_change?.(name! as string, value);
                }}
              />
            );
          else if (type === 'select')
            ret_value = (
              <FormSelectComponent
                key={name as string}
                form={form}
                set_form_state={set_form_elements}
                description={description}
                description_class_names={description_class_names}
                error_field_class_names={error_field_class_names}
                field_class_names={field_class_names}
                className={class_names}
                label_class_names={label_class_names}
                selects={selects!}
                label={label}
                name={name as Path<z.infer<typeof schema>>}
                placeholder={placeholder}
                on_change={(value) => {
                  on_change?.(name! as string, value);
                }}
              />
            );
          else if (type === 'checkbox')
            ret_value = (
              <FormCheckboxComponent
                key={name as string}
                form={form}
                set_form_state={set_form_elements}
                description={description}
                description_class_names={description_class_names}
                error_field_class_names={error_field_class_names}
                class_names={class_names}
                label_class_names={label_class_names}
                checks={checks!}
                label={label}
                name={name as Path<z.infer<typeof schema>>}
                on_change={(value) => {
                  on_change?.(name! as string, value);
                }}
              />
            );
          else
            ret_value = (
              <FormFileUploadComponent
                key={name as string}
                extensions={extensions}
                is_multiple={false}
                set_form_state={set_form_elements}
                file_count={1}
                disabled={disabled}
                form={form}
                description={description}
                description_class_names={description_class_names}
                error_field_class_names={error_field_class_names}
                field_class_names={field_class_names}
                class_names={class_names}
                name={name as Path<z.infer<typeof schema>>}
                placeholder={placeholder}
                id={id ? id : name as string}
                label={label}
                size_limit={size_limit}
                on_change={(value) => {
                  on_change?.(name! as string, value);
                }}
              />
            );

          return ret_value;
        })}
        {children}
      </form>
      </FormProvider>
  );
}
);

FormWrapper.displayName = "FormWrapper";

export class GenerateFormdata<T extends FieldValues> {
  
  private options:FormElement<T> = {
    type:'text',
  }
  set_type(type:FormType){
    this.options.type = type;
    return this; 
  }
  set_show_password_icon(show:boolean){
    this.options.show_password_icon = show;
    return this;
  }
  set_checks(checks:{name:string,value:string}[]){
    this.options.checks = checks;
    return this;
  }
  set_class_names(classnames:string){
    this.options.class_names = classnames;
    return this;
  }
  set_component(component:React.ReactNode){
    this.options.component = component;
    return this;
  }
  set_disabled(disabled:boolean){
    this.options.disabled = disabled;
    return this;
  }
  set_field_class_names(classnames:string){
    this.options.field_class_names = classnames;
    return this;
  }
  set_file_count(file_count:number){
    this.options.file_count = file_count;
    return this;
  }
  set_extensions(extensions:string[]){
    this.options.extensions = extensions;
    return this;
  }
  set_insertion(insertion:string){
    this.options.insertion = insertion;
    return this;
  }
  set_flag(flag:{
    allow_decimal?: boolean;
  allow_zero_start?: boolean;
  length_after_decimal?: number;
  add_if_empty?: boolean;
  total_length?: number;
  format_to_thousand?: boolean;
  allow_negative_prefix?: boolean;
  extra_format?: {
      format: string | string[];
      space_character?: string;
  }
  }){
    this.options.flag = flag;
    return this;
  }
  set_id(id:string){
    this.options.id = id;
    return this;
  }
  set_label(label:string){
    this.options.label = label;
    return this;
  }
  set_label_class_names(label_classnames:string){
    this.options.label_class_names = label_classnames;
    return this;
  }
  set_name(name:keyof T | number | string | symbol){
    this.options.name = name;
    return this;
  }
  set_placeholder(placeholder:string){
    this.options.placeholder = placeholder;
    return this;
  }
  set_description(description:string){
    this.options.description = description;
    return this;
  }
  set_description_class_names(description_class_names:string){
    this.options.description_class_names = description_class_names;
    return this;
  }
  set_error_field_class_names(error_field_class_names:string){
    this.options.error_field_class_names = error_field_class_names;
    return this;
  }
  set_refine(refine:(value:any)=>boolean|{
    valid: boolean;
    error: string;
    path?: string;
  }){
    this.options.refine = refine;
    return this;
  }
  set_selects(selects:{name:string,value:string}[]){
    this.options.selects = selects;
    return this;
  }
  set_size_limit(size_limit:number){
    this.options.size_limit = size_limit;
    return this;
  }
  set_validation(validation:z.ZodType){
    this.options.validation = validation;
    return this;
  }
  set_value(value:any){
    this.options.value = value;
    return this;
  }
  build():FormElement<T>{
    return this.options;
  }
}

export function get_form_data<T extends FieldValues>(
type: FormType,
name?: string | number | symbol,
value?: any,
validation?: z.ZodType,
label?: string,
placeholder?: string,
checks?: { name: string; value: string }[],
size_limit?: number,
file_count?: number,
selects?: { name: string; value: string }[],
classNames?: string,
field_classnames?: string,
component?: React.ReactNode,
disabled?: boolean,
label_classnames?: string,
flag?: {
  allow_decimal?: boolean;
  allow_zero_start?: boolean;
  length_after_decimal?: number;
  add_if_empty?: boolean;
  total_length?: number;
  format_to_thousand?: boolean;
  allow_negative_prefix?: boolean;
  extra_format?:{
    format:string|string[],
    space_character?:string
  }
},
refine?: (value: any) => boolean | { valid: boolean; error: string; path?: string },
form_state?:T,
set_form_state?:React.Dispatch<React.SetStateAction<T>>,
extensions?:string[],
insertion?:string,
description?:string,
description_class_names?:string,
error_field_class_names?:string,
) {
return {
  type,
  name,
  value,
  validation,
  label,
  placeholder,
  checks,
  size_limit,
  file_count,
  selects,
  classNames,
  field_classnames,
  component,
  disabled,
  label_classnames,
  flag,
  refine,
  form_state,
  set_form_state,
  extensions,
  insertion,
  description,
  description_class_names,
  error_field_class_names
};
}