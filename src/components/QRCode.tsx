import React from 'react';
import QRCode from 'qrcode';

type QRCodeProps = {
  url: string;
  size?: number;
  color?: string;
};

const QRCodeComponent: React.FC<QRCodeProps> = ({ url, size = 180, color = '#ff6f61' }) => {
  const [dataUrl, setDataUrl] = React.useState<string>('');

  React.useEffect(() => {
    QRCode.toDataURL(url, { width: size, color: { dark: color, light: '#FFFFFF' } })
      .then(setDataUrl)
      .catch(console.error);
  }, [url, size, color]);

  return dataUrl ? <img src={dataUrl} alt="QR code" width={size} height={size} /> : null;
};

export default QRCodeComponent;
