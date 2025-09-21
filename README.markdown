# React Form Wrapper Component

A **highly configurable React form wrapper** built on top of [`react-hook-form`](https://react-hook-form.com/) and [`zod`](https://zod.dev/), with support for dynamic form elements, client-side validation, server response handling, and pre/post submission hooks, leveraging React 19 optimizations using the React Compiler. Check out more details on (https://react.dev/learn/react-compiler/introduction). Please check (https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler) for nextjs React Compiler configuration and refer to other react frameworks documentations for enabling this feature.


This component allows you to **generate complex forms dynamically** from configuration objects instead of hardcoding inputs, making it ideal for reusable, API-driven, and highly customizable forms.

---

## ✨ Features

- **Dynamic form generation** using a configuration array (`form_components`).
- **Built-in validation** with Zod schemas (`zodResolver`).
- **Supports multiple input types**:
  - Text, Password, Textarea
  - Select dropdown
  - Checkbox group
  - File upload (single/multiple)
  - Rich text editor
  - Number inputs (integer/float)
  - Custom components
- **Custom validation refinement** (`redefine` function).
- **Pre- and post-submit hooks** (`pre_submit_action`, `after_submit_action`).
- **Built-in loading and error handling**.
- **JSON or `FormData` submission modes**.
- **State persistence via Context API**.
- **Optional auto-clear form after submission**.

---

## 📦 Installation

```bash
npm install @imadehidiame/react-form-validation

```


🚀 Quick Start
```css
\* import the @imadehidiame/react-form-validation/dist/styles.css  file in your entry CSS file*\
@import '@imadehidiame/react-form-validation/dist/styles.css';
```

```tsx
'use client';
import { Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { GenerateFormdata, FormProvider, useActionData, useFormState, NumberFormat, FormWrapper } from '@imadehidiame/react-form-validation';
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";

const validation = z.object({
    password: z.string().nonempty({ message: 'Please enter a value for password' }),
    currency: z.string().nonempty({ message: 'Please select currency' }),
    amount: z.string().refine((value) => {
        return parseFloat((value).replaceAll(',', '')) >= 5000;
    }, 'Value must be greater than or equal to 5,000'),
    calculated: z.any(),
    integer: z.string().nonempty({ message: 'Please enter integer value' }).refine((value) => {
        return parseInt(value) <= 1000;
    }, { message: 'Value must be less than 1001' }),
    images: z.any().array().refine((files) => {
        return files.length > 0
    },{message:'Please upload at least one image'}),
    message: z.any().array(),
    phone_number: z.string().nonempty({ message: 'Enter a valid phone number' }).refine((value) => {
        return value.length === 19;
    }, 'Enter a valid phone number prefixed with "234"'),
    description: z.string().trim().nonempty({ message: 'Enter the description' }).min(5, { message: 'Descriptions should be at least 5 characters long' }),
    family: z.array(z.string()).refine((value) => {
        return value.length >= 5;
    }, { message: 'Please select at least 5 of my family members' })
});

interface LoadedData {
    loaderData?:z.infer<typeof validation>[]
}

interface ActionData {
    data?:any;
    message?:string;
    error?:string
}

export function FormTest({loaderData}:LoadedData) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    //useFormState() hook provides information about the form and is one of, submit or idle. 
    const navigation = useFormState();

    //useActionData() hook provides information about the response from server after form submission and is typed as ActionData above. "message" represents a string value acting as a success message. "data" acts any value probably returned from the server e.g a random ID generated after form submission. message and data values are usually passed to the after_submit_action() function. "error" is a string value that acts as an error message after a form submission and is passed to the notify() function.
    const action_data = useActionData<ActionData>();
    const is_submitting = navigation === 'submit';

    useEffect(()=>{
        //console.log('action data ',action_data);
    },[action_data]);

    useEffect(()=>{
        //console.log('Navigation change ',navigation);
    },[navigation]);
    
    const prices = {
        'btc': 109000,
        'eth': 4000
    }

    const { password, currency, calculated, amount, integer, images, message, phone_number, description, family } = validation.shape;

    const loader = loaderData && loaderData?.length > 0 ? loaderData[0] : undefined

    const [form_data, set_form_data] = loader ? useState<FormElement<any>[]>([

        (new GenerateFormdata).set_class_names('w-full').set_description('Your password').set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_label('Password').set_label_class_names('mb-4 text-amber-300').set_name('password').set_placeholder('Enter your assword').set_type('password').set_show_password_icon(true).set_validation(password).set_value(loader.password).build(),
        
        (new GenerateFormdata).set_class_names('w-full').set_description('Deposit Amount').set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_label('Depost ($)').set_label_class_names('mb-4 text-amber-300').set_name('amount').set_placeholder('Deposit amount').set_type('float').set_validation(amount).set_value(loader.amount).build(),

        (new GenerateFormdata).set_selects([
            {
                name: 'Select currency',
                value: 'null'
            },
            {
                name: 'Bitcoin',
                value: 'btc'
            },
            {
                name: 'Ethereum',
                value: 'eth'
            }
        ]).set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('w-full bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_id('currency').set_label('Currency').set_label_class_names('text-amber-300 mb-4').set_name('currency').set_placeholder('Select from available').set_type('select').set_value(loader.currency).set_validation(currency).build(),
        
        //You can use the NumberFormat class static methods to format a value while setting it when the form loads
        (new GenerateFormdata).set_description('Enter a value that will automatically get formatted as "+(123) 456 7890 123" for example').set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_id('phone_number').set_label('Phone Number').set_label_class_names('text-amber-300 mb-4').set_name('phone_number').set_placeholder('Enter phone number').set_type('integer').set_value( NumberFormat.numbers_only(loader.phone_number,{
            allow_decimal: false, allow_zero_start: false, format_to_thousand: false, extra_format: {
                format: '+(3)&3&4&3',
                space_character: '&'
            }
        })).set_validation(phone_number).set_flag({
            add_if_empty: false, allow_decimal: false, allow_zero_start: false, format_to_thousand: false, extra_format: {
                format: '+(3)&3&4&3',
                space_character: '&'
            }
        }).build(),

        (new GenerateFormdata).set_type('float').set_validation(calculated).set_class_names('w-full').set_disabled(true).set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_flag({ add_if_empty: false, allow_decimal: true, allow_zero_start: true, format_to_thousand: true, length_after_decimal: 2 }).set_id('calculated').set_label('Calculated Value').set_label_class_names('text-amber-300 mb-4').set_name('calculated').set_placeholder('Calculated value').set_value((parseFloat(loader.amount) / prices[loader.currency as keyof typeof prices]).toString()).build(),

        (new GenerateFormdata).set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_flag({ add_if_empty: false, allow_decimal: false, allow_zero_start: false, format_to_thousand: false }).set_id('integer').set_label('Integer Without "0" Prefix').set_label_class_names('text-amber-300 mb-4').set_name('integer').set_type('integer').set_validation(integer).set_value(loader.integer).build(),

        (new GenerateFormdata).set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('w-full bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_file_count(3).set_id('images').set_label('Images').set_label_class_names('text-amber-300').set_name('images').set_size_limit(1000).set_type('multiple_file').set_validation(images).set_value(loader.images).set_extensions(['png', 'jpg', 'jpeg', 'svg', 'webp']).build(),

        (new GenerateFormdata).set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_id('message').set_label('Message').set_label_class_names('mb-4 text-amber-300').set_name('message').set_placeholder('Enter your message').set_type('rich_text').set_insertion(loader.message[0]).set_validation(message).set_value([]).build(),

        (new GenerateFormdata).set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_id('description').set_label('Description').set_label_class_names('mb-4 text-amber-300').set_name('description').set_name('description').set_placeholder('Description').set_type('textarea').set_validation(description).set_value(loader.description).build(),

        (new GenerateFormdata).set_class_names('w-full').set_checks([
            {
                name: 'React Router v 7',
                value: 'rrv7'
            },
            {
                name: 'Remixjs',
                value: 'remixjs'
            },
            {
                name: 'Nextjs',
                value: 'nextjs'
            },
            {
                name: 'VueJS',
                value: 'vuejs'
            },
            {
                name: 'React',
                value: 'react'
            },
            {
                name: 'Nodejs',
                value: 'nodejs'
            },
            {
                name: 'Expo',
                value: 'expo'
            },
            {
                name: 'React Native',
                value: 'reactnative'
            },
            {
                name: 'Flutter',
                value: 'flutter'
            },
            {
                name: 'Laravel',
                value: 'laravel'
            }
        ]).set_disabled(is_submitting).set_field_class_names('flex flex-row items-start space-x-4 space-y-0 mt-2 flex-wrap').set_id('family').set_label('Family Members').set_label_class_names('mb-4 text-amber-300').set_name('family').set_type('checkbox').set_validation(family).set_value(loader.family).build()
    ])  : useState<FormElement<any>[]>([
        (new GenerateFormdata).set_class_names('w-full').set_description('Your password').set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_label('Password').set_label_class_names('mb-4 text-amber-300').set_name('password').set_placeholder('Enter your assword').set_type('password').set_show_password_icon(true).set_validation(password).set_value('').build(),
        
        (new GenerateFormdata).set_class_names('w-full').set_description('Deposit Amount').set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_label('Depost ($)').set_label_class_names('mb-4 text-amber-300').set_name('amount').set_placeholder('Deposit amount').set_type('float').set_validation(amount).set_value('').build(),

        (new GenerateFormdata).set_selects([
            {
                name: 'Select currency',
                value: 'null'
            },
            {
                name: 'Bitcoin',
                value: 'btc'
            },
            {
                name: 'Ethereum',
                value: 'eth'
            }
        ]).set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('w-full bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_id('currency').set_label('Currency').set_label_class_names('text-amber-300 mb-4').set_name('currency').set_placeholder('Select from available').set_type('select').set_value('').set_validation(currency).build(),

        
        (new GenerateFormdata).set_class_names('w-full').set_description('Enter a value that will automatically get formatted as "+(123) 456 7890 123" for example').set_disabled(is_submitting).set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_id('phone_number').set_label('Phone Number').set_label_class_names('text-amber-300 mb-4').set_name('phone_number').set_placeholder('Enter phone number').set_type('integer').set_value( NumberFormat.numbers_only('2348143944672',{
            allow_decimal: false, allow_zero_start: false, format_to_thousand: false, extra_format: {
                format: '+(3)&3&4&3',
                space_character: '&'
            }
        })).set_validation(phone_number).set_flag({
            add_if_empty: false, allow_decimal: false, allow_zero_start: false, format_to_thousand: false, extra_format: {
                format: '+(3)&3&4&3',
                space_character: '&'
            }
        }).build(),

        (new GenerateFormdata).set_type('float').set_validation(calculated).set_class_names('w-full').set_disabled(true).set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_flag({ add_if_empty: false, allow_decimal: true, allow_zero_start: true, format_to_thousand: true, length_after_decimal: 2 }).set_id('calculated').set_label('Calculated Value').set_label_class_names('text-amber-300 mb-4').set_name('calculated').set_placeholder('Calculated value').set_value('').build(),

        (new GenerateFormdata).set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_flag({ add_if_empty: false, allow_decimal: false, allow_zero_start: false, format_to_thousand: false }).set_id('integer').set_label('Integer Without "0" Prefix').set_label_class_names('text-amber-300 mb-4').set_name('integer').set_type('integer').set_validation(integer).set_value('').build(),

        (new GenerateFormdata).set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('w-full bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_file_count(3).set_id('images').set_label('Images').set_label_class_names('text-amber-300').set_name('images').set_size_limit(1000).set_type('multiple_file').set_validation(images).set_value([]).set_extensions(['png', 'jpg', 'jpeg', 'svg', 'webp']).build(),

        (new GenerateFormdata).set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_id('message').set_label('Message').set_label_class_names('mb-4 text-amber-300').set_name('message').set_placeholder('Enter your message').set_type('rich_text')/*.set_insertion('Hello rich text. Happy to be here')*/.set_validation(message).set_value([]).build(),

        (new GenerateFormdata).set_class_names('w-full').set_disabled(is_submitting).set_field_class_names('bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5').set_id('description').set_label('Description').set_label_class_names('mb-4 text-amber-300').set_name('description').set_name('description').set_placeholder('Description').set_type('textarea').set_validation(description).set_value('').build(),

        (new GenerateFormdata).set_class_names('w-full').set_checks([
            {
                name: 'React Router v 7',
                value: 'rrv7'
            },
            {
                name: 'Remixjs',
                value: 'remixjs'
            },
            {
                name: 'Nextjs',
                value: 'nextjs'
            },
            {
                name: 'VueJS',
                value: 'vuejs'
            },
            {
                name: 'React',
                value: 'react'
            },
            {
                name: 'Nodejs',
                value: 'nodejs'
            },
            {
                name: 'Expo',
                value: 'expo'
            },
            {
                name: 'React Native',
                value: 'reactnative'
            },
            {
                name: 'Flutter',
                value: 'flutter'
            },
            {
                name: 'Laravel',
                value: 'laravel'
            }
        ]).set_disabled(is_submitting).set_field_class_names('flex flex-row items-start space-x-4 space-y-0 mt-2 flex-wrap').set_id('family').set_label('Family Members').set_label_class_names('mb-4 text-amber-300').set_name('family').set_type('checkbox').set_validation(family).set_value(['remixjs','rrv7']).build()
    ])   ;

    const on_change = (name:string|number|symbol,value: any) => {
        if (name === 'amount') {
            if (value) {
                const {value:other_value} = form_data.find(e=>e.name === 'currency')!;
                if (other_value) {
                    //const calc = parseFloat((value as string).replaceAll(',', '')) / prices[other_value as keyof typeof prices];
                    set_form_data(prev=>prev.map(e => e.name === 'calculated' ? ({...e,value:(parseFloat((value as string).replaceAll(',', '')) / prices[other_value as keyof typeof prices]).toString()}) : e));
                    //set_form_object(prev => ({ ...prev, calculated: (parseFloat((value as string).replaceAll(',', '')) / prices[form_object.currency as keyof typeof prices]).toString() }));
                } else {
                    set_form_data(prev=>prev.map(e => e.name === 'calculated' ? ({...e,value:''}) : e));
                }
            } else {
                set_form_data(prev=>prev.map(e => e.name === 'calculated' ? ({...e,value:''}) : e));
                //set_form_object(prev => ({ ...prev, calculated: '' }));
            }

        } else if (name === 'currency') {
            if (value && (value == 'eth' || value == 'btc')) {
                const {value:other_value} = form_data.find(e=>e.name === 'amount')!;
                if (other_value) {
                    set_form_data(prev=>prev.map(e => e.name === 'calculated' ? ({...e,value:(parseFloat((other_value as string).replaceAll(',', '')) / prices[value as keyof typeof prices]).toString()}) : e));
                } else {
                    set_form_data(prev=>prev.map(e => e.name === 'calculated' ? ({...e,value:''}) : e));
                }
            } else {
                set_form_data(prev=>prev.map(e => e.name === 'calculated' ? ({...e,value:''}) : e));
            }
        }
    }
    
    const submit_form = async () => {

    }
    const form_values_ = form_data.reduce((prev,{name,value})=>{
        return {...prev,[name as string]:value}
    },{}) 
    
    const is_form_valid = validation.safeParse(form_values_)
    

    return (
        
        <Card className="bg-gray-800 py-4 px-2 w-full border border-amber-300/50">
            <CardHeader className="max-sm:p-2">
                <CardTitle className="text-lg font-bold text-amber-300">Kickstart your journey</CardTitle>
                <p className="text-sm text-gray-400">Make a deposit</p>
            </CardHeader>
            <CardContent className="max-sm:p-2">
              <FormProvider>
                <FormWrapper
                    action="/api/test-form"
                    is_json={true}
                    is_clear_form={true}
                    validation_mode="onChange"
                    on_change={on_change}
                    pre_submit_action={async (value)=>{
                        return value;
                    }}
                    method="POST"
                    form_components={form_data}
                    notify={(error)=>{
                        alert(error);
                    }}
                    fetch_options={{credentials:'include'}}
                    request_headers={{'X-CSRF-TOKEN':'csrf_request_token_header'}}
                    validationMode="onChange"
                    set_form_elements={set_form_data}
                    class_names="space-y-1 p-0 flex flex-wrap gap-4 items-center mb-12"
                    validate_values={[]}
                    after_submit_action={(message,data) => {
                        console.log('message ',message);
                        console.log('data ', data);
                    }}
                >
                    <Button
                        type="button"
                        variant="outline"
                        className="ml-auto bg-transparent border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-gray-900 cursor-pointer text-sm py-2 h-9"
                        disabled={!is_form_valid}
                        onClick={async ()=>{
                            
                        }}
                    >
                        {is_submitting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                        {is_submitting ? 'Processing Data' : 'Generate'}
                    </Button>
                    <Button
                        variant="outline"
                        className="ml-auto bg-transparent border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-gray-900 cursor-pointer text-sm py-2 h-9"
                        //disabled={!(is_form_valid.success)}
                        disabled={is_submitting}
                        onClick={submit_form}
                    >
                        {is_submitting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                        {is_submitting ? 'Processing Deposit' : 'Deposit'}
                    </Button>

                </FormWrapper>
            </FormProvider>

            </CardContent>
        </Card>
        
    );
}
```

🛠 API Reference
<FormWrapper /> Props


| Prop                                | Type                                                            | Required | Default    | Description                                           |
| ----------------------------------- | --------------------------------------------------------------- | -------- | ---------- | ----------------------------------------------------- |
| `form_components`                   | `FormElement[]`                                                 | ✅        | —          | Array of form field configuration objects.            |
| `set_form_elements`                 | `Dispatch<SetStateAction<FormElement[]>>`                       | ✅        | —          | State setter to update `form_components` dynamically. |
| `action`                            | `string`                                                        | ✅        | —          | API endpoint to submit the form data.                 |
| `method`                            | `'POST' \| 'PATCH'`                                             | ✅        | —          | HTTP method for submission.                           |
| `is_json`                           | `boolean`                                                       | ❌        | `false`    | Whether to send data as JSON or `FormData`.           |
| `fetch_options`                     | `Partial<Record<string,any>>`                                   | ❌        | -          | Valid record of fetch request options e.g credentials, cors,etc.           |
| `request_headers`                   | `<Record<string,string>`                                        | ❌        | -          | Request headers to send alongside the request           |
| `is_clear_form`                     | `boolean`                                                       | ❌        | `false`    | Whether to reset form after successful submission.    |
| `notify`                            | `(error: string) => void`                                       | ❌        | —          | Called on validation or submission errors.            |
| `pre_submit_action`                 | `(values) => values \| Promise<values>`                         | ❌        | —          | Function to modify form values before submission.     |
| `after_submit_action`               | `(message, data) => void`                                       | ❌        | —          | Called after successful submission.                   |
| `load_animation` / `hide_animation` | `() => void`                                                    | ❌        | —          | Hooks for triggering loading indicators.              |
| `redefine`                          | `(values) => { valid: boolean; error: string; path?: string; }` | ❌        | —          | Adds custom refinement validation to the Zod schema.  |
| `validation_mode`                   | `'onChange' \| 'onBlur' \| 'onTouched' \| 'onSubmit' \| 'all'`  | ❌        | `'onBlur'` | React Hook Form validation mode.                      |
| `on_change`                         | `(name: string, value: any) => void`                            | ❌        | —          | Called whenever a form field changes.                 |
| `children`                          | `ReactNode`                                                     | ❌        | —          | Custom JSX inside the `<form>`.                       |
| `class_names`                       | `string`                                                        | ❌        | —          | Form-level CSS classes.                               |



FormElement Interface

Each element in form_components follows and is set using the GenerateFormData object as shown above. Please call build() after setting all the props as shown above

```tsx
interface FormElement<T extends FieldValues> {
type: FormType;
name?: keyof T | number | string | symbol;
value?: string | number | File | any[] | null | undefined;
class_names?: string;
description?:string;
description_class_names?:string;
error_field_class_names?:string;
disabled?: boolean;
field_class_names?: string;
label_class_names?: string;
label?: string;
form_state?:T;
set_form_state?:React.Dispatch<React.SetStateAction<T>>;
id?: string;
validation?: z.ZodType;
placeholder?: string;
show_password_icon?:boolean;
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
```

🏗 Creating Form Elements

You use GenerateFormdata builder to create form components

```tsx
import { GenerateFormdata } from "@imadehidiame/react-form-validation";
import { z } from "zod";

const usernameField = new GenerateFormdata()
  .set_type("text")
  .set_name("username")
  .set_label("Username")
  .set_placeholder("Enter username")
  .set_validation(z.string().min(3))
  .build();
```


🔄 Handling Validation

Validation is powered by Zod:

import { z } from "zod";
```tsx
const passwordField = new GenerateFormdata()
  .set_type("password")
  .set_name("password")
  .set_label("Password")
  .set_validation(z.string().min(6, "Password too short"))
  .build();
```
---

## ✨ Form Submission


📡 Submission Flow

On submit:

Values pass Zod validation.

pre_submit_action runs if provided.

Form data is sent via fetch_request.

If server responds with validation errors, fields are updated accordingly.

If successful:

after_submit_action runs.

Form optionally clears if is_clear_form is set to true.




User submits form → handleFormSubmission runs.

If provided, pre_submit_action(values) runs before sending data and if it is given, it should return the data to be submitted to the server;

navigation state is set to "submit" and this value is usually is provided by the useFormState() hook. This can be used to display a loading to visually tell the user the form is submitting

Payload preparation:

If is_json → JSON.stringify(values)

Else → FormData with all values stringified.


5️⃣ Response Handling

If server returns error:

Errors → Notify with a default message passed to the notify(). Or handle it in your code by using the "error" value of the useActionData() hook

Validation errors:

If validate_values is set, only those fields are updated.

Otherwise, all fields in errors are updated in form state via form.setError.

If server returns without errors:

Calls after_submit_action if provided and passes the "data" and "message" values of the useActionData() hook

Optionally clears form is_clear_form prop is set to true.

## License
MIT