export const evaluate_file_extension = (response:Response) =>{
    const content_type = response.headers.get('Content-Type');
    if(!content_type)
      return '';
    if(content_type === 'image/svg+xml'){
      return 'svg';
    }
    else{
      const exts = content_type.split('/');
      return exts[exts.length - 1];
    }
  }
  
  export const is_binary_file = (response:Response)=>{
    const headers = ['image/','application/','text/','audio/','video/','application/vnd','application/octet-stream'];
    return headers.some(e=>response.headers.get('Content-Type')?.startsWith(e) && response.headers.get('Content-Type') !== 'application/json' && response.headers.get('Content-Type') !== 'text/plain');
  }
  
  export const fetch_request = async <T>(method:'POST'|'GET'|'PATCH'|'DELETE',action:string,body?:string|FormData|any|null,is_json?:boolean,binary?:{
    display:'text'|'object_url'|'body'|'download',
    extension?:string;
  },error?:{catch:string,request:string},
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
  }>,headers?:Partial<Record<string,string>>): Promise<{
    data:T|any,
    is_error?:boolean,
    status?:number,
    response?:Response
  }> => {
    try {
        if(method === 'POST' || method === 'PATCH'){
                body = body instanceof FormData || typeof body == 'string' || body instanceof URLSearchParams ? body :  JSON.stringify(body);
        }
        const request_headers = Object.assign({},headers?headers:{});
       
          if(is_json){
            request_headers['Content-Type'] = 'application/json'
          }
        
        const response = is_json ? await fetch(
          action,{method,body,headers:
              request_headers as Record<string,string>,
              cache:fetch_options?.cache,
              credentials:fetch_options?.credentials,
              integrity:fetch_options?.integrity,
              keepalive:fetch_options?.keepalive,
              mode:fetch_options?.cors,
              priority:fetch_options?.priority,
              redirect:fetch_options?.redirect,
              referrer:fetch_options?.referrer,
              referrerPolicy:fetch_options?.referrerPolicy,
              signal:fetch_options?.signal,
              window:fetch_options?.window
          }) : await fetch(action,{method,body,
            headers:request_headers as Record<string,string>, 
            cache:fetch_options?.cache,
              credentials:fetch_options?.credentials,
              integrity:fetch_options?.integrity,
              keepalive:fetch_options?.keepalive,
              mode:fetch_options?.cors,
              priority:fetch_options?.priority,
              redirect:fetch_options?.redirect,
              referrer:fetch_options?.referrer,
              referrerPolicy:fetch_options?.referrerPolicy,
              signal:fetch_options?.signal,
              window:fetch_options?.window
          });
        const sent_response = response.clone();
        const {status,statusText,ok} = response.clone();
        if(!ok){
            if(statusText)
            return { is_error:true,data:statusText,status };
            return {is_error:true,status,data:error?.request ?? 'An error occured with the request'}
        }
        if(is_binary_file(response.clone())){
          const contentType = response.headers.get("Content-Type");
          if (contentType?.includes("application/json")) {
            //return {data:await response.text() as T,status,response:sent_response};
            return {data:await response.json() as T,status,response:sent_response};
          }
            

          if(binary?.display === 'body'){
            return {data:response.body,status,response:sent_response};
          }else {
  
          let chunks = [];
          let total_length = 0;
          const reader = response.body?.getReader();
          while(true){
            const {value,done} = (await reader?.read())!;
            if(done){
              break;
            }
            chunks.push(value);
            total_length+=value.length;
          }
          
          if(binary?.display === 'text'){
            let uint8array = new Uint8Array(total_length);
            let offset = 0;
            for (const chunk of chunks) {
              uint8array.set(chunk,offset);
              offset += chunk.length;
            }
            const text_decoder = new TextDecoder('utf-8');
            return {data:text_decoder.decode(uint8array),status,response:sent_response};
          }
          const blob = new Blob(chunks,{type:response.headers.get('Content-Type') as string});
          const url = URL.createObjectURL(blob);
          if(binary?.display === 'download'){
            const a = document.createElement('a');
            a.href = url;
            if(binary.extension)
            a.download = `download_file.${binary.extension}`;
            else
            a.download = `download_file.${evaluate_file_extension(response)}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
            return {data:null,status};
          }
          return {data:url,status};
          }
          
        }else{
          const contentType = response.headers.get("Content-Type");
          if (!contentType?.includes("application/json")) {
            let resp = JSON.parse(await response.text());
            return {data:resp as T,status,response:sent_response};
          }
            return {data:await response.json() as T,status,response:sent_response};
        }
        
    } catch (errorr) {
      return {is_error:true,/*error_message:errorr instanceof Error ? errorr.message : 'Error with no message property',*/data: error?.catch ?? 'An unknown error occured likely before request was processed',status:500}
    }
  }
  
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

  export class NumberFormat {
    static thousands(number: string | number, flag?: Partial<{ allow_decimal?: boolean, length_after_decimal?: number, add_if_empty?: boolean, allow_zero_start?: boolean, total_length?: number }>) {
        let numb = typeof number === 'number' ? number.toString() : number;
        if (numb === '')
            return '';
        let num_array: string[] = [];
        if (flag) {
            if (flag.allow_decimal) {
                const add_extra_digits = (start = 0, end = 1, n = '') => {
                    for (let index = start; index < end; index++) {
                        n += '0';
                    }
                    return n;
                }
                num_array = numb.split('.');
                const length = flag.length_after_decimal ?? 2;
                if (flag.add_if_empty) {
                    if (num_array.length < 2) {
                        let n = '';

                        for (let index = 0; index < length; index++) {
                            n += '0';
                        }
                        num_array.push(add_extra_digits(0, length, ''));
                    } else {
                        num_array[1] = num_array[1].replace(/\D/g, "");
                        num_array[1] = num_array[1].length >= length ? num_array[1].substring(0, length) : add_extra_digits(num_array[1].length, length, num_array[1]);
                    }
                }
                if (num_array.length >= 2) {
                    num_array = num_array.splice(0, 2);
                    num_array[1] = num_array[1].replace(/\D/g, "");
                    num_array[1] = num_array[1].substring(0, length);
                }

                numb = num_array[0];
            }
        }

        numb = numb.replace(/,/gi, '');
        numb = numb.replace(/\D/g, "");

        if (flag && flag.hasOwnProperty('allow_zero_start') && !flag.allow_zero_start) {

            while (String.prototype.charAt.apply(numb, [0]) == "0") {
                if (numb.length >= 2)
                    numb = numb.substring(1);
                else
                    numb = '';
            }

            if (numb == '')
                return '';

        }

        if (flag && flag.total_length && typeof flag.total_length == 'number' && flag.total_length > 0) {
            numb = numb.substring(0, flag.total_length);
        }

        let length = numb.length;
        let string_array = [];
        if (length > 3) {
            let number_of_commas = parseInt((length / 3).toString());
            let first_position = length % 3;
            if (first_position == 0) {
                number_of_commas -= 1;
                first_position = 3;
            }
            string_array = numb.split('');
            string_array[first_position - 1] = string_array[first_position - 1] + ",";
            number_of_commas -= 1;
            while (number_of_commas > 0) {
                first_position += 3;
                string_array[first_position - 1] = string_array[first_position - 1] + ",";
                number_of_commas -= 1;
            }
        } else {
            if (flag && flag.allow_decimal) {
                if (num_array.length > 1) {
                    return numb + "." + num_array[1];
                }
            }
            return numb;
        }
        if (flag && flag.allow_decimal) {

            if (flag.add_if_empty || num_array.length > 1) {
                return string_array.join('') + "." + num_array[1];
            } else {
                return string_array.join('');
            }

        }
        return string_array.join('');
    }
    static return_regex_format(str:string,extra_character?:string|null){
        const allowed_characters = extra_character ? `[+\\-${extra_character}]` : `[+\\-]`;
        const regex = new RegExp(`(^${allowed_characters}?)(.*$)`);
        return str.replace(regex,(match,p1,p2)=>{
            return p1+p2.replace(/[^\d]/g,"");
        });
    }
    static numbers_only(number: string, flag?: Partial<{ allow_decimal?: boolean, length_after_decimal?: number, allow_zero_start?: boolean, total_length?: number, format_to_thousand?: boolean, allow_negative_prefix?:boolean, extra_format?:{format:string|string[],space_character?:string} }>) {
        let num_array: string[] = [];
        if (flag) {
            if (flag.hasOwnProperty('allow_decimal') && flag.allow_decimal === true) {
                num_array = number.split('.');
                if (num_array.length > 2)
                    num_array = num_array.splice(0, 2);
                number = num_array[0];
            }
        }
        
        number = flag?.allow_negative_prefix ? this.return_regex_format(number,'-') : number.replace(/\D/g, "");
        const negative_prefix = number.includes('-') ? number.slice(0,1) : '';
        
        if(negative_prefix){
            number = number.slice(1);
        }

        if (flag && flag.allow_zero_start == false) {

            while (String.prototype.charAt.apply(number, [0]) == "0") {
                if (number.length >= 2)
                    number = number.substring(1);
                else
                    number = '';
            }

            if (number == ''){
                return negative_prefix + '';
            }

        }

        if (flag && flag.total_length && typeof flag.total_length == 'number' && flag.total_length > 0) {
            number = number.substring(0, flag.total_length);
        }


        if (flag && flag.allow_decimal) {
            if (num_array.length > 1) {
                return number + "." + num_array[1].replace(/\D/g, "").substring(0, flag.length_after_decimal);
            }
        }
        if (flag && flag.format_to_thousand) {
            return negative_prefix + this.thousands(number, flag);
        }
        return negative_prefix + (flag?.extra_format ? format_number_value((flag?.extra_format?.format as string|string[]),number.toString(),flag?.extra_format?.space_character) : number.toString());
    }
}