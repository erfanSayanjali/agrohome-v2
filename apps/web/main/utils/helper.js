
import Swal from "sweetalert2"
import * as faIcon from 'react-icons/fa'

 const GenerateIcon = ({icon}) =>{
    const IconComponent  = faIcon[icon]
    return <IconComponent/>
}
export default GenerateIcon
const NETWORK_ERROR_RE =
    /failed to fetch|networkerror|network request failed|load failed|fetch failed|aborted|timeout|econnrefused|enotfound|typeerror/i;

export function getCommentErrorMessage(
    error,
    fallback = "ثبت نظر ناموفق بود. لطفاً دوباره تلاش کنید."
) {
    const data = error?.response?.data;
    const raw =
        (typeof data?.message === "string" && data.message) ||
        (typeof data === "string" && data) ||
        (typeof error?.message === "string" && error.message) ||
        "";
    const text = String(raw).trim();
    if (NETWORK_ERROR_RE.test(text)) {
        return "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.";
    }
    return text || fallback;
}

export const  UseSwal = (type , message , position = 'top-end') =>{
    const Toast = Swal.mixin({
        toast: true,
        position: position,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
      
        html: message,
        icon: type,
       
    });
}

export function showCommentError(error, fallback) {
    UseSwal("error", getCommentErrorMessage(error, fallback));
}


export const Slugify = (text) => {
    text = text.replace(/[\u200C\u200B]/g, ' '); // نیم‌فاصله (U+200C) و فاصله صفر عرض (U+200B) را جایگزین می‌کنیم
    text = text.replace(/\s+/g, '-');
    text = text.toLowerCase();
    return text;
  };
export const SlugifyFilter = (text) => {
    text = text.replace(/[\u200C\u200B]/g, ' '); // نیم‌فاصله (U+200C) و فاصله صفر عرض (U+200B) را جایگزین می‌کنیم
    text = text.replace(/\s+/g, '+');
    // text = text.toLowerCase();
    return text;
  };