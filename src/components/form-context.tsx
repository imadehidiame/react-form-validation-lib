'use client';
import { createContext, SetStateAction, useContext, useState, Dispatch, FC, ReactNode } from "react";

type state = 'idle' | 'submit';

export const CurrentFormState = createContext<state>('idle');
export const SetCurrentFormState = createContext<Dispatch<SetStateAction<state>>|null>(null);
const ActionData = createContext<any>(null);
const SetActionData = createContext<Dispatch<SetStateAction<any>>|null>(null);

export function useFormState(){
    return useContext(CurrentFormState);
} 

export function useActionData<T>(){
    return useContext<T>(ActionData);
}

export function useSetCurrentFormState(){
    return useContext(SetCurrentFormState);
}

export function useSetActionData(){
    return useContext(SetActionData);
}

export const FormProvider:FC<{children:ReactNode}> = ({children})=>{
    const [form_state,set_form_state] = useState<state>('idle');
    const [action_data,set_action_data] = useState();
    return <CurrentFormState value={form_state}>
             <ActionData value={action_data}>
                <SetActionData value={set_action_data}>
                    <SetCurrentFormState value={set_form_state}>
                        {children}
                    </SetCurrentFormState>
                </SetActionData>
             </ActionData>
           </CurrentFormState>
    
} 

//export default FormProvider;