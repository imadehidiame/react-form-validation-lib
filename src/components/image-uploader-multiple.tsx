import React, { useCallback, useEffect, useState } from "react"
import { useDropzone } from 'react-dropzone';
import { Button } from "./ui/button";
import { Trash } from "lucide-react";

interface IFileDisplay {
    name:string;
    is_image:boolean;
}

const ImageUploaderMultiple: React.FC<{ fieldChange: (file: any) => void, mediaUrl: string[] | File[], extensions?: string[], is_multiple?: boolean, size_limit?: number, file_count?: number, on_change?: (value: string[] | File[]) => void, name?:string, id?:string }> = ({ fieldChange, mediaUrl, extensions = ['.png', '.jpeg', '.jpg', '.svg', '.webp', '.zip', '.pdf', '.mp4', '.mp3', '.txt'], is_multiple, size_limit, file_count, on_change, name, id }) => {
    const [file_url, set_file_url] = useState<IFileDisplay>({} as IFileDisplay);
    const [file_urls, set_file_urls] = useState<IFileDisplay[]>([]);
    
    
    const generate_accepted_files = useCallback(() => {
        let accepted_files = extensions.map(e => e.startsWith('.') ? e : `.${e}`);
        let accept: Record<string, string[]> = {};
        const mime_array = Object.entries(MimeToExtensions);
        accepted_files.forEach(element => {
            mime_array.some((e) => {
                if (e[1].includes(element)) {
                    if (accept[e[0]])
                        accept[e[0]].push(element)
                    else
                        accept[e[0]] = [element];
                    return true;
                } else {
                    return false;
                }
            })
        });
        return accept;
    },[extensions]) 

    const is_image_file = useCallback((file:string)=>{
        let file_parts = file.split('.');
        const extension = file_parts[file_parts.length - 1];
        return ['png','jpg','jpeg','svg','webp','avif'].some(e=>e===extension.toLocaleLowerCase());
    },[]); 

    const removeImage = (index:number)=>{
        const filtered = mediaUrl.slice().filter((e,i)=>i !== index);
        fieldChange(filtered);
        on_change?.(filtered as (string[]|File[]));
    }

    

    useEffect(() => {
        const upload_file = async () => {

            if (mediaUrl && mediaUrl.length > 0) {
                if (is_multiple) {
                    const files_array: {is_image:boolean,name:string}[] = [];
                    mediaUrl.forEach((element,index) => {
                        if (element instanceof File) {
                            const is_image = is_image_file(element.name);
                            files_array.push({is_image,name: is_image ? URL.createObjectURL(element): element.name})
                        } else {
                            files_array.push({is_image:false,name:'Uploaded'+index});
                            
                        }
                    });
                    set_file_urls(files_array);

                } else {

                    const element = mediaUrl[0];
                    if (element instanceof File) {
                        const is_image = is_image_file(element.name);
                        set_file_url({is_image,name: is_image ? URL.createObjectURL(element): element.name});
                    } else {
                        set_file_url({is_image:false,name:'Uploaded'});
                    }

                }

            } else {
                if (is_multiple)
                    set_file_urls([]);
                else
                    set_file_url({} as IFileDisplay);
            }
        }
        upload_file();
    }, [mediaUrl]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        
        if (is_multiple) {
            const accepted: File[] = [];
            if (file_count) {
                let current_count = 0;
                for (let index = 0; index < acceptedFiles.length; index++) {
                    if (current_count == (file_count - mediaUrl.length))
                        break;
                    const element = acceptedFiles[index];
                    if (size_limit) {
                        if (Math.ceil(size_limit * 1024 * 1024) >= element.size) {
                            accepted.push(element);
                            current_count++
                        }
                    } else {
                        accepted.push(element);
                        current_count++;
                    }
                    
                }
                if (accepted.length > 0) {
                    fieldChange([...mediaUrl,...accepted]);
                    on_change?.([...mediaUrl,...accepted] as string[]|File[]);
                }

            } else {

                for (let index = 0; index < acceptedFiles.length; index++) {
                    const element = acceptedFiles[index];
                    if (size_limit) {
                        if (Math.ceil(size_limit * 1024 * 1024) >= element.size) {
                            accepted.push(element);
                        }
                    } else {
                        accepted.push(element);
                    }
                }
                if (accepted.length > 0) {
                    fieldChange([...mediaUrl,...accepted]);
                    on_change?.([...mediaUrl,...accepted] as string[]|File[]);
                }

            }
        } else {
            const accepted: File[] = [];
            for (let index = 0; index < acceptedFiles.length; index++) {
                const element = acceptedFiles[index];
                if (size_limit) {
                    if ((size_limit * 1024 * 1024) >= element.size) {
                        accepted.push(element);
                        break;
                    }
                } else {
                    accepted.push(element);
                    break;
                }
            }
            if (accepted.length > 0) {
                fieldChange(accepted);
                on_change?.(accepted);
            }
        }

    }, [mediaUrl]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone(
        {
            onDrop,
            noClick: true,
            noKeyboard: true,
            accept: generate_accepted_files()

        });
        const is_show_upload = is_multiple ? (file_count ? mediaUrl.length < file_count : true) : mediaUrl.length < 1;
    return (

        is_multiple ?

            <div {...getRootProps()} className="flex justify-start flex-col rounded-xl cursor-pointer">
                <input {...getInputProps()} className="cursor-pointer" name={name} id={id} />
                {file_urls.length > 0 ? (
                    <div className="w-full bg-slate-400 rounded-2xl p-4 overflow-x-auto">
                        <div className="flex flex-row gap-2">
                            {file_urls.map((file_url, index) => (
                                <div key={index} className="relative w-[150px] h-[150px] flex-shrink-0">
                                    {file_url.is_image ?  
                                    <img
                                        src={file_url.name}
                                        className="w-full h-full object-contain rounded-lg"
                                        alt={`Uploaded image ${index + 1}`}
                                    /> :  
                                    <>
                                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="100"
                            height="70"
                            className="mb-3"
                            viewBox="0 0 30 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
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
                        <h3 className="font-bold">{file_url.name}</h3>
                        </>
                        }

                                    <Button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation(); // Prevent dropzone trigger
                                            removeImage(index); 
                                        }}
                                        variant="default"
                                        size="icon"
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            {is_show_upload && <div className="h-[150px] bg-slate-400 rounded-2xl max-w-5xl flex flex-col items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="100"
                            height="70"
                            className="mb-3"
                            viewBox="0 0 30 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
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
                        <h3 className="font-bold">Drag file here</h3>
                        <p>
                            [{extensions ? extensions.join(",") : [".png", ".jpeg", ".jpg", ".svg", ".webp", ".zip", ".pdf", ".mp4", ".mp3", ".txt"].join(",")}]
                        </p>
                        <Button
                            variant="default"
                            size="default"
                            onClick={(e) => {
                                e.preventDefault();
                                open();
                            }}
                        >
                            Select from device
                        </Button>
                    </div>}

                        </div>
                    </div>
                ) : (
                    <div className="w-full h-[300px] bg-slate-400 rounded-2xl max-w-5xl flex flex-col items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="100"
                            height="70"
                            className="mb-3"
                            viewBox="0 0 30 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
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
                        <h3 className="font-bold">Drag file here</h3>
                        <p>
                            [{extensions ? extensions.join(",") : [".png", ".jpeg", ".jpg", ".svg", ".webp", ".zip", ".pdf", ".mp4", ".mp3", ".txt"].join(",")}]
                        </p>
                        <Button
                            variant="default"
                            size="default"
                            onClick={(e) => {
                                e.preventDefault();
                                open();
                            }}
                        >
                            Select from device
                        </Button>
                    </div>
                )}
            </div>

            :

            <div {...getRootProps()} className="flex justify-start flex-col rounded-xl cursor-pointer">
                <input {...getInputProps()} name={name} />
                {

                    file_url ?
                        <div className="w-full h-[300px] bg-slate-400 rounded-2xl max-w-5xl flex flex-col items-center justify-center relative">
                            <div className="w-[300px] h-[300px] relative">


                            {file_url.is_image ?  
                                    <img
                                        src={file_url.name}
                                        className="absolute top-0 left-0 w-full h-full object-contain"
                                        alt=""
                                        style={{ objectPosition: 'center' }}
                                    /> :  
                                    <>
                                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="100"
                            height="70"
                            className="mb-3"
                            viewBox="0 0 30 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
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
                        <h3 className="font-bold">{file_url.name}</h3>
                        </>
                        }
                                    <Button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation(); // Prevent dropzone trigger
                                            removeImage(0); 
                                        }}
                                        variant="default"
                                        size="icon"
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full cursor-pointer"
                                    >
                                        <Trash className="h-4 w-4" />
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
                            <h3 className="font-bold">Drag file here</h3>
                            <p>[{extensions ? extensions.join(',') : ['.png', '.jpeg', '.jpg', '.svg', '.webp', '.zip', '.pdf', '.mp4', '.mp3', '.txt'].join(',')}]</p>
                            <Button variant={'default'} size={'default'} className="cursor-pointer" onClick={(e) => { e.preventDefault(); open() }}>Select from device</Button>

                        </div>
                }
            </div>
    )
}

export default ImageUploaderMultiple;

export const MimeToExtensions = {
    // =====================================================================
    // Common Image Types
    // =====================================================================
    'image/jpeg': ['.jpeg', '.jpg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/bmp': ['.bmp'],
    'image/webp': ['.webp'],
    'image/tiff': ['.tif', '.tiff'],
    'image/svg+xml': ['.svg'],
    'image/x-icon': ['.ico'], // Favicon
    'image/heif': ['.heif', '.heic'], // HEIF (Apple format)
    'image/avif': ['.avif'], // AVIF

    // =====================================================================
    // Common Audio Types
    // =====================================================================
    'audio/mpeg': ['.mp3'], // MP3
    'audio/wav': ['.wav'], // WAV
    'audio/ogg': ['.ogg', '.oga'], // Ogg audio
    'audio/aac': ['.aac'], // AAC
    'audio/midi': ['.mid', '.midi'], // MIDI
    'audio/webm': ['.weba'], // WebM audio
    'audio/flac': ['.flac'], // FLAC

    // =====================================================================
    // Common Video Types
    // =====================================================================
    'video/mp4': ['.mp4'], // MP4
    'video/webm': ['.webm'], // WebM video
    'video/ogg': ['.ogv'], // Ogg video
    'video/quicktime': ['.mov'], // QuickTime (MOV)
    'video/x-msvideo': ['.avi'], // AVI
    'video/x-flv': ['.flv'], // Flash Video
    'video/3gpp': ['.3gp', '.3gpp'], // 3GP
    'video/x-ms-wmv': ['.wmv'], // WMV

    // =====================================================================
    // Common Document Types
    // =====================================================================
    'application/pdf': ['.pdf'], // PDF
    'application/msword': ['.doc'], // Microsoft Word (older .doc)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], // Microsoft Word (new .docx)
    'application/vnd.ms-excel': ['.xls'], // Microsoft Excel (older .xls)
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], // Microsoft Excel (new .xlsx)
    'application/vnd.ms-powerpoint': ['.ppt'], // Microsoft PowerPoint (older .ppt)
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'], // Microsoft PowerPoint (new .pptx)
    'text/plain': ['.txt'], // Plain text
    'text/csv': ['.csv'], // Comma Separated Values
    'text/html': ['.html', '.htm'], // HTML
    'text/css': ['.css'], // CSS
    'application/rtf': ['.rtf'], // Rich Text Format
    'application/json': ['.json'], // JSON

    // =====================================================================
    // Common Archive & Compressed Types
    // =====================================================================
    'application/zip': ['.zip'], // ZIP archive
    'application/x-rar-compressed': ['.rar'], // RAR archive (often requires specific handling)
    'application/x-tar': ['.tar'], // TAR archive
    'application/gzip': ['.gz'], // Gzip compressed file

    // =====================================================================
    // Common Executable & Binary Types
    // (Use with extreme caution, especially for uploads!)
    // =====================================================================
    'application/octet-stream': ['.bin'], // Generic binary data (very broad, use specific types when possible)
    'application/x-executable': ['.exe'], // Windows Executable (rarely accepted on web)
    'application/vnd.android.package-archive': ['.apk'], // Android Package

    // =====================================================================
    // Other Common Types
    // =====================================================================
    'application/xml': ['.xml'], // XML
    'application/javascript': ['.js', '.mjs'], // JavaScript
    'application/typescript': ['.ts', '.tsx'], // TypeScript
    'font/ttf': ['.ttf'], // TrueType Font
    'font/otf': ['.otf'], // OpenType Font
    'font/woff': ['.woff'], // Web Open Font Format
    'font/woff2': ['.woff2'], // Web Open Font Format 2
};




