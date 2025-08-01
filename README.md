# @imadehidiame/react-form-validation

A React form validation component leveraging React 19 optimizations, React Hook Form, Zod, and Tailwind CSS.

## Installation

```bash
npm install @imadehidiame/react-form-validation react-hook-form zod
```

## Usage


Wrap your form with FormProvider to provide context to FormWrapper. Below is an example demonstrating dynamic form fields, validation, and submission:

```jsx
import { FormProvider, FormWrapper, get_form_data, GenerateFormdata } from '@imadehidiame/react-form-validation';
import 'node_modules/@imadehidiame/react-form-validation/dist/styles.css';
import { z } from 'zod';
import { Button } from '@radix-ui/react-slot'; // Replace with your UI library
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const validation = z.object({
  password: z.string().nonempty({ message: 'Please enter a password' }),
  currency: z.string().nonempty({ message: 'Please select a currency' }),
  amount: z.string().refine((value) => parseFloat(value.replaceAll(',', '')) >= 5000, {
    message: 'Amount must be at least 5,000',
  }),
});

function FormTest() {
  const [form_data, set_form_data] = useState([
    get_form_data('password', 'password', '', validation.shape.password, 'Password', 'Enter your password', undefined, undefined, undefined, undefined, 'w-full', 'bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5', undefined, false, 'mb-4 text-amber-300'),
    get_form_data('float', 'amount', '', validation.shape.amount, 'Deposit ($)', 'Deposit amount', undefined, undefined, undefined, undefined, 'w-full', 'bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5', undefined, false, 'mb-4 text-amber-300'),
    new GenerateFormdata()
      .set_selects([
        { name: 'Select currency', value: 'null' },
        { name: 'Bitcoin', value: 'btc' },
        { name: 'Ethereum', value: 'eth' },
      ])
      .set_classnames('w-full')
      .set_field_classnames('w-full bg-gray-700 border-gray-600 text-white focus-visible:ring-amber-300 mt-2.5')
      .set_id('currency')
      .set_label('Currency')
      .set_label_classnames('text-amber-300 mb-4')
      .set_name('currency')
      .set_placeholder('Select from available')
      .set_type('select')
      .set_value('')
      .set_validation(validation.shape.currency)
      .build(),
  ]);

  const is_form_valid = validation.safeParse(
    form_data.reduce((prev, { name, value }) => ({ ...prev, [name]: value }), {})
  );

  return (
    <FormProvider>
      <FormWrapper
        action="/api/test-form"
        is_json={true}
        validationMode="onChange"
        method="POST"
        form_components={form_data}
        submitForm={(form_values) => console.log('Submitted:', form_values)}
        notify={(error) => alert(error)}
        set_form_elements={set_form_data}
        className="space-y-1 p-0 flex flex-wrap gap-4 items-center mb-12"
        validateValues={[]}
        afterSubmitAction={(message, data) => {
          console.log('Message:', message);
          console.log('Data:', data);
        }}
      >
        <Button
          type="button"
          variant="outline"
          className="ml-auto bg-transparent border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-gray-900 cursor-pointer text-sm py-2 h-9"
          disabled={!is_form_valid.success}
        >
          Generate
        </Button>
        <Button
          variant="outline"
          className="ml-auto bg-transparent border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-gray-900 cursor-pointer text-sm py-2 h-9"
          disabled={false}
        >
          <Loader2 className="animate-spin w-4 h-4 mr-2" />
          Deposit
        </Button>
      </FormWrapper>
    </FormProvider>
  );
}

export default FormTest;

```

## Requirements

- **React 19**: Requires `react@^19.0.0` and `react-dom@^19.0.0` for automatic memoization and other optimizations.
- **React Hook Form**: Install `react-hook-form@^7.57.0` for form management.
- **Zod**: Install `zod@^3.24.2` for schema validation.
- **Tailwind CSS**: Include the bundled `dist/styles.css` or configure Tailwind in your project: [Tailwind CSS Installation](https://tailwindcss.com/docs/installation).


## Props for FormWrapper

- **action**: Form submission URL. [Required]
**is_json**: Send form data as JSON (default: false). [Required]
**validationMode**: Validation trigger (onChange, onBlur, onSubmit). [Optional]
**preSubmitAction**: Async or sync function to process data before submission that is called with the form components as an array. [Optional]
**method**: HTTP method (POST | PATCH).[Required]
**form_components**: Array of form field definitions (use get_form_data or GenerateFormdata) [Required]
**submitForm**: Callback for successful submission.[Optional]
**notify**: Error notification callback.[Required]
**set_form_elements**: Function to update form components.[Required]
**className**: Additional CSS classes.[Optional]
**validateValues**: Array of Field names to display error messages underneath after a form submission to and from the server if there's a need to [optional]. Leave an empty array to validate every form component or list the field names you'd like to display an error underneath after a form submission if there is a need to 
**afterSubmitAction**: Callback after submission.[Optional]

## License
MIT