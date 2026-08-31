'use client';
import Info from '../components/main/product/Info';
import Navigation from '../components/main/product/Navigation.jsx';
import Description from '../components/main/product/Description.jsx';
import Specifications from '../components/main/product/Specifications.jsx';
import Comments from '../components/main/product/Comments.jsx';
import Slider from '../components/main/modules/Slider.jsx';
import ProductCard from '../components/main/cards/ProductCard.jsx';
import Title from '../components/main/product/Title.jsx';
import { sanitizeHtml } from '../utils/sanitize';


const ProductPage = ({
    slug,
    data = null,
    specification = [],
    similarProducts = [],
}) => {
    if (!data) return null;
    const safeSpecification = Array.isArray(specification) ? specification : [];
    const extraSpec = safeSpecification.filter(item => item?.specification_id?.position === 'extra')

    const NavigationItems = [
        { label: 'معرفی', key: 'description', section: Description },
        { label: ' مشخصات', key: 'specifications', section: Specifications },
        ...extraSpec.map(item => ({
            label: item.specification_id?.title, key: item.specification_id?.title || item._id, section:

                <div id={item.specification_id?.title}>
                    <Title label={item.specification_id?.title} />
                    <div className="editor" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.value) }} />
                </div>

            , type: 'jsx'
        })),
        { label: 'نظرات', key: 'comments', section: Comments },
    ]
    const script = data?.gallery?.find(item => item.type === 'script')




    return (
        <div className='min-h-screen max-w-7xl lg:mx-auto mx-3 md:my-20 my-5'>

            <Info slug={slug} data={data} specification={specification} />
            <Navigation data={data} NavigationItems={NavigationItems} />
            <div className='flex flex-col gap-20 mt-10 '>
                {
                    NavigationItems.map((item, index) => {
                        const Section = item.section;
                        return (
                            <div key={index} id={item.key} className="-mt-26 pt-28">
                                {Section ? (
                                    item.type === 'jsx' ? item.section :
                                        <Section product_slug={data.slug} product_id={data._id} specification={specification} script={script?.content} label={item.label} data={data} />
                                ) : (
                                    <p>محتوای {item.label} اینجا قرار می‌گیرد.</p>
                                )}
                            </div>
                        );
                    })
                }
            </div>
            {similarProducts.length ? <div>
                <div>
                    <p className='text-xl font-extrabold mb-6 flex items-center gap-3 mt-20'>
                        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path opacity="0.4" d="M14.6352 17.2133C15.0211 17.3832 15.4226 17.4913 15.824 17.5839V32.2811C15.577 32.2193 15.33 32.1267 15.0984 32.0186L5.83546 27.8966C4.16813 27.1556 3.0874 25.5037 3.0874 23.6665V13.3847C3.0874 12.9678 3.14913 12.551 3.2572 12.165L14.6352 17.2133Z" fill="#308060" />
                            <path d="M18.4029 15.0835C17.492 15.4849 16.4575 15.4849 15.5621 15.0835L4.43115 10.1278C4.83255 9.7264 5.29575 9.38675 5.83609 9.15517L15.099 5.03318C16.3032 4.49284 17.6617 4.49284 18.8659 5.03318L28.1288 9.15517C28.6692 9.38675 29.1324 9.7264 29.5338 10.1278L18.4029 15.0835Z" fill="#308060" />
                            <path opacity="0.4" d="M30.8762 13.3851V17.6923C30.8762 18.0103 30.569 18.2172 30.2649 18.1231C29.388 17.8498 28.4523 17.7247 27.4704 17.7603C23.4488 17.9007 19.9582 20.9884 19.3885 24.973C19.086 27.0911 19.5492 29.0502 20.5588 30.6759C20.7086 30.9167 20.6237 31.2286 20.3659 31.3459L18.1983 32.3201C18.1689 32.3015 18.169 32.3016 18.1396 32.283V17.5858C18.541 17.4932 18.9425 17.3697 19.3284 17.2153L30.7064 12.167C30.8145 12.5514 30.8762 12.9682 30.8762 13.3851Z" fill="#308060" />
                            <path d="M27.7886 20.0693C24.3767 20.0693 21.6133 22.8328 21.6133 26.2446C21.6133 29.6565 24.3767 32.4199 27.7886 32.4199C31.2004 32.4199 33.9639 29.6565 33.9639 26.2446C33.9639 22.8328 31.2004 20.0693 27.7886 20.0693ZM30.2587 25.5036L27.6959 28.0818C27.5415 28.2207 27.3562 28.2979 27.1401 28.2979C26.9394 28.2979 26.7388 28.2207 26.5998 28.0818L25.3185 26.785C25.0097 26.4917 25.0097 25.9976 25.3185 25.7043C25.6118 25.3955 26.1058 25.3955 26.3991 25.7043L27.1401 26.4299L29.1781 24.4075C29.4714 24.1142 29.9653 24.1142 30.2587 24.4075C30.5674 24.7162 30.5674 25.1948 30.2587 25.5036Z" fill="#308060" />
                        </svg>

                        محصولات مرتبط
                    </p>

                </div>
                <Slider gap={20} width={'fit-content'} slides={similarProducts.map((product, index) => {
                    return <ProductCard
                        key={product?._id || index}

                        image={product?.thumbnail_id?.[0]?.url}
                        title={product?.title}
                        slug={product?.slug}
                        category={product?.category_id?.[0]?.title}

                    />
                })} />
            </div>
                : ""}
        </div>
    );
};

export default ProductPage;