// components/FarsiNumber.jsx
export default function FarsiNumber({ children }) {
    const convert = (number) => number?.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
    return <>{convert(children)}</>;
  }
  