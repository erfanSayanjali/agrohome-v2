'use client';

import Title from "./Title";
const FeatureItem = ({title , value}) => {
    return (
        <div className='bg-white  rounded-lg grid grid-cols-[1fr_auto_1fr] gap-2 items-center'>
           <p className="bg-[#F2F2F2] rounded-lg p-2">{title}</p>
           <span>:</span>
           <p className='text-[#1A1A1A] border border-gray-300 rounded-lg p-2'>{value}</p>
        </div>
    );
}
const Specifications = ({label , specification}) => {
    const attributeSpec = (Array.isArray(specification) ? specification : []).filter(item=>item?.specification_id?.position !== 'extra')
   
    
    return (
        <div >
            <Title label={label} />
            <div className='grid grid-cols-2 mt-2 gap-3'>
                {
                    attributeSpec.length?
                    attributeSpec.map((item,i)=>{

                        return<FeatureItem key={item._id || i}  title={item.specification_id?.title || ''} value={item.value} />
                    })
                    :''
                }
         
            
                </div>
        </div>
    );
};

export default Specifications;