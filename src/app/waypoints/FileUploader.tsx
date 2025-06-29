'use client';

import { ChangeEventHandler, MouseEventHandler, PropsWithChildren, useRef } from "react";

export type FileUploaderProps = PropsWithChildren<{
    handleFiles: (files: FileList) => void
}>;

export default function FileUploader({ handleFiles, children }: FileUploaderProps) {
    const hiddenFileInput = useRef<HTMLInputElement>(null);

    const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    };

    const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        if (e.target.files) {
            const files = e.target.files;
            handleFiles(files);
        }
    };

    return (
        <>
            <button onClick={handleClick}>
                {children}
            </button>
            <input
                type="file"
                onChange={handleChange}
                ref={hiddenFileInput}
                style={{ display: 'none' }} // Hide the input element
            />
        </>
    );
}