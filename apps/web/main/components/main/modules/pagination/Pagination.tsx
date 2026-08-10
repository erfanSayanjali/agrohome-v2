import { JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryManager } from '../../../../utils/QueryManager'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
type Buttons = JSX.Element | string;
type props = {
    className: string
    totalPages: number;
    NextButton?: Buttons,
    PrevButton?: Buttons,
    navigationButtonClass: string
    activeButtonClassName: string
    ButtonClassName: string
    ellipsisClassName:string
    ellipsis: Buttons
}
type ButtonsProps = {
    PrevButton?: React.ReactNode;
    NextButton?: React.ReactNode;
    navigationButtonClass?: string;
    currentPage: number;
    totalPages: number;
    query: {
        set: (v: Record<string, any>) => void;
    };
};

const PreviousButton = ({ PrevButton, navigationButtonClass, currentPage, totalPages, query }: ButtonsProps) => {
    if (PrevButton) {
        return (
            <div
                className={navigationButtonClass}
                onClick={() => currentPage > 1 && query.set({ page: currentPage - 1 })}>

                {PrevButton}

            </div>)
    } else {
        return (
            <div
                onClick={() => currentPage > 1 && query.set({ page: currentPage - 1 })}
                className={`${currentPage === 1 ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'} bg-[#7c7c7c] w-[30px] h-[30px] flex items-center justify-center rounded-md`}>
                {
                    PrevButton || <MdKeyboardArrowRight color='#fff' fontSize={20} />
                }
            </div>
        )
    }

}
const NextButtonMain = ({ NextButton, navigationButtonClass, currentPage, totalPages, query }: ButtonsProps) => {
    if (NextButton) {
        return (
            <div
                className={navigationButtonClass}
                onClick={() => currentPage < totalPages && query.set({ page: currentPage + 1 })}>

                {NextButton}

            </div>
        )
    } else {
        return (
            <div
                onClick={() => currentPage < totalPages && query.set({ page: currentPage + 1 })}
                className={`${currentPage === totalPages ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'} bg-[#7c7c7c] w-[30px] h-[30px] flex items-center justify-center rounded-md`}>
                <MdKeyboardArrowLeft color='#fff' fontSize={20} />
            </div>
        )
    }

}

function Pagination({ totalPages, ButtonClassName, activeButtonClassName, navigationButtonClass, NextButton, PrevButton, className }: props) {
    const query = useQueryManager()
    const [currentPage, setCurrentPage] = useState(1)
    const updatePage = useCallback(() => {
        const current: number = +query.get('page')!
        setCurrentPage(current)
    }, [query.get('page')])
    useEffect(() => {
        updatePage()
    }, [query.get('page')])


    return (
        <div className={`flex items-center gap-3 [&_p]:w-[30px] [&_p]:h-[30px] [&_p]:cursor-pointer [&_p]:flex [&_p]:items-center [&_p]:justify-center [&_p]:text-lg [&_p]:font-bold ${className}`}>
            {/* Previous Button */}

            <PreviousButton PrevButton={PrevButton} currentPage={currentPage} navigationButtonClass={navigationButtonClass} query={query} totalPages={totalPages} key={'prev'} />


            {/* Pagination Numbers */}
            {(() => {
                const total = totalPages || 0;
                const current = currentPage || 1;
                const pages = [];

                if (current > 3) {
                    pages.push(1);
                    if (current > 3) pages.push('start-ellipsis');
                }

                for (let i = current - 1; i <= current + 1; i++) {
                    if (i > 0 && i <= total) pages.push(i);
                }

                if (current + 2 < total) {
                    pages.push('end-ellipsis');
                    pages.push(total);
                }



                return pages.map((p, idx) => {
                    if (p === 'start-ellipsis' || p === 'end-ellipsis')
                        return <span key={idx} className='text-[#7c7c7c] font-extrabold text-xs md:text-xl'>...</span>;
                    if (p === current)
                        return <p key={idx} className={activeButtonClassName || 'bg-[#7c7c7c] text-xs md:text-base rounded-md text-white'}>{p.toLocaleString('fa-IR')}</p>;
                    return <p className={ButtonClassName || 'text-xs md:text-base'} key={idx} onClick={() => query.set({ page: p })}>{p.toLocaleString('fa-IR')}</p>;
                });
            })()}

            {/* Next Button */}
            {
                <NextButtonMain NextButton={NextButton} currentPage={currentPage} navigationButtonClass={navigationButtonClass} query={query} totalPages={totalPages} key={'next'} />
            }
        </div>
    )
}

export default Pagination
