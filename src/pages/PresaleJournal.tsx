import React from 'react';
import QRCode from '../components/QRCode';

const AMAZON_PREORDER_URL = import.meta.env.VITE_AMAZON_PREORDER_URL || 'https://www.amazon.com/dp/B0GGV8FQCM?utm_source=presale&utm_medium=amazon&utm_campaign=journal_launch&utm_term=serenity_scrolls_journal';

const PresaleJournal: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-6">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">Serenity Scrolls Journal – Pre‑order</h1>
      <p className="text-lg text-gray-700 mb-6 max-w-2xl text-center">
        Discover the magical world of Serenity Scrolls before anyone else. Pre‑order now and be among the first to receive the journal when it launches on Amazon.
      </p>
      <a
        href={AMAZON_PREORDER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
      >
        Pre‑order on Amazon
      </a>
      <div className="mt-8 flex flex-col items-center">
        <QRCode url="https://serenityscrolls.faith/unlock" size={180} />
        <p className="text-sm text-gray-600 mt-4 text-center max-w-sm">Scan the QR code on your insert card to unlock the Serenity Scrolls Servant.</p>
      </div>
    </div>
  );
};

export default PresaleJournal;
