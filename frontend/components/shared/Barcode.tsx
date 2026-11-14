import styles from './Barcode.module.css';

type BarcodeProps = { width?: 'short' | 'long'; className?: string };

// Decorative instrument texture. It carries no data, so screen readers skip it.
const Barcode = ({ width = 'short', className }: BarcodeProps) => {
  return <span aria-hidden="true" className={[styles.barcode, styles[width], className].filter(Boolean).join(' ')} />;
};

export default Barcode;
