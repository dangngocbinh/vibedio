import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';

interface TemplatePreviewProps {
    htmlFile: string;
    title: string;
}

export const HtmlGalleryViewer: React.FC<TemplatePreviewProps> = ({ htmlFile, title }) => {
    // [Vue comparison] - Component này giống như một wrapper chứa <iframe> 
    // tương đương với <iframe :src="staticFile(htmlFile)"> trong Vue
    return (
        <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
            <iframe
                src={staticFile(htmlFile)}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: 'white'
                }}
                title={title}
            />
        </AbsoluteFill>
    );
};
