import React, { useState, cloneElement, isValidElement } from 'react';
const Form = ({data = [] , submitBtn , className, onClick}) => {
    const [state, setState] = useState(data)

    return (
        <div className={`w-[600px] grid grid-cols-2 gap-3 ${className} `  }>
            {
                state.slice(0, 4).map((item, index) => (
                    <input
                        style={{ gridColumn: `span ${item.colspan}` }}
                        key={index}
                        type="text"
                        value={item.value}
                        id={item.id}
                        onChange={(e) => {
                            setState(prev => ([

                                ...prev.slice(0, index),
                                { ...prev[index], value: e.target.value },
                                ...prev.slice(index + 1)


                            ]))
                        }}
                        placeholder={item.placeholder}
                        className="border outline-green-800  border-gray-300 rounded-xl p-3 py-2  w-full"
                    />
                ))
            }
            {
                <textarea
                    value={state[4].value}
                    id={state[4].id}
                    onChange={(e) => {
                        setState(prev => ([

                            ...prev.slice(0, 4),
                            { ...prev[4], value: e.target.value },
                        ]))
                    }}
                    style={{ gridColumn: `span ${state[4].colspan}` }}
                    placeholder={state[4].placeholder}
                    className="border outline-green-800  border-gray-300 rounded-xl p-3 py-2  w-full h-32 resize-none"
                />
            }
            {
                submitBtn ?
                (isValidElement(submitBtn)
                  ? cloneElement(submitBtn, {
                      onClick: (e) => {
                        submitBtn.props?.onClick?.(e);
                        onClick?.(state);
                      },
                    })
                  : submitBtn)
                :
                <button 
                onClick={()=>{
                    onClick(state)
                }}
                className='w-fit bg-green-800 flex items-center gap-2 text-white p-3 rounded-2xl mt-2 hover:bg-green-900 transition-colors cursor-pointer col-span-2 mx-auto'>
                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.6346 12.7785V5.52568C17.6346 3.91451 16.8285 3.1084 15.2173 3.1084H5.54716C3.93496 3.1084 3.12988 3.91451 3.12988 5.52568V17.6141L5.54716 15.1968H15.2173C16.8285 15.1968 17.6346 14.3907 17.6346 12.7785ZM7.27336 10.3612C6.70142 10.3612 6.23192 9.89706 6.23192 9.32513C6.23192 8.75319 6.69105 8.289 7.26298 8.289H7.27336C7.84633 8.289 8.30948 8.75319 8.30948 9.32513C8.30948 9.89706 7.84529 10.3612 7.27336 10.3612ZM10.3817 10.3612C9.80978 10.3612 9.34029 9.89706 9.34029 9.32513C9.34029 8.75319 9.79941 8.289 10.3713 8.289H10.3817C10.9547 8.289 11.4178 8.75319 11.4178 9.32513C11.4178 9.89706 10.9537 10.3612 10.3817 10.3612ZM13.4901 10.3612C12.9181 10.3612 12.4487 9.89706 12.4487 9.32513C12.4487 8.75319 12.9078 8.289 13.4797 8.289H13.4901C14.0631 8.289 14.5262 8.75319 14.5262 9.32513C14.5262 9.89706 14.062 10.3612 13.4901 10.3612ZM21.7791 11.3974V21.7586L19.7068 19.6863H11.4178C10.0398 19.6863 9.3456 18.9921 9.3456 17.6141C9.3456 17.6141 9.3456 17.324 9.3456 17.0743C9.3456 16.8536 9.51234 16.7542 9.66154 16.7542C9.76516 16.7542 15.2203 16.7542 15.2203 16.7542C17.707 16.7542 19.1888 15.2621 19.1888 12.7754C19.1888 12.7754 19.1888 9.87743 19.1888 9.63601C19.1888 9.3946 19.3992 9.32513 19.4976 9.32513C19.595 9.32513 19.7068 9.32513 19.7068 9.32513C21.0849 9.32513 21.7791 10.0193 21.7791 11.3974Z" fill="white" />
                </svg>
                ثبت دیدگاه
            </button>
            }
        </div>
    );
};

export default Form;
