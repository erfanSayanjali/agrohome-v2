'use client';

import Title from "./Title";
import Form from "./Form.jsx";
import Rating from "@mui/material/Rating";
import { useEffect, useState } from "react";
import { getProductComments, submitComment } from "../../../lib/data/stubs";
import { UseSwal } from "../../../utils/helper.js";
import { IoClose } from "react-icons/io5";
const inputs = [
    { value: '', id: 'fullName', placeholder: 'نام و نام خانوادگی', colspan: 1 },
    { value: '', id: 'phone', placeholder: 'شماره تماس', colspan: 1 },
    { value: '', id: 'website', placeholder: 'وبسایت', colspan: 1 },
    { value: '', id: 'email', placeholder: 'ایمیل', colspan: 1 },
    { value: '', id: 'message', placeholder: 'پیام شما', colspan: 2 },
]
const CommentItem = ({ name, rate, text, date, replies, order = 1, id }) => {

    const [replay, setReplay] = useState({ comment_id: '', modal: false })


    return (
        <div className={`bg-[#F1F1F1] p-5 rounded-2xl ${order === 2 ? 'border mt-4 border-gray-300' : ''} relative`}>
            {
                (replay.modal && replay.comment_id) ?
                    <div className="fixed top-0 right-0 w-full h-full bg-black/40 z-50 flex items-center justify-center">
                        <div className="flex items-start gap-5 relative bg-white p-5 pt-10 rounded-2xl">
                            <IoClose className="absolute top-3"
                                cursor={'pointer'}
                                onClick={() => setReplay(prev => ({ ...prev, modal: false }))}
                            />

                            <Form
                            className='w-full'
                                onClick={async (data) => {

                                    try {
                                        let sendData = {
                                            targetType: "comment",
                                            target_id: id,
                                            parentId: id,
                                            content: data.find(item => item.id === 'message').value,
                                            nickName: data.find(item => item.id === 'fullName').value,
                                            email: data.find(item => item.id === 'email').value,
                                            website: data.find(item => item.id === 'website').value,

                                        }

                                        await submitComment(sendData)
                                        UseSwal('success', 'نظر شما با موفقیت ثبت شد و پس از تایید منتشر میشود')
                                        setReplay(prev => ({ ...prev, modal: false }))
                                    } catch (error) {
                                        UseSwal('error', error.response?.data?.message || error.message || '')

                                    } finally {
                                    }

                                }}
                                data={inputs} />

                        </div>
                    </div>
                    : ''
            }
            <div className="flex items-center gap-3 mb-2 justify-between">
                <p>{name}</p>
                <p className="text-sm text-gray-500">
                    {new Date(date).toLocaleDateString('fa-IR')}
                </p>
            </div>
            {order !== 2 && <Rating dir={'ltr'} size="small" readOnly defaultValue={rate} />}
            <div className="flex items-end  gap-5 justify-between">
                <p className="text-sm text-justify mt-2">
                    {text}
                </p>
                {order !== 2 && <button

                    onClick={() => {
                        setReplay(prev => ({ ...prev, modal: true, comment_id: id }))
                    }}

                    className="text-xs mt-2 cursor-pointer text-nowrap">پاسخ به این نظر</button>}
            </div>
            {
                replies?.length ?
                    replies.map(item => {

                        return <CommentItem order={2} key={item._id || item.id} id={item._id || item.id} replies={item.replies} name={item.nickName} rate={item.rating} text={item.content} date={item.createdAt} />
                    })
                    : ''
            }
        </div>
    )
}
const Comments = ({ label, product_id }) => {
    const [state, setState] = useState({ comments: [], loading: true, rating: '3', sendLoading: false })
    const getProductComment = async () => {
        setState(prev => ({ ...prev, loading: true }))
        try {
            const res = await getProductComments(product_id)
            setState(prev => ({ ...prev, comments: res.content || [] }))
        } catch (error) {
            UseSwal('error', error.response?.data || error.message);
        }
        setState(prev => ({ ...prev, loading: false }))
    }
    useEffect(() => {
        if (!product_id) {
            setState(prev => ({ ...prev, comments: [], loading: false }))
            return
        }
        getProductComment()
    }, [product_id])


    return (
        <div >
            <Title label={label} />
            <Rating dir="ltr" size="medium" onChange={e => { setState(prev => ({ ...prev, rating: e.target.value })) }} defaultValue={Number(state.rating) || 3} />
            <div className="flex flex-col md:flex-row items-start gap-5">

                <Form
                    className='w-full'
                    onClick={async (data) => {
                        setState(prev => ({ ...prev, sendLoading: true }))

                        try {
                            let sendData = {
                                targetType: "product",
                                target_id: product_id,
                                productId: product_id,
                                content: data.find(item => item.id === 'message').value,
                                nickName: data.find(item => item.id === 'fullName').value,
                                email: data.find(item => item.id === 'email').value,
                                website: data.find(item => item.id === 'website').value,
                                rating: Number(state.rating) || undefined,
                            }
                            await submitComment(sendData)
                            UseSwal('success', 'نظر شما با موفقیت ثبت شد و پس از تایید منتشر میشود')
                        } catch (error) {
                            UseSwal('error', error.response?.data?.message || error.message || '')

                        } finally {
                            setState(prev => ({ ...prev, sendLoading: false }))
                        }

                    }}
                    data={inputs} />
                <div className="w-full flex flex-col gap-3">
                    {
                        state.comments.length ?
                            state.comments.map(item => {


                                return <CommentItem id={item._id || item.id} key={item._id || item.id} replies={item.replies} name={item.nickName} rate={item.rating} text={item.content} date={item.createdAt} />
                            })
                            :
                            <div className="w-full border rounded-2xl h-full p-20 flex items-center justify-center border-gray-200 text-xs">
                                بدون نظر
                            </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default Comments;