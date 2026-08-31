'use client'

import VideoPlayer from "../modules/VideoPlayer";
import Title from "./Title";
import { sanitizeHtml } from "../../../utils/sanitize";

const Description = ({ label, data, videoURL, script }) => {
    return (
        <div className="flex flex-col w-full items-start gap-3 text-sm text-gray-600 font-semibold">
            <div className="rounded-3xl shadow-[0px_0px_30px_rgba(0,0,0,0.04)] bg-white p-6 w-full">
                <Title label={label || 'توضیحات محصول'} />
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.description) }} className="editor productDesc text-[#1A1A1A]! text-justify! leading-relaxed!">
                </div>
            </div>
            {
                script ?
                <div className="w-full md:h-[500px] flex items-center justify-center mt-10 bg-black rounded-2xl">
 <div className=" md:w-[700px]! w-[300px]  rounded-2xl  "  dangerouslySetInnerHTML={{__html: sanitizeHtml(script, { allowIframe: true })}}/>
                </div>
                : videoURL ?
                <VideoPlayer poster={'/'} url={videoURL} className="w-full mt-10 h-[400px]" />:''
            }
        </div>
    );
};

export default Description;