import React from 'react';
import { sanitizeHtml } from '../../../utils/sanitize';

const Custom = ({value}) => {
    return (
        <div dangerouslySetInnerHTML={{__html: sanitizeHtml(value)}}>
            
        </div>
    );
};

export default Custom;