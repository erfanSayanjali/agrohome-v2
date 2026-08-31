'use client';
import { ImPhone } from "react-icons/im";
import { GoMail } from "react-icons/go";
import PagesTitle from "../components/main/cards/PagesTitle";
import { FaInstagram } from "react-icons/fa6";
import Image from "next/image";
import Form from "../components/main/product/Form";

const inputs = [
    { value: '', id: 'fullName', placeholder: 'نام و نام خانوادگی', colspan: 1 },
    { value: '', id: 'subject', placeholder: 'موضوع', colspan: 1 },
    { value: '', id: 'email ', placeholder: 'ایمیل', colspan: 1 },
    { value: '', id: 'phone', placeholder: 'شماره تماس', colspan: 1 },
    { value: '', id: 'message', placeholder: 'پیام شما', colspan: 2 },
]
const SocialMediaLinks = ({title , link , icon}) =>{
    return(
        <a href={link}  className="flex items-center gap-2">
            {title}
           <div className="w-10 h-10 rounded-xl bg-[#105238] flex items-center justify-center text-white">
            {icon}
           </div>
        </a>

    )
}
const Title = () => {
    return (
        <PagesTitle
            imagePosition={''}
            image={'/c.jpg'}
            alt={'aboutUs'}
            title={
                <p>
                    تماس با <span className='text-[#F4C111]'>آگروهوم</span>
                </p>
            }
        />
    )
}
export default function ContactPage() {
return(
  <div className="min-h-screen max-w-7xl lg:mx-auto md:mx-3 md:my-10">
   <Title />
   <h1 className="mb-4 mt-0 px-3 text-xl font-extrabold md:px-0 md:text-2xl">
   لورم ایپسوم متن نمایشی با تولید ساختگی نامفهوم
   </h1>
   <p className="leading-relaxed text-justify text-gray-600 px-3 md:px-0">
   لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجـــــله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می‌باشد، کتابهای زیادی در شصت و سه درصد گذشــــــــــــته حال و آینــــده، شناخت فراوان جامعه و متخصصان را می طلبد، تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی، و فرهنگ پیشرو در زبان فارسی ایجاد کرد، در ایــــــــن صورت می توان امید داشت که تمام و دشواری موجود در ارائه راهکارها، و شرایط سخت تایپ به پایان رسد..
   </p>
   <div className="flex flex-col md:flex-row md:justify-end items-center mt-10 gap-6">
    <SocialMediaLinks  icon={<GoMail fontSize={20}/>} link={'#'}  title={'info@codeino.com'}/>
    <SocialMediaLinks  icon={<ImPhone fontSize={20}/>} link={'#'}  title={'021-28428343'}/>
    <SocialMediaLinks  icon={<FaInstagram  fontSize={20}/>} link={'#'}  title={'info@codeino.com'}/>
   </div>
   <div className="md:flex grid px-3 md:px-0 items-start gap-10 mt-20 md:h-[420px] ">
    <div className="md:w-[230px] overflow-hidden w-full h-full bg-[#105238] rounded-xl p-7 relative">
        <p className="text-[#F4C111] text-center mb-2 text-lg">7 روز هفتــه</p>
        <p className="text-white font-extrabold text-center">
        پاسخگـوی شمــا
        هستیـــم…
        </p>
        <Image src={'/ccc.png'} className="max-md:w-[200px] mx-auto" alt="contact" width={500} height={300}/>
        <Image className="absolute bottom-0" alt="shape-1" src={'/ccs.png'} width={500} height={300}/>
        <Image alt="shape-2" className="absolute top-0 right-0 rotate-180" src={'/ccs.png'} width={150} height={300}/>

    </div>
    <div className="md:p-10 p-3 row-start-1 bg-[#F3F3F3] h-full md:w-[calc(100%-450px)] rounded-2xl">
        <p className="md:text-lg font-extrabold">سوال، درخواست یا پیشنهادی دارید؟ بنویسید..</p>
            <Form
             className={'w-full  mt-4 [&>input]:bg-white [&>textarea]:bg-white'}
            submitBtn={<button className='w-fit self-end !justify-self-end bg-green-800 flex items-center gap-2 text-white p-3 rounded-2xl mt-2 hover:bg-green-900 transition-colors cursor-pointer col-span-2 '>
                 ارسال پیام
                </button>
                }
            data={inputs}/>
     
    </div>
    <iframe className="md:w-[230px] w-full h-full" src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3239.668737981355!2d51.38996823122519!3d35.709768587810444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfa!2suk!4v1763887018510!5m2!1sfa!2suk" width="600" height="450"  allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
   </div>
  </div>
)
}