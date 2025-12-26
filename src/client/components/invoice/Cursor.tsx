import React, { useEffect, useRef } from 'react';

const Cursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!window.matchMedia("(pointer: fine)").matches) return;

        const cursor = cursorRef.current;
        if (!cursor) return;

        const moveCursor = (e: MouseEvent) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        };

        const handleHover = (e: MouseEvent) => {
            if ((e.target as Element).closest('a, button, .card, .form-control, .file-upload-box, .custom-select-trigger, .custom-option, .qr-code-container')) {
                cursor.classList.add('hovered');
            } else {
                cursor.classList.remove('hovered');
            }
        };

        document.addEventListener('mousemove', moveCursor);
        document.body.addEventListener('mouseover', handleHover);

        return () => {
            document.removeEventListener('mousemove', moveCursor);
            document.body.removeEventListener('mouseover', handleHover);
        };
    }, []);

    return <div className="cursor" ref={cursorRef}></div>;
};

export default Cursor;
