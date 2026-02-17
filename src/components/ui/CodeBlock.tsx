import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'python',
  className = '',
}) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className={`relative group rounded-lg overflow-hidden ${className}`}>
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="px-2 py-1 text-xs rounded glass text-white/40 hover:text-white/70 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Copy
        </button>
      </div>
      <pre className="!m-0 !p-4 !bg-[#0F0A0A] !rounded-lg overflow-x-auto">
        <code ref={codeRef} className={`language-${language} font-mono text-sm`}>
          {code}
        </code>
      </pre>
    </div>
  );
};
