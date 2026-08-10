import Link from "next/link";
import React, { ComponentType, JSX, useMemo, useCallback } from "react";

type Component = ComponentType<any>;
type blockType = 'date' | 'string' | 'number' | 'component';

type Block<T extends Component> = {
    props?: React.ComponentProps<T>;
    type?: blockType;
    tag?: keyof JSX.IntrinsicElements;
    component?: T;
    content?: string | JSX.Element;
    className?: string;
    priority?: 1 | 2 | 3 | 4 | 5 | 6;
};

type MediaTitleProps<T extends Component = Component> = {
    direction?: 'vertical' | 'horizontal';
    data: {
        title?: Block<T>;
        mediaElement?: Block<T>;
        description?: Block<T>;
        date?: Block<T>;
        actionBottom: Block<T>;
    };
    orderItems?: string[];
    Tag?: keyof JSX.IntrinsicElements;
    isLink?: boolean;
    href?: string;
    wrapperClassName: string;
    className?: string;
    loading?: boolean;
};

// خارج از کامپوننت
const blockTypeHandlers: Record<blockType, (value: any) => any> = {
    date: (value: Date) => value ? new Date(value).toLocaleDateString('fa-IR') : '',
    number: (value: number) => value,
    string: (value: string) => value,
    component: (value: any) => value,
};

const MediaTitle = <T extends Component = Component>({
    data,
    direction = 'horizontal',
    Tag = "div",
    isLink,
    className,
    href,
    wrapperClassName,
    loading = false,
}: MediaTitleProps<T>) => {
    const { title, mediaElement, description, date, actionBottom } = data;

    const totalBlocks = useMemo(() => [title, description, date, actionBottom].filter(Boolean).length, [title, description, date, actionBottom]);
    const rowsClass = {
        1: "grid-rows-[repeat(1,max-content)]",
        2: "grid-rows-[repeat(2,max-content)]",
        3: "grid-rows-[repeat(3,max-content)]",
        4: "grid-rows-[repeat(4,max-content)]",
        5: "grid-rows-[repeat(5,max-content)]",
        6: "grid-rows-[repeat(6,max-content)]",
        7: "grid-rows-[repeat(7,max-content)]",
        8: "grid-rows-[repeat(8,max-content)]",
        9: "grid-rows-[repeat(9,max-content)]",
        10: "grid-rows-[repeat(10,max-content)]",
    }[totalBlocks];

    const renderBlock = useCallback((block?: Block<T>) => {
        if (!block) return null;
        const PriorityClass = {
            1: "row-start-1",
            2: "row-start-2",
            3: "row-start-3",
            4: "row-start-4",
            5: "row-start-5",
            6: "row-start-6",
            7: "row-start-7",
            8: "row-start-8",
            9: "row-start-9",
            10: "row-start-10",
        }[block.priority as number];
        const orderClass = block.priority ? PriorityClass : '';
        const BlockTag = block.component || block.tag || "div";
        const BlockType = block.type || 'string';
        const TypeComponent = blockTypeHandlers[BlockType];

        // اگر loading = true، اسکلتون نمایش بده
        if (loading) {
            return (
                <BlockTag {...block.props} className={`${block.className || ''} ${orderClass} bg-gray-300 animate-pulse rounded-md h-5 w-full`.trim()} aria-hidden="true" />
            );
        }

        return (
            <BlockTag {...block.props} className={`${block.className || ''} ${orderClass}`.trim()}>
                {TypeComponent(block.content)}
            </BlockTag>
        );
    }, [loading]);

    const content = (
        <>
            {mediaElement && renderBlock({ ...mediaElement, className: `${mediaElement.className ?? ''} row-span-full` })}
            {renderBlock(title)}
            {renderBlock(description)}
            {renderBlock(date)}
            {renderBlock(actionBottom)}
        </>
    );

    const mainClassName = `grid ${wrapperClassName} ${direction === 'horizontal' ? 'grid-cols-[max-content_1fr]' : ''} ${rowsClass} gap-2`;

    return (
        <Tag className={className} aria-busy={loading}>
            {isLink && href ? (
                <Link href={href} className={mainClassName}>
                    {content}
                </Link>
            ) : (
                <div className={mainClassName}>
                    {content}
                </div>
            )}
        </Tag>
    );
};

export default React.memo(MediaTitle);
