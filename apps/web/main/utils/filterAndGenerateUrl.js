export const filterAndGenerateUrl = async (searchParams, add = [], single) => {
    const paramsObj = Object.fromEntries(Object.entries(await searchParams).filter(([_, value]) => value));

    if (!add) {
        return `${window.location.pathname}?${new URLSearchParams(paramsObj).toString()}`;
    }
    
    const requaredParams = ['page']
    
    add.forEach(([key , value]) => {
        if(single){
            paramsObj[key] = value
        }
    });
   
    return `?${new URLSearchParams(paramsObj).toString()}`;
    
    // if (existingValues.includes(value)) {
    //     paramsObj[key] = existingValues.filter((item) => item !== value).join(' ');
    //     if (!paramsObj[key]) delete paramsObj[key];
    // } else {
    //     paramsObj[key] = [...existingValues, value].join(' ');
    // }

    // return `${window.location.pathname}?${new URLSearchParams(paramsObj).toString()}`;
};
