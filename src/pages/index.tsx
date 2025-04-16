import React from 'react';
import Link from 'next/link';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Parking Lot Management System</h1>
      
      <div className="flex flex-col space-y-4">
        <Link href="/parking" className="text-blue-500 hover:underline">
          Go to Parking Lot Interface
        </Link>
        
        <Link href="/api/parking" className="text-blue-500 hover:underline">
          View Parking Lot API
        </Link>
      </div>
    </div>
  );
}

export default Home;
