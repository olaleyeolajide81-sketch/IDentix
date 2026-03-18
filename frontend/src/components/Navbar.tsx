import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletIcon, UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { connectStellarWallet, disconnectStellarWallet } from '../services/stellar';

const Navbar: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      const address = await connectStellarWallet();
      if (address) {
        setIsConnected(true);
        setWalletAddress(address);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  const handleConnect = async () => {
    try {
      const address = await connectStellarWallet();
      setIsConnected(true);
      setWalletAddress(address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectStellarWallet();
      setIsConnected(false);
      setWalletAddress('');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">IDentix</span>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/identity"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/identity')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Identity
              </Link>
              <Link
                to="/verification"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/verification')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Verification
              </Link>
              <Link
                to="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/profile')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Profile
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <WalletIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <WalletIcon className="h-5 w-5" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
