'use client';

import { useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function useQueryManager() {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const get = (key: string) => {
    return searchParams.get(key);
  };

  const getAll = () => {
    return Object.fromEntries(new URLSearchParams(searchParams).entries().toArray());
  };
  const toString = (query: { [key: string]: string }) => {
    return `?${Object.entries(query).map(item => `${item[0]}=${item[1]}`).join('&')}`
  }

  const getAllParams = () => {
    const entries: Record<string, string> = {};
    searchParams.forEach((value: string, key: string | number) => {
      entries[key] = value;
    });
    return entries;
  };

  const set = (
    entries: Record<string, string | number | undefined>,
    options: {
      replace?: boolean;
      multi?: boolean | string[];
      targetUrl?: string;
      scroll?: boolean;
    } = {}
  ) => {
    const params = new URLSearchParams(searchParams);
    if (options.multi === true) {
      Object.entries(entries).forEach(([key, value]) => {
        let queryvalue = params.get(key) as string
        if (params.get(key)?.split(' ')?.includes(value as string)) {
          console.log(params.get(key));

          console.log(queryvalue.split(' ').filter(item => item !== value).join(' '));

          queryvalue = queryvalue.split(' ').filter(item => item !== value).join(' ')
        } else {

          queryvalue = queryvalue ? queryvalue + ' ' + value : value as string



        }
        if (queryvalue) {
          params.set(key, String(queryvalue));

        } else {
          params.delete(key);
        }
      });
    }
    else {
      Object.entries(entries).forEach(([key, value]) => {

        if (Array.isArray(options.multi) && options.multi.includes(key)) {
          let queryvalue = params.get(key) as string
          if (params.get(key)?.split(' ')?.includes(value as string)) {
            console.log(params.get(key));
  
            console.log(queryvalue.split(' ').filter(item => item !== value).join(' '));
  
            queryvalue = queryvalue.split(' ').filter(item => item !== value).join(' ')
          } else {
  
            queryvalue = queryvalue ? queryvalue + ' ' + value : value as string
  
  
  
          }
          if (queryvalue) {
            params.set(key, String(queryvalue));
  
          } else {
            params.delete(key);
          }

        } else {
          if (value == undefined || value == '{}' || value === '') {
            params.delete(key);
          } else {
            params.set(key, String(value));
          }
        }
      }
      );
    }
    const url = `${options.targetUrl || pathname}?${params.toString()}`;
    const scroll = options.scroll ?? true;
    startTransition(() => {
      if (options.replace) {
        router.replace(url, { scroll });
      } else {
        router.push(url, { scroll });
      }
    });
  };

  const remove = (keys: string | string[], options: { scroll?: boolean } = {}) => {
    const params = new URLSearchParams(searchParams);
    if (Array.isArray(keys)) {
      keys.forEach((key) => params.delete(key));
    } else {
      params.delete(keys);
    }
    const url = `${pathname}?${params.toString()}`;
    const scroll = options.scroll ?? false;
    startTransition(() => {
      router.push(url, { scroll });
    });
  };

  return { get, getAll, getAllParams, set, remove, toString };
}
