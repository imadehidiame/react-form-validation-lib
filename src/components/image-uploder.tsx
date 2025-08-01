import React,{ useCallback, useEffect, useState } from "react"
import { useDropzone } from 'react-dropzone';
import { Button } from "./ui/button";
import { Trash } from "lucide-react";
const ImageUploader:React.FC<{fieldChange:(file:any)=>void,mediaUrl:string[]|File[],extensions?:string[],is_multiple?:boolean,size_limit?:number,on_change?:(value:any)=>void}> = ({fieldChange,mediaUrl,extensions,is_multiple,size_limit,on_change})=>{
    const [file_url,set_file_url] = useState('');

    useEffect(()=>{
        const upload_file = async ()=>{

            if(mediaUrl && mediaUrl.length > 0){
                const element = mediaUrl[0];
                if(element instanceof File){
                    set_file_url(URL.createObjectURL(element));
                    
                }else{
                    set_file_url(element);
                }
            }else{
                set_file_url('');
            }
        }
        upload_file();
        
    },[mediaUrl]);

    const onDrop = useCallback((acceptedFiles: File[]) =>{

        if(is_multiple){
            const accepted:File[] = [];
            for (let index = 0; index < acceptedFiles.length; index++) {
                const element = acceptedFiles[index];
                if(size_limit){
                    if( Math.ceil(size_limit * 1024 * 1024) >= element.size){
                        accepted.push(element);
                    }
                }else{ 
                        accepted.push(element);
                }
            }
            if(accepted.length > 0){
                fieldChange(accepted);
            }else{
                fieldChange([]); 
            }
            
            

        }else{
            const accepted:File[] = [];
            for (let index = 0; index < acceptedFiles.length; index++) {
                const element = acceptedFiles[index];
                if(size_limit){
                    if( (size_limit * 1024 * 1024) >= element.size){
                        accepted.push(element);
                        break;
                    }
                }else{
                    accepted.push(element);
                    break;     
                }
            }
            if(accepted.length > 0){
                fieldChange(accepted);
                on_change?.(accepted);
            }else{
                fieldChange([]);
                on_change?.([]);
            }
        }

    },[]);
    const { getRootProps,getInputProps,isDragActive,open } = useDropzone(
        {
            onDrop,
            noClick:true,
            noKeyboard:true,
            accept:{
                'image/*': extensions ? extensions.map(e=>e.startsWith('.')?e.toLocaleUpperCase():`.${e.toLocaleLowerCase()}`) : ['.png','.jpeg','.jpg','.svg','.webp','.zip','.pdf','.mp4','.mp3','.txt']
            }

    });
    return (
            <div {...getRootProps()} className="flex justify-start flex-col rounded-xl cursor-pointer">
                <input {...getInputProps()} />
                {

                    file_url ?
                    <div className="w-full h-[300px] bg-slate-400 rounded-2xl max-w-5xl flex flex-col items-center justify-center relative">
            <div className="w-[300px] h-[300px] relative">

            
                <img
                    src={file_url}
                    className="absolute top-0 left-0 w-full h-full object-contain"
                    alt=""
                    style={{ objectPosition: 'center' }}
                />
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        open();
                    }}
                    variant={'default'}
                    size={'icon'}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full cursor-pointer"
                >
                    <Trash />
                </Button>
            </div>
        </div>
                    :
                    <div className="w-full h-[300px] bg-slate-400 rounded-2xl max-w-5xl flex flex-col items-center justify-center">

<svg xmlns="http://www.w3.org/2000/svg" width="100" height="70" className="mb-3" viewBox="0 0 30 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M16 5h6" />
  <path d="M19 2v6" />
  <path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" />
  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  <circle cx="9" cy="9" r="2" />

  <g transform="translate(0, 8)">
    <rect x="2" y="7" width="20" height="20" rx="1" ry="1" />
    <path d="M10 8l4 2-4 2z" fill="currentColor" />
  </g>
</svg>
<h3 className="font-bold">Drag photo here</h3>
<p>[{extensions?extensions.join(','):['.png','.jpeg','.jpg','.svg','.webp','.zip','.pdf','.mp4','.mp3','.txt'].join(',')}]</p>
<Button variant={'default'} size={'default'} className="cursor-pointer" onClick={(e)=>{e.preventDefault();open()}}>Select from device</Button>

                    </div>
                }
            </div>
        )
}

export default ImageUploader;