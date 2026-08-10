import Image from "next/image"
import PagesTitle from "../components/main/cards/PagesTitle"
import MediaTitle from '../components/main/modules/MediaTitle/MediaTitle'
import ContentList from '../components/main/blog/ContentList.jsx'
import Slider from '../components/main/modules/Slider.jsx'
import BlogCard from '../components/main/cards/BlogCard.jsx'
import BlogComments from "../components/main/blog/BlogComments.jsx"
import { mediaUrl } from '../lib/data/stubs'
const Title = () => {
  return (
    <PagesTitle
      imagePosition={''}
      image={'/bbb.jpg'}
      alt={'aboutUs'}
      title={
        <p>
          مقاله و اخبار <span className='text-[#F4C111]'> شماره 1</span>
        </p>
      }
    />
  )
}
function BlogPage({blog , Suggestions}) {

  return (
    <div className='min-h-screen max-w-7xl lg:mx-auto md:mx-3  md:my-10'>
      <Title />
      <div className="flex flex-col max-lg:grid lg:flex-row items-start gap-7  md:px-0">
        <div
          className="lg:w-[calc(100%-300px)] w-full px-3">
          <MediaTitle
            direction='vertical'
            wrapperClassName="w-full"
            
            data={{
              description: {
                className: 'flex items-center gap-4',
                content: <>
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.61606 1.43585C4.65006 1.43585 1.43518 4.65073 1.43518 8.61673C1.43518 12.5827 4.65006 15.7976 8.61606 15.7976C12.5821 15.7976 15.7969 12.5827 15.7969 8.61673C15.7969 4.65073 12.5821 1.43585 8.61606 1.43585ZM8.62184 5.02629C9.81172 5.02629 10.7761 5.99068 10.7761 7.18055C10.7761 8.37043 9.81172 9.33482 8.62184 9.33482C7.43197 9.33482 6.46758 8.37043 6.46758 7.18055C6.46758 5.99068 7.43197 5.02629 8.62184 5.02629ZM8.61606 14.7205C7.02908 14.7205 5.57855 14.1101 4.49424 13.112C4.8102 12.121 5.62884 11.1803 7.38816 11.1803H9.84396C11.5961 11.1803 12.4147 12.1282 12.7379 13.112C11.6536 14.1101 10.203 14.7205 8.61606 14.7205Z" fill="#105238" />
                    </svg>
                    {blog?.author_id?.nickname || 'بدون نام'}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.865 7.00144H2.37037C2.25117 7.00144 2.15491 7.0977 2.15491 7.2169V12.9257C2.15491 14.3618 2.873 15.0799 4.30917 15.0799H12.9262C14.3624 15.0799 15.0805 14.3618 15.0805 12.9257V7.2169C15.0805 7.0977 14.9842 7.00144 14.865 7.00144ZM10.7935 9.95567L8.40013 12.3491C8.29529 12.4539 8.1574 12.507 8.01953 12.507C7.88165 12.507 7.74376 12.4546 7.63892 12.3491L6.44187 11.152C6.23147 10.9423 6.23147 10.6005 6.44187 10.3901C6.65227 10.1797 6.99339 10.1797 7.20379 10.3901L8.02023 11.2058L10.033 9.19305C10.2434 8.98265 10.5845 8.98265 10.7949 9.19305C11.0053 9.40345 11.0039 9.74527 10.7935 9.95567ZM15.0805 5.38574V5.70885C15.0805 5.82805 14.9842 5.92431 14.865 5.92431H2.37037C2.25117 5.92431 2.15491 5.82805 2.15491 5.70885V5.38574C2.15491 3.94957 2.873 3.23148 4.30917 3.23148H5.20678V2.15435C5.20678 1.85993 5.45093 1.61578 5.74535 1.61578C6.03976 1.61578 6.28391 1.85993 6.28391 2.15435V3.23148H10.9515V2.15435C10.9515 1.85993 11.1956 1.61578 11.49 1.61578C11.7845 1.61578 12.0286 1.85993 12.0286 2.15435V3.23148H12.9262C14.3624 3.23148 15.0805 3.94957 15.0805 5.38574Z" fill="#105238" />
                    </svg>

                    {new Date(blog?.createdAt).toLocaleDateString('fa-IR')}
                  </div>
                </>
              },
              mediaElement: {
                className: 'w-full!  rounded-3xl object-cover aspect-[4/1.5]',
                component: Image,
                props: {
                  alt: 'example',
                  src: blog?.thumbnail_id?.[0].url ? mediaUrl(blog?.thumbnail_id?.[0].url) : '/bbb.jpg',
                  width: 500,
                  height: 300

                }
              }
            }}
          />
          <div className="mt-4 lg:hidden block w-full ">
          <ContentList />
          </div>
          <div dangerouslySetInnerHTML={{__html:blog?.content}} className="editor mt-3">
           
          </div>
          <BlogComments blog_id={blog?._id}/>
        </div>
        <aside className="md:w-[310px] lg:sticky  flex flex-col max-lg:items-center gap-4 top-5">
        <div className="mt-4 hidden lg:block">
          <ContentList />
          </div>
          <div className=" bg-[#F3F3F3]   rounded-2xl p-4">
            <p className="mb-3 font-extrabold">پیشنهاد مطالعه</p>
            <Slider
            className={'h-[420px]!'}
            gap={20}
            width={280}
              slides={
               (Suggestions || [])?.map(item=>{
                return <BlogCard data={item} key={item._id}/>
               })
              }
            />
          </div>
        </aside>
      </div>
    </div>
  )
}

export default BlogPage
