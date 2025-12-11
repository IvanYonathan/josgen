import { useRef, useMemo, useEffect, useId } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './rich-text-editor.css';
import { uploadImage } from '@/lib/api/image/upload-image';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  className = '',
  disabled = false,
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const toolbarId = useId();

  const imageHandler = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/jpeg,image/png,image/jpg,image/gif,image/webp');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      const loadingToast = toast.loading('Uploading image...');

      try {
        const response = await uploadImage({ image: file });
        const imageUrl = response.image.url;

        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', imageUrl);
          quill.setSelection(range.index + 1, 0);
        }

        toast.success('Image uploaded successfully', { id: loadingToast });
      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error('Failed to upload image', { id: loadingToast });
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: `#${CSS.escape(toolbarId)}`,
        handlers: {
          image: imageHandler,
        },
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    [toolbarId]
  );

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'color',
    'background',
    'align',
  ];

  const handleFormat = (format: string, value?: any) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    if (value !== undefined) {
      quill.format(format, value);
    } else {
      const currentFormat = quill.getFormat();
      quill.format(format, !currentFormat[format]);
    }
  };

  return (
    <TooltipProvider>
      <div className={`rich-text-editor ${className}`}>
        <div id={toolbarId} className="ql-toolbar ql-snow">
          <span className="ql-formats">
            <Tooltip>
              <TooltipTrigger asChild>
                <select className="ql-header" defaultValue="">
                  <option value="1">Heading 1</option>
                  <option value="2">Heading 2</option>
                  <option value="3">Heading 3</option>
                  <option value="4">Heading 4</option>
                  <option value="5">Heading 5</option>
                  <option value="6">Heading 6</option>
                  <option value="">Normal</option>
                </select>
              </TooltipTrigger>
              <TooltipContent>Heading</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <select className="ql-font" />
              </TooltipTrigger>
              <TooltipContent>Font</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <select className="ql-size" />
              </TooltipTrigger>
              <TooltipContent>Font Size</TooltipContent>
            </Tooltip>
          </span>
          <span className="ql-formats">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-bold" />
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-italic" />
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-underline" />
              </TooltipTrigger>
              <TooltipContent>Underline</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-strike" />
              </TooltipTrigger>
              <TooltipContent>Strikethrough</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-blockquote" />
              </TooltipTrigger>
              <TooltipContent>Blockquote</TooltipContent>
            </Tooltip>
          </span>
          <span className="ql-formats">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-list" value="ordered" />
              </TooltipTrigger>
              <TooltipContent>Numbered List</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-list" value="bullet" />
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-indent" value="-1" />
              </TooltipTrigger>
              <TooltipContent>Decrease Indent</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-indent" value="+1" />
              </TooltipTrigger>
              <TooltipContent>Increase Indent</TooltipContent>
            </Tooltip>
          </span>
          <span className="ql-formats">
            <Tooltip>
              <TooltipTrigger asChild>
                <select className="ql-color" />
              </TooltipTrigger>
              <TooltipContent>Text Color</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <select className="ql-background" />
              </TooltipTrigger>
              <TooltipContent>Background Color</TooltipContent>
            </Tooltip>
          </span>
          <span className="ql-formats">
            <Tooltip>
              <TooltipTrigger asChild>
                <select className="ql-align" />
              </TooltipTrigger>
              <TooltipContent>Text Align</TooltipContent>
            </Tooltip>
          </span>
          <span className="ql-formats">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-link" />
              </TooltipTrigger>
              <TooltipContent>Insert Link</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ql-image" />
              </TooltipTrigger>
              <TooltipContent>Insert Image</TooltipContent>
            </Tooltip>
          </span>
        </div>

        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          className="bg-background"
        />
      </div>
    </TooltipProvider>
  );
}
