import React from 'react';

const Custom = ({value}) => {
    return (
        <div dangerouslySetInnerHTML={{__html:value}}>
            
        </div>
    );
};

export default Custom;