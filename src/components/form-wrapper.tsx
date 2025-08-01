import { forwardRef, useEffect,useState,type ReactNode } from "react";
import { FormProvider, useForm, type FieldValues, type Path } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCheckboxComponent, FormFieldComponent, FormFileUploadComponent, FormNumberComponent, FormRichTextComponent, FormSelectComponent, FormTextareaComponent } from "./form-components";
import { useFormState,useSetCurrentFormState,useActionData,useSetActionData } from './form-context';
import { fetch_request } from "../utils/form-api";


interface ActionData {
  data: {
    logged?: boolean;
    error?: string;
    errors?: Record<string, string[] | string>;
    data?: unknown;
    message?: string;
  };
}

interface FormActionData {
    logged?: boolean;
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
  classNames?: string;
  disabled?: boolean;
  field_classnames?: string;
  label_classnames?: string;
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


interface CustomFormProps<T extends FieldValues> /*extends FormProps*/ {
  validateValues?: string[];
  action:string;
  method:'POST'|'PATCH';
  is_json?:true,
  notify?: (error: string) => void;
  submitForm: (values: z.infer<z.ZodObject<T>> | any) => Promise<void> | void ;
  preSubmitAction?: (values: z.infer<z.ZodObject<T>>) => Promise<z.infer<z.ZodObject<T>>> | z.infer<z.ZodObject<T>>;
  loadAnimation?: () => void;
  hideAnimation?: () => void;
  afterSubmitAction?: (message: string | any, data: any) => void;
  className?: string;
  refine?: (value: any) => boolean | { valid: boolean; error: string; path?: string };
  redefine?:(value:z.infer<z.ZodObject<T>>) => {valid: boolean; error: string; path?: string}
  children?: ReactNode;
  validationMode?:'onChange'|'onBlur'|'onTouched'|'onSubmit'|'all',
  form_components: FormElement<T>[];
  set_form_elements ?: React.Dispatch<React.SetStateAction<T[]>>;
  on_change?: (name: keyof T | string, value: any) => void;
}

export const FormWrapper = forwardRef<HTMLFormElement, CustomFormProps<any>>(
  (
    {
      validateValues,
      notify, 
      action,
      method,
      is_json,
      submitForm,
      preSubmitAction,
      loadAnimation,
      hideAnimation,
      set_form_elements,
      afterSubmitAction,
      on_change,
      refine,
      redefine,
      form_components,
      validationMode='onBlur',
      className,
      children,
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
      mode:validationMode,
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
    const actionData = useActionData<FormActionData>();
    const setNavigation = useSetCurrentFormState();
    const setActionData = useSetActionData();
    
    // Handle navigation state
    useEffect(() => {
      if (navigation === "submit") {
        loadAnimation?.();
      } else {
        hideAnimation?.();
      }
    }, [navigation, loadAnimation, hideAnimation]);

    
    useEffect(() => {
      if (navigation === "idle" && actionData) {
        console.log('Action data ',actionData);
        const { errors, error, data, message, logged } = actionData;
        if ((!errors && !error)) {
          afterSubmitAction?.(message, data); 
        } else {
          if (errors) {
            if(validateValues && validateValues.length > 0){
              const form_values = form.getValues();
              Object.keys(form_values).forEach((key) => {
              if (errors[key] && validateValues.includes(key)) {
                form.setError(key as keyof typeof form_values, { message: typeof errors[key] === 'string' ? errors[key] : errors[key][0] });
              }
            });
            }else{
              const form_values = form.getValues();
              Object.keys(form_values).forEach((key) => {
              if (errors[key]) {
                form.setError(key as keyof typeof form_values, { message: typeof errors[key] === 'string' ? errors[key] : errors[key][0] });
              }
            });
            }
            
          }
          if (error) {
            notify ? notify(error) : null;
          }
        }
      }
    }, [navigation, actionData]);

   
    useEffect(() => {
      const errors = form.formState.errors;
      if (errors.root?.message && errors.root?.refinePath) {
        form.setError(errors.root.refinePath as any, { message: errors.root.message });
      }
    }, [form.formState.errors, form]);


    // Handle form submission
    const handleFormSubmission = async (values: z.infer<typeof schema>) => {
      if(preSubmitAction){
        values = preSubmitAction(values);
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
        const {status,is_error,data} = await fetch_request<FormActionData>(method,action,submit_data,is_json);
        setNavigation?.('idle');
        if(is_error){
          if(status === 500){
            setActionData?.({
                error: data ? data : 'An error occured on the server'
            })
          }else{
            setActionData?.({
              error:data
            })
          }
          /*switch (fetched.status) {
            case 500:
              setActionData?.({
                //data:{
                  error:'An error occured on the server'
                //}
              })
              break;
            case 404:
              setActionData?.({
                data:{
                  error:'Resource could not be found'
                }
              })
              break;
              case 403:
                setActionData?.({
                  data:{
                    error:'Access to resource denied'
                  }
                })
              break;
            default:
                setActionData?.({
                  data:{
                    error:'An unknown error occured'
                  }
                })
              break;
          }*/
        }else{
          const { data:served_data, message,error,errors } = data;
          //console.log('Fetched data');
          //console.log(fetched);
          setActionData?.({
              data:served_data,
              message,
              error,
              errors
          })
          //afterSubmitAction?.(message,served_data);  
        }
      } catch (error) {
        console.log(error);
        setActionData?.({
          error:'An error occured on the client'
      })
        setNavigation?.('idle');
      }
      //await submitForm(values);
    };

    

    return (
      
      <FormProvider {...form}>
        <form
          ref={ref}
          {...formProps}
          onSubmit={form.handleSubmit(handleFormSubmission)}
          className={className}
        >
          {form_components.map(({ id, name, placeholder, type, label, classNames, size_limit, file_count, extensions, selects, checks, component, field_classnames, label_classnames, flag, disabled,insertion}) => {
            let ret_value;
            if (type === 'text' || type === 'password')
              ret_value = (
                <FormFieldComponent
                  key={name as string}
                  form={form}
                  field_classnames={field_classnames}
                  label={label}
                  label_classname={label_classnames}
                  set_form_state={set_form_elements}
                  disabled={disabled}
                  className={classNames}
                  name={name as Path<z.infer<typeof schema>>}
                  input_type={type}
                  is_password={type === 'password'}
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
                  field_classnames={field_classnames}
                  className={classNames}
                  disabled={disabled}
                  label={label}
                  label_classname={label_classnames}
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
                  label_classname={label_classnames}
                  className={classNames}
                  disabled={disabled}
                  field_classnames={field_classnames}
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
                  className={classNames}
                  field_classnames={field_classnames}
                  insertion={insertion}
                  name={name as Path<z.infer<typeof schema>>}
                  placeholder={placeholder}
                  label={label}
                  label_classname={label_classnames}
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
                  disabled={disabled}
                  className={classNames}
                  flag={flag}
                  field_classnames={field_classnames}
                  name={name as Path<z.infer<typeof schema>>}
                  placeholder={placeholder}
                  label={label}
                  label_classname={label_classnames}
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
                  className={classNames}
                  field_classnames={field_classnames}
                  name={name as Path<z.infer<typeof schema>>}
                  placeholder={placeholder}
                  label={label}
                  label_classname={label_classnames}
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
                  field_classnames={field_classnames}
                  className={classNames}
                  label_classnames={label_classnames}
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
                  className={classNames}
                  label_classnames={label_classnames}
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
                  //set_form_state={set_fo}
                  extensions={extensions}
                  is_multiple={false}
                  set_form_state={set_form_elements}
                  file_count={1}
                  disabled={disabled}
                  form={form}
                  field_classnames={field_classnames}
                  className={classNames}
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
    set_checks(checks:{name:string,value:string}[]){
      this.options.checks = checks;
      return this;
    }
    set_classnames(classnames:string){
      this.options.classNames = classnames;
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
    set_field_classnames(classnames:string){
      this.options.field_classnames = classnames;
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
    set_label_classnames(label_classnames:string){
      this.options.label_classnames = label_classnames;
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
  insertion?:string
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
    insertion
  };
}

