
import Swal from "sweetalert2"
import * as faIcon from 'react-icons/fa'

 const GenerateIcon = ({icon}) =>{
    const IconComponent  = faIcon[icon]
    return <IconComponent/>
}
export default GenerateIcon
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