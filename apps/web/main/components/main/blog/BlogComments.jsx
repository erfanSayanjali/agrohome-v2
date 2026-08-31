'use client';

import Title from "../product/Title";
import Form from "../product/Form.jsx";
import Rating from "@mui/material/Rating";
import Skeleton from "@mui/material/Skeleton";
import { useEffect, useState } from "react";
import { getBlogComments, submitComment } from "../../../lib/data/stubs";
import { UseSwal, showCommentError } from "../../../utils/helper.js";
import { IoClose } from "react-icons/io5";
import Pagination from "../modules/pagination/Pagination";
import { useQueryManager } from "../../../utils/QueryManager";

const inputs = [
    { value: '', id: 'fullName', placeholder: 'نام و نام خانوادگی', colspan: 1 },
    { value: '', id: 'phone', placeholder: 'شماره تماس', colspan: 1 },
    { value: '', id: 'website', placeholder: 'وبسایت', colspan: 1 },
    { value: '', id: 'email', placeholder: 'ایمیل', colspan: 1 },
    { value: '', id: 'message', placeholder: 'پیام شما', colspan: 2 },
];

const CommentItem = ({ name, rate, text, date, replies, order = 1, id }) => {
    const [replay, setReplay] = useState({ comment_id: '', modal: false });

    return (
        <div className={`bg-[#F1F1F1] p-5 rounded-2xl ${order === 2 ? 'border mt-4 border-gray-300' : ''} relative`}>
            {(replay.modal && replay.comment_id) ? (
                <div className="fixed top-0 right-0 w-full h-full bg-black/40 z-50 flex items-center justify-center">
                    <div className="flex items-start gap-5 relative bg-white p-5 pt-10 rounded-2xl">
                        <IoClose
                            className="absolute top-3"
                            cursor={'pointer'}
                            onClick={() => setReplay((prev) => ({ ...prev, modal: false }))}
                        />
                        <Form
                            onClick={async (data) => {
                                try {
                                    const sendData = {
                                        targetType: "comment",
                                        target_id: id,
                                        parentId: id,
                                        content: data.find((item) => item.id === 'message').value,
                                        nickName: data.find((item) => item.id === 'fullName').value,
                                        email: data.find((item) => item.id === 'email').value,
                                        website: data.find((item) => item.id === 'website').value,
                                    };
                                    await submitComment(sendData);
                                    UseSwal('success', 'نظر شما با موفقیت ثبت شد و پس از تایید منتشر میشود');
                                    setReplay((prev) => ({ ...prev, modal: false }));
                                } catch (error) {
                                    showCommentError(error);
                                }
                            }}
                            data={inputs}
                        />
                    </div>
                </div>
            ) : null}
            <div className="flex items-center gap-3 mb-2 justify-between">
                <p>{name}</p>
                <p className="text-sm text-gray-500">
                    {new Date(date).toLocaleDateString('fa-IR')}
                </p>
            </div>
            {order !== 2 && <Rating dir={'ltr'} size="small" readOnly defaultValue={rate} />}
            <div className="flex items-end gap-5 justify-between">
                <p className="text-sm text-justify mt-2">{text}</p>
                {order !== 2 && (
                    <button
                        onClick={() => setReplay((prev) => ({ ...prev, modal: true, comment_id: id }))}
                        className="text-xs mt-2 cursor-pointer text-nowrap"
                    >
                        پاسخ به این نظر
                    </button>
                )}
            </div>
            {replies?.length
                ? replies.map((item) => (
                    <CommentItem
                        order={2}
                        key={item._id || item.id}
                        id={item._id || item.id}
                        replies={item.replies}
                        name={item.nickName}
                        rate={item.rating}
                        text={item.content}
                        date={item.createdAt}
                    />
                ))
                : null}
        </div>
    );
};

const CommentSkeleton = () => (
    <div className="bg-[#F1F1F1] p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
            <Skeleton variant="text" width={120} height={22} />
            <Skeleton variant="text" width={80} height={18} />
        </div>
        <Skeleton variant="rounded" width={96} height={18} className="mb-3" />
        <Skeleton variant="text" width="100%" height={18} />
        <Skeleton variant="text" width="86%" height={18} />
        <Skeleton variant="text" width="62%" height={18} />
    </div>
);

const BlogComments = ({ label, blog_id }) => {
    const query = useQueryManager();
    const page = Math.max(1, Number(query.get('page')) || 1);
    const [state, setState] = useState({ comments: [], loading: true, rating: '3', sendLoading: false, totalPages: 1 });

    const loadComments = async () => {
        setState((prev) => ({ ...prev, loading: true }));
        try {
            const res = await getBlogComments(blog_id, { page, limit: 5 });
            setState((prev) => ({
                ...prev,
                comments: res.content || [],
                totalPages: res.meta?.totalPages || 1,
            }));
        } catch (error) {
            showCommentError(error, 'بارگذاری نظرات ناموفق بود. لطفاً صفحه را تازه کنید.');
        }
        setState((prev) => ({ ...prev, loading: false }));
    };

    useEffect(() => {
        if (!blog_id) {
            setState((prev) => ({ ...prev, comments: [], loading: false, totalPages: 1 }));
            return;
        }
        loadComments();
    }, [blog_id, page]);

    return (
        <div>
            <Title label={label} />
            <Rating
                dir="ltr"
                size="medium"
                onChange={(e) => setState((prev) => ({ ...prev, rating: e.target.value }))}
                defaultValue={Number(state.rating) || 3}
            />
            <div className="flex flex-col items-start gap-5">
                <Form
                    className={'w-full'}
                    onClick={async (data) => {
                        setState((prev) => ({ ...prev, sendLoading: true }));
                        try {
                            const sendData = {
                                targetType: "blog",
                                target_id: blog_id,
                                blogId: blog_id,
                                content: data.find((item) => item.id === 'message').value,
                                nickName: data.find((item) => item.id === 'fullName').value,
                                email: data.find((item) => item.id === 'email').value,
                                website: data.find((item) => item.id === 'website').value,
                                rating: Number(state.rating) || undefined,
                            };
                            await submitComment(sendData);
                            UseSwal('success', 'نظر شما با موفقیت ثبت شد و پس از تایید منتشر میشود');
                        } catch (error) {
                            showCommentError(error);
                        } finally {
                            setState((prev) => ({ ...prev, sendLoading: false }));
                        }
                    }}
                    data={inputs}
                />
                <div className="w-full flex flex-col gap-3">
                    {state.loading ? (
                        [1, 2, 3].map((item) => <CommentSkeleton key={item} />)
                    ) : state.comments.length ? (
                        state.comments.map((item) => (
                            <CommentItem
                                id={item._id || item.id}
                                key={item._id || item.id}
                                replies={item.replies}
                                name={item.nickName}
                                rate={item.rating}
                                text={item.content}
                                date={item.createdAt}
                            />
                        ))
                    ) : (
                        <div className="w-full border rounded-2xl h-full p-20 flex items-center justify-center border-gray-200 text-xs">
                            بدون نظر
                        </div>
                    )}
                    {!state.loading && state.totalPages > 1 ? (
                        <Pagination
                            className="mt-4"
                            NextButton="بعدی"
                            PrevButton="قبلی"
                            totalPages={state.totalPages}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default BlogComments;
