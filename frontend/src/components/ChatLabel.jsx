import Image from 'next/image'
import React, { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom';
import { assets } from "@/assets/assets";
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

const ChatLabel = ({ openMenu, setOpenMenu, id, name }) => {
  const { fetchUsersChats, chats, setSelectedChat, selectedChat } = useAppContext();
  const router = useRouter();
  const { getToken } = useAuth();
  
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const isMenuOpen = openMenu.id === id && openMenu.open;

  useEffect(() => {
    const updatePosition = () => {
      if (isMenuOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.right + 10 
        });
      }
    };

    if (isMenuOpen) {
      updatePosition();
      const handleClickOutside = () => setOpenMenu({ id: 0, open: false });
      window.addEventListener('resize', updatePosition);
      setTimeout(() => window.addEventListener('click', handleClickOutside), 0);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isMenuOpen, setOpenMenu]);

  // FIX: Added event parameter and stopPropagation
  const selectChat = (e) => {
    e.stopPropagation(); // Yeh sidebar ko close hone se rokega
    const chatData = chats.find(chat => chat._id === id);
    setSelectedChat(chatData);
    router.push(`/chat/${id}`);
  }

  const deleteHandler = async (e) => {
    e.stopPropagation();
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this chat?');
      if (!confirmDelete) return;

      const token = await getToken();
      const { data } = await axios.post('/api/chat/delete', 
        { chatId: id }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setOpenMenu({ id: 0, open: false });
        await fetchUsersChats();
        if (selectedChat?._id === id) {
          setSelectedChat(null);
          router.push('/');
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div 
      onClick={selectChat} 
      className={`relative flex items-center justify-between p-2 text-white hover:bg-white/10 rounded-lg text-sm group cursor-pointer transition-all 
        ${isMenuOpen || selectedChat?._id === id ? 'bg-white/10' : ''}`}
    >
      <p className='truncate max-w-[75%]'>{name}</p>
      
      <div 
        ref={buttonRef}
        onClick={e => { 
          e.stopPropagation(); 
          setOpenMenu({ id: id, open: !isMenuOpen }) 
        }} 
        className='flex items-center justify-center h-6 w-6 rounded-lg hover:bg-black/40 transition-colors'
      >
        <Image 
          src={assets.three_dots} 
          alt='menu' 
          className={`w-4 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} 
        />
      </div>

      {isMenuOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed w-32 rounded-xl shadow-2xl border border-gray-700 overflow-hidden"
          style={{ 
            backgroundColor: '#2c2e33',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 9999 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-1 flex flex-col gap-0.5">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu({ id: 0, open: false });
              }} 
              className='flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer transition-colors'
            >
              <Image src={assets.pencil_icon} alt='' className="w-3" />
              <p className="text-[11px] font-medium text-gray-200">Rename</p>
            </div>
            
            <div 
              onClick={deleteHandler} 
              className='flex items-center gap-3 hover:bg-red-500/10 px-3 py-2 rounded-lg text-red-400 cursor-pointer transition-colors'
            >
              <Image src={assets.delete_icon} alt='' className="w-3" />
              <p className="text-[11px] font-medium">Delete</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default ChatLabel;