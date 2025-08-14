import { useCallback, useEffect, useState } from "react";
import { $getSelection, $isRangeSelection, CAN_REDO_COMMAND, CAN_UNDO_COMMAND, FORMAT_ELEMENT_COMMAND, FORMAT_TEXT_COMMAND, REDO_COMMAND, SELECTION_CHANGE_COMMAND, UNDO_COMMAND, OUTDENT_CONTENT_COMMAND, $getRoot, type SerializedLexicalNode, $createTextNode, $insertNodes, $createParagraphNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { Button } from "./ui/button";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Redo2Icon, Strikethrough, Underline, Undo2Icon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { cn } from "../utils/cn";


interface ComponentProps {
  on_change?: (value: any) => void;
  disable: boolean;
  value: string[];
  insertion?:string;
}

export const ToolbarPlugin: React.FC<ComponentProps> = ({ on_change, disable, value, insertion }) => {
  const [bold, set_bold] = useState(false);
  const [italic, set_italic] = useState(false);
  const [underline, set_underline] = useState(false);
  const [strike_through, set_strike_through] = useState(false);
  const [undo, set_undo] = useState<boolean>(false);
  const [redo, set_redo] = useState<boolean>(false);
  const [format, set_format] = useState<string | any>('');
  const [editor] = useLexicalComposerContext();
  const [page_value,set_page_value] = useState(value);
  const [inserts,set_inserts] = useState(1);

  const LowPriority = 1;

  const update_toolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      set_bold(selection.hasFormat('bold'));
      set_italic(selection.hasFormat('italic'));
      set_underline(selection.hasFormat('underline'));
      set_strike_through(selection.hasFormat('strikethrough'));
    }
  }, []);

  useEffect(() => {
    if(insertion && insertion?.trim().length > 0){
      editor.update(()=>{
        const root = $getRoot();
        root.clear();
       const paragraph = $createParagraphNode();
       paragraph.append($createTextNode(insertion));
        $insertNodes([paragraph]);
        set_inserts(inserts=>inserts+1);
      },{tag:'tag-'+inserts});
    }else{
      editor.update(()=>{
        const root = $getRoot();
        root.clear();
        set_inserts(inserts=>inserts+1);
      },{tag:'tag-'+inserts});
    }
  }, [insertion]);

  useEffect(() => {
    if (value && value.length > 0) {
      const editor_state = editor.parseEditorState(page_value[0]);
      editor.setEditorState(editor_state, { tag: 'initial-insertion' });
    }
  }, []);


  useEffect(() => {
    editor.setEditable(!disable);
  }, [disable]);

  interface Jsonified extends SerializedLexicalNode {
    children: { text: string }[];
  }

  

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          update_toolbar();
        });
        const jsonfied_text = editorState.toJSON();
        const valid_json = jsonfied_text.root.children.filter(e => {
          const m = e as Jsonified;
          return m.children.length && m.children[0].text.trim().length > 0;
        });
        const text_value = JSON.stringify(jsonfied_text);
        if (valid_json && valid_json.length > 0) {
          on_change?.([text_value, JSON.stringify(editor.getRootElement()?.innerHTML)]);
        } else {
          on_change?.([text_value, '']);
        }
      //}
        
      }),
      
      editor.registerCommand(SELECTION_CHANGE_COMMAND, (payload, new_editor) => {
        update_toolbar();
        return false;
      }, LowPriority),
      editor.registerCommand(CAN_UNDO_COMMAND, (payload: boolean) => {
        set_undo(payload);
        return false;
      }, LowPriority),
      editor.registerCommand(CAN_REDO_COMMAND, (payload: boolean) => {
        set_redo(payload);
        return false;
      }, LowPriority),
      editor.registerCommand(FORMAT_ELEMENT_COMMAND, (payload, editor) => {
        set_format(payload);
        return false;
      }, LowPriority)
    );
  }, [editor, update_toolbar]);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={undo ? 'outline' : 'ghost'}
        size={'icon'}
        className="text-amber-300"
        disabled={!undo}
        type="button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <Undo2Icon /> 
      </Button>
      <Button
        variant={redo ? 'outline' : 'ghost'}
        size={'icon'}
        className="text-amber-300"
        disabled={!redo}
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Redo2Icon />
      </Button>
      <Button
        variant={bold ? 'outline' : 'ghost'}
        type="button"
        className="text-amber-300"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        <Bold />
      </Button>
      <Button
        variant={italic ? 'outline' : 'ghost'}
        size={'icon'}
        className="text-amber-300"
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        <Italic />
      </Button>
      <Button
        variant={underline ? 'outline' : 'ghost'}
        size={'icon'}
        className="text-amber-300"
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
      >
        <Underline />
      </Button>
      <Button
        variant={strike_through ? 'outline' : 'ghost'}
        size={'icon'}
        className="text-amber-300"
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
      >
        <Strikethrough />
      </Button>
      <Button
        variant={format == 'left' || format == '' ? 'outline' : 'ghost'}
        size={'icon'}
        className="text-amber-300"
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
      >
        <AlignLeft />
      </Button>
      <Button
        variant={format == 'center' ? 'outline' : 'ghost'}
        size={'icon'}
        className="text-amber-300"
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
      >
        <AlignCenter />
      </Button>
      <Button
        variant={format == 'right' ? 'outline' : 'ghost'}
        size={'icon'}
        className="text-amber-300"
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
      >
        <AlignRight />
      </Button>
      <Button
        variant={format == 'justify' ? 'outline' : 'ghost'}
        size={'icon'}
        className="text-amber-300"
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
      >
        <AlignJustify />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="text-amber-300">List</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")}>
            Bullet List
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}>
            Numbered List
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface LexicalProps {
  fieldChange: (value: any) => void;
  placeholder?: string;
  disable: boolean;
  name?: string;
  ref?: React.RefObject<HTMLDivElement | null>;
  id?: string;
  value: string[];
  on_blur?: (value: any) => void;
  classNames?: string;
  insertion?:string;
}

const LexicalTextEditor: React.FC<LexicalProps> = ({ fieldChange, disable, placeholder, value, classNames, name, id, ref, insertion }) => {
  const initialConfig = {
    namespace: 'ShadcnLexicalEditor',
    onError: (error: any) => console.error(error),
    theme: {
      root: 'prose prose-sm sm:prose-base lg:prose-lg p-2 min-h-[200px] outline-none',
      link: 'text-blue-600 underline hover:text-blue-800',
      list: {
        ul: 'list-disc pl-6',
        ol: 'list-decimal pl-6',
      },
      code: 'bg-gray-100 text-red-800 font-mono text-sm rounded px-1 py-0.5',
      heading: {
        h1: 'text-4xl font-bold mt-6 mb-4',
        h2: 'text-3xl font-bold mt-5 mb-3',
        h3: 'text-2xl font-semibold mt-4 mb-2',
        h4: 'text-xl font-semibold mt-3 mb-2',
        h5: 'text-lg font-medium mt-2 mb-1',
      },
      image: 'max-w-full h-auto rounded-lg shadow-sm',
      ltr: 'text-left',
      paragraph: 'my-1 text-base leading-relaxed',
      placeholder: 'text-gray-400 italic',
      quote: 'border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4',
      rtl: 'text-right',
      text: {
        bold: 'font-bold',
        code: 'bg-gray-100 text-red-800 font-mono text-sm px-1 rounded',
        hashtag: 'text-blue-500 hover:underline',
        italic: 'italic',
        overflowed: 'truncate',
        strikethrough: 'line-through',
        underline: 'underline',
        underlineStrikethrough: 'underline line-through',
      },
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn("border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col gap-4 w-full max-w-full", classNames)}>
        <ToolbarPlugin disable={disable} value={value} on_change={fieldChange} insertion={insertion} />
        <div className="relative w-full">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                ref={ref}
                className="border-none outline-none w-full min-h-[150px] p-2"
                name={name}
                id={id}
                //aria-placeholder={placeholder ?? 'Enter your text'}
              />
            }
            placeholder={
              <div className="text-gray-400 italic absolute top-3 left-2 pointer-events-none">
                {placeholder ?? 'Enter your text...'}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
      </div>
    </LexicalComposer>
  );
};

export default LexicalTextEditor;