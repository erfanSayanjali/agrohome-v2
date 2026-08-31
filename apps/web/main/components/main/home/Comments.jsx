import React from 'react';
import Rating from '@mui/material/Rating';
import Slider from '../modules/Slider';
const Comment = ({ rate, text, user = { name: '' } }) => {
    return (
        <div className=' w-[290px] h-[210px] flex p-5 px-7 flex-col bg-white rounded-4xl'>
            <div dir='ltr' className='w-fit'>
                <Rating name="comment-rating" readOnly defaultValue={rate} precision={1} />
            </div>
            <p className='text-sm h-full  text-justify line-clamp-4'>
                {
                    text
                }
            </p>
            <hr className='border-dashed border-[#B1D082] my-4' />

            <p className=' text-gray-600 h-fit justify-self-end'>
                {user.name}
            </p>

        </div>
    )
}


const Comments = ({comments = [], cms} = {}) => {
    const title = cms?.title || 'نظرات و رضایت مشتریان از محصولات ما';
    const list = (Array.isArray(comments) ? comments : []).filter(
        (c) => c.showOnHome === true,
    );

    if (!list.length) return null;

    return (
        <div className={`bg-[#E9F2EA] overflow-x-clip`}>

            <div className='max-w-7xl lg:mx-auto mx-3 md:py-20 py-10'>
                <p className='text-xl font-extrabold whitespace-pre-line'>
                    {title}
                </p>
                <div className='mt-10'>
                    <Slider gap={20} className='!h-[260px]' width={'300px'} slides={
                        list.map(comment=>
                            <Comment
                              key={comment._id || comment.id}
                              rate={comment.rating}
                              text={comment.content}
                              user={{ name: comment.nickName || comment.user?.name || '' }}
                            />,
                        )
                    } />
                </div>
            </div>

        </div>
    );
};

export default Comments;