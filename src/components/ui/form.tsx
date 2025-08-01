"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  type Control,
  type FormState,
  type ControllerFieldState,
  type FieldError,
} from "react-hook-form";

import { cn } from "../../utils/cn";
import { Label } from "./label";

const Form = FormProvider;

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  render,
  control,
  name,
  ...props
}: ControllerProps<TFieldValues, TName>) => { 
    const _control = control as Control<TFieldValues>;

  return (
    <Controller
      control={_control}
      name={name}
      {...props}
      render={({ field, formState, fieldState }) => ( 
        <>
          {render({ 
            field: {
              ...field,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e),
              value: field.value,
              name: field.name,
              onBlur: field.onBlur,
              ref: field.ref,
            }, 
            formState,
            fieldState,
          })}
        </>
      )}
    />
  );
}; 
    
  


interface UseFormFieldResult<TFieldValues extends FieldValues = FieldValues> {
  error?: FieldError | undefined;
  formState: FormState<TFieldValues>;
  field: ControllerFieldState;
  name: FieldPath<TFieldValues>;
}

const FormFieldContext = React.createContext({name:''})

const useFormField = <TFieldValues extends FieldValues = FieldValues>(): UseFormFieldResult<TFieldValues> => {
  const context = useFormContext<TFieldValues>();

  if (!context) {
    throw new Error("useFormField must be used within a Form component.");
  }

  const { control, formState } = context;
  const name = React.useContext(FormFieldContext);

  const field = control.getFieldState(name.name as FieldPath<TFieldValues>, formState);

  return {
    error: field?.error,
    formState,
    field: control.getFieldState(name.name as FieldPath<TFieldValues>),
    name: name.name as FieldPath<TFieldValues>,
  };
};

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  children?: React.ReactNode;
}

const FormItemContext = React.createContext({id:''})

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const itemId = id || generatedId;

  return (
    <FormItemContext.Provider value={{id:itemId}}>
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {children}
        </div>
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

interface FormLabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  id?: string;
}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  FormLabelProps
>(({ className, id, ...props }, ref) => {
  const { error } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error?.message && "text-destructive", className)}
      htmlFor={`${id}-form-item`}
      {...props}
    /> 
  );
});
FormLabel.displayName = "FormLabel";

interface FormControlProps extends React.ComponentPropsWithoutRef<typeof Slot> {
  id?: string;
  children?: React.ReactNode;
}

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  FormControlProps
>(({ id, children, ...props }, ref) => {
  const { error } = useFormField();

  return (
    <Slot
      ref={ref}
      id={`${id}-form-item`}
      aria-describedby={!error?.message ? `${id}-form-item-description` : `${id}-form-item-message`}
      aria-invalid={!!error?.message}
      {...props}
    >
      {children}
    </Slot>
  );
});
FormControl.displayName = "FormControl";


interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  id?: string;
}

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(({ className, id, ...props }, ref) => {
  return (
    <p
      ref={ref}
      id={`${id}-form-item-description`}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  ); 
});
FormDescription.displayName = "FormDescription";

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  id?: string;
  children?: React.ReactNode;
}

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  FormMessageProps
>(({ className, children, id, ...props }, ref) => {
  const { error } = useFormField();
  const body = error?.message ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={`${id}-form-item-message`}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
    name:string;
    onBlur: React.FocusEventHandler<HTMLInputElement>;
    ref: React.Ref<HTMLInputElement>;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, value, name, onBlur, ...props }, refFromForward) => {
    return <input ref={refFromForward} onChange={onChange} value={value} name={name} onBlur={onBlur} {...props} />;
  }
);
Input.displayName = "Input";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  Input,
  FormFieldContext
};